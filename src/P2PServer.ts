import WebSocket from 'ws';
import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';
import { Block } from './Block';
import { Logger } from './Logger';

// Define message types to avoid string literal errors
enum MessageType {
    QUERY_LATEST = 0,
    QUERY_ALL = 1,
    RESPONSE_BLOCKCHAIN = 2,
    BROADCAST_TRANSACTION = 3,
    QUERY_PEERS = 4,
    RESPONSE_PEERS = 5,
    ANNOUNCE_SELF = 6,
    RESET_CHAIN = 7,
    PING = 8,
    PONG = 9
}

interface P2PMessage {
    type: MessageType;
    data?: any; // We will further refine this in the handlers
}

/**
 * Extended WebSocket interface to track peer metadata without 'any' casting.
 */
interface P2PSocket extends WebSocket {
    peerAddress?: string;
    isOutgoing?: boolean;
    missedPings?: number;
}

export class P2PServer {
    private sockets: P2PSocket[] = [];
    private peerUrls: Set<string> = new Set();
    private blockchain: Blockchain;
    private myAddress: string | null = null;
    private wss: WebSocket.Server | null = null;
    private heartbeatInterval: NodeJS.Timeout | null = null;
    private HEARTBEAT_DELAY = 5000; // 5 seconds
    private MAX_MISSED_PINGS = 3;

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
    }

    /**
     * Start the P2P server to listen for incoming connections from peers
     */
    public listen(port: number, host: string = 'localhost'): void {
        this.wss = new WebSocket.Server({ port });
        this.myAddress = `ws://${host}:${port}`;

        this.wss.on('connection', (socket) => {
            this.initConnection(socket);
        });

        this.startHeartbeat();

        Logger.log(`Listening for P2P connections on port: ${port}`);
    }

    /**
     * Connect to a specific peer URL (e.g. ws://localhost:6001)
     */
    public connectToPeer(peerUrl: string): void {
        if (this.peerUrls.has(peerUrl)) return; // Already connecting/connected

        const socket = new WebSocket(peerUrl) as P2PSocket;
        socket.isOutgoing = true;
        socket.peerAddress = peerUrl;

        socket.on('open', () => {
            this.peerUrls.add(peerUrl);
            this.initConnection(socket);
        });
        socket.on('error', (err) => {
            Logger.log('P2P Connection failed:', err.message);
            this.peerUrls.delete(peerUrl);
        });
    }

    private initConnection(socket: P2PSocket): void {
        socket.missedPings = 0;
        this.sockets.push(socket);

        // Handle incoming messages
        socket.on('message', (data: string) => {
            // TODO: Implement P2P message size limits to prevent memory exhaustion DoS
            try {
                const message = JSON.parse(data);
                this.handleMessage(socket, message);
            } catch (e) {
                Logger.error('Failed to parse P2P message', e);
            }
        });

        // Clean up on disconnect
        socket.on('close', () => this.removeSocket(socket));
        socket.on('error', () => this.removeSocket(socket));

        // When we first connect, perform the handshake:
        this.write(socket, { type: MessageType.QUERY_LATEST });
        this.write(socket, { type: MessageType.QUERY_PEERS });
        if (this.myAddress) {
            this.write(socket, { type: MessageType.ANNOUNCE_SELF, data: this.myAddress });
        }
    }

    private handleMessage(socket: P2PSocket, message: P2PMessage): void {
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                this.handleQueryLatest(socket);
                break;

            case MessageType.QUERY_ALL:
                this.handleQueryAll(socket);
                break;

            case MessageType.RESPONSE_BLOCKCHAIN:
                this.handleBlockchainResponse(message.data);
                break;

            case MessageType.BROADCAST_TRANSACTION:
                this.handleTransactionBroadcast(socket, message.data);
                break;

            case MessageType.QUERY_PEERS:
                this.handleQueryPeers(socket);
                break;

            case MessageType.RESPONSE_PEERS:
                this.handlePeerListResponse(message.data);
                break;

            case MessageType.ANNOUNCE_SELF:
                this.handleAnnounceSelf(socket, message.data);
                break;

            case MessageType.RESET_CHAIN:
                // SECURITY WARNING: This is unauthenticated and dangerous.
                this.handleResetChain();
                break;

            case MessageType.PING:
                this.handlePing(socket);
                break;

            case MessageType.PONG:
                this.handlePong(socket);
                break;
        }
    }

    private handleQueryLatest(socket: P2PSocket): void {
        this.write(socket, {
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: [this.blockchain.getLatestBlock()]
        });
    }

    private handleQueryAll(socket: P2PSocket): void {
        this.write(socket, {
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: this.blockchain.chain
        });
    }

    private handleQueryPeers(socket: P2PSocket): void {
        this.write(socket, {
            type: MessageType.RESPONSE_PEERS,
            data: Array.from(this.peerUrls)
        });
    }

    private handlePing(socket: P2PSocket): void {
        this.write(socket, { type: MessageType.PONG });
    }

    private handlePong(socket: P2PSocket): void {
        socket.missedPings = 0;
    }

    private startHeartbeat(): void {
        if (this.heartbeatInterval) return;

        this.heartbeatInterval = setInterval(() => {
            this.sockets.forEach((socket) => {
                if (socket.missedPings !== undefined) {
                    socket.missedPings++;
                    if (socket.missedPings >= this.MAX_MISSED_PINGS) {
                        Logger.log(`Peer ${socket.peerAddress} is unresponsive. Closing connection.`);
                        socket.close();
                        this.removeSocket(socket);
                    } else {
                        this.write(socket, { type: MessageType.PING });
                    }
                }
            });
        }, this.HEARTBEAT_DELAY);
    }

    private handleAnnounceSelf(socket: P2PSocket, peerAddress: string): void {
        if (!peerAddress || peerAddress === this.myAddress) return;

        // If this socket was an outgoing connection, it's already verified as that peerAddress
        if (socket.isOutgoing && socket.peerAddress !== peerAddress) {
            Logger.error(`Security Warning: Outgoing socket to ${socket.peerAddress} tried to announce itself as ${peerAddress}. Closing connection.`);
            socket.close();
            return;
        }

        // Check if we already have an active socket for this address
        const existingSocket = this.sockets.find(s => s.peerAddress === peerAddress);

        if (existingSocket && existingSocket !== socket) {
            // Simultaneous connection race condition: both nodes connected to each other.
            // We must deterministically choose only ONE connection to keep.
            // We'll use address comparison as the tie-breaker.
            const myAddr = this.myAddress || '';
            const shouldKeepOutgoing = myAddr < peerAddress;

            if (shouldKeepOutgoing) {
                // I am the 'primary' for this pair; I keep my outgoing and close incoming.
                if (socket.isOutgoing) {
                    existingSocket.close();
                } else {
                    socket.close();
                    return;
                }
            } else {
                // I am the 'secondary'; I keep the incoming and close my outgoing.
                if (socket.isOutgoing) {
                    socket.close();
                    return;
                } else {
                    existingSocket.close();
                }
            }
        }

        if (!this.peerUrls.has(peerAddress)) {
            this.peerUrls.add(peerAddress);
            // Share this new node with everyone else!
            this.broadcast({ type: MessageType.RESPONSE_PEERS, data: [peerAddress] });
        }

        // Tag the socket with the peer address for deduplication/tracking
        socket.peerAddress = peerAddress;
        Logger.log(`Peer connected: ${peerAddress}. Total unique peers: ${this.getPeers().length}`);
    }

    /**
     * Resets the local blockchain. 
     * NOTE: This is intentionally unauthenticated to facilitate rapid testing and 
     * resetting of the network in development environments. 
     * DO NOT USE THIS IN A PRODUCTION MAINNET!
     */
    private handleResetChain(): void {
        if (process.env.ALLOW_REMOTE_RESET === 'true') {
            Logger.log('Received RESET_CHAIN signal. Wiping local state.');
            this.blockchain.reset();
        } else {
            Logger.log('Ignored RESET_CHAIN signal: Remote reset is disabled by default for security.');
        }
    }

    private handlePeerListResponse(receivedPeerUrls: string[]): void {
        receivedPeerUrls.forEach(url => {
            if (!this.peerUrls.has(url) && url !== this.myAddress) {
                this.connectToPeer(url);
            }
        });
    }

    private handleBlockchainResponse(receivedBlocks: any[]): void {
        if (receivedBlocks.length === 0) return;

        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.blockchain.getLatestBlock();

        if (latestBlockReceived.index > latestBlockHeld.index) {
            if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
                Logger.log(`New block discovered: Index ${latestBlockReceived.index} (Hash: ${latestBlockReceived.hash.substring(0, 10)}...)`);
                try {
                    this.blockchain.addBlock(latestBlockReceived);
                    this.broadcastLatest();
                } catch (err: any) {
                    Logger.error(`Rejected invalid block from peer: ${err.message}`);
                }
            } else if (receivedBlocks.length === 1) {
                Logger.log(`Out of sync. Requesting full chain from peer (Local: ${latestBlockHeld.index}, Peer: ${latestBlockReceived.index})`);
                this.broadcast({ type: MessageType.QUERY_ALL });
            } else {
                Logger.log(`Received longer chain. Replacing local chain (New length: ${receivedBlocks.length})`);
                if (this.blockchain.replaceChain(receivedBlocks)) {
                    this.broadcastLatest();
                }
            }
        }
    }

    private handleTransactionBroadcast(socket: P2PSocket, data: Record<string, any>): void {
        try {
            const tx = Transaction.fromObject(data);
            this.blockchain.createTransaction(tx);
            // Re-broadcast to other peers, except the one we received it from
            this.broadcast({ type: MessageType.BROADCAST_TRANSACTION, data: tx }, socket);
        } catch (err) {
            // Transaction might already be in mempool or is invalid, ignore
        }
    }

    /**
     * Broadcast a message to ALL connected peers, optionally excluding one
     */
    public broadcast(message: P2PMessage, excludeSocket?: P2PSocket): void {
        this.sockets.forEach(socket => {
            if (socket !== excludeSocket) {
                this.write(socket, message);
            }
        });
    }

    public broadcastLatest(): void {
        this.broadcast({
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: [this.blockchain.getLatestBlock()]
        });
    }

    public broadcastTransaction(transaction: Transaction): void {
        this.broadcast({
            type: MessageType.BROADCAST_TRANSACTION,
            data: transaction
        });
    }

    public broadcastReset(): void {
        this.broadcast({ type: MessageType.RESET_CHAIN });
    }

    private write(socket: P2PSocket, message: P2PMessage): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        } else {
            // TODO: Track connection failures and implement peer banning/blacklisting
        }
    }

    private removeSocket(socket: P2PSocket): void {
        this.sockets = this.sockets.filter(s => s !== socket);
        const address = socket.peerAddress;
        if (address) {
            const remaining = this.sockets.some(s => s.peerAddress === address);
            if (!remaining) {
                this.peerUrls.delete(address);
                Logger.log(`Peer disconnected: ${address}. Total unique peers: ${this.getPeers().length}`);
            }
        }
    }

    public getPeers(): string[] {
        const addresses = this.sockets
            .map(s => s.peerAddress)
            .filter((addr): addr is string => !!addr && addr !== this.myAddress);

        return Array.from(new Set(addresses));
    }

    /**
     * Gracefully close all connections and the server
     */
    public close(): void {
        Logger.log('Closing P2P server and all connections...');
        this.sockets.forEach(socket => {
            if (socket.readyState === WebSocket.OPEN) {
                socket.close();
            }
        });
        this.sockets = [];
        this.peerUrls.clear();

        if (this.heartbeatInterval) {
            clearInterval(this.heartbeatInterval);
            this.heartbeatInterval = null;
        }

        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
    }
}
