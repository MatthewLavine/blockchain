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
    isAccepted?: boolean;
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
    private seedNode: string | null = null;
    private reconnectInterval: NodeJS.Timeout | null = null;
    private RECONNECT_DELAY = 10000; // 10 seconds
    private MAX_INBOUND_PEERS = Number(process.env.MAX_PEERS) || 10;
    private MAX_OUTBOUND_PEERS = Number(process.env.MAX_OUTBOUND_PEERS) || Math.max(2, Math.floor(this.MAX_INBOUND_PEERS * 0.5));
    private connectingPeers: Set<string> = new Set();
    private recentFailures: Map<string, number> = new Map();

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
            // Always accept the initial socket. We wait for the ANNOUNCE_SELF handshake to enforce peer limits.
            this.initConnection(socket);
        });

        this.startHeartbeat();

        Logger.log(`Listening for P2P connections on port: ${port}`);
    }

    public connectToPeer(peerUrl: string): void {
        if (peerUrl === this.myAddress) return;

        // Respect the 30-second cooldown for recently failed peers
        const lastFailure = this.recentFailures.get(peerUrl) || 0;
        if (Date.now() - lastFailure < 30000) return;

        const outboundSockets = this.sockets.filter(s => s.isOutgoing).length;
        const pendingCount = this.connectingPeers.size;

        if (outboundSockets + pendingCount >= this.MAX_OUTBOUND_PEERS) {
            return;
        }

        const isConnected = this.sockets.some(s => s.peerAddress === peerUrl);
        if (isConnected || this.connectingPeers.has(peerUrl)) return;

        this.connectingPeers.add(peerUrl);
        this.peerUrls.add(peerUrl);

        const socket = new WebSocket(peerUrl) as P2PSocket;
        socket.isOutgoing = true;
        socket.peerAddress = peerUrl;

        socket.on('open', () => {
            this.initConnection(socket);
        });

        socket.on('error', (err) => {
            this.connectingPeers.delete(peerUrl);
        });

        socket.on('close', () => {
            this.connectingPeers.delete(peerUrl);
            this.recentFailures.set(peerUrl, Date.now());
            this.seekNewPeers();
        });
    }

    /**
     * Connect to a seed node and initialize the fallback discovery interval
     */
    public connectToSeed(seedUrl: string): void {
        this.seedNode = seedUrl;
        this.connectToPeer(seedUrl);

        if (!this.reconnectInterval) {
            // This is now just a safety fallback. The primary discovery mechanism is event-driven via seekNewPeers()
            this.reconnectInterval = setInterval(() => {
                this.seekNewPeers();
            }, 10000); // 10s basic interval without huge random delays
        }
    }

    /**
     * Aggressively fill open outbound slots until we reach our target peer count.
     * This turns peer discovery into a "waterfall" that acts immediately when slots free up.
     */
    private seekNewPeers(): void {
        const activeCount = this.sockets.length;
        const pendingCount = this.connectingPeers.size;
        const outboundCount = this.sockets.filter(s => s.isOutgoing).length;

        const MIN_PEERS_TARGET = 2;

        if (activeCount + pendingCount >= MIN_PEERS_TARGET) {
            return; // We have enough peers
        }

        let freeSlots = this.MAX_OUTBOUND_PEERS - outboundCount - pendingCount;

        // Emergency Override: If we are completely isolated, ignore outbound limits to guarantee connection attempt
        if (activeCount === 0 && pendingCount === 0) {
            freeSlots = Math.max(1, freeSlots);
            if (this.seedNode) {
                this.connectToPeer(this.seedNode);
                freeSlots--;
            }
        }

        if (freeSlots <= 0) return;

        // Try a random eligible nodes from our address book up to freeSlots
        const knownUrls = Array.from(this.peerUrls);
        const eligiblePeers = knownUrls.filter(url =>
            url !== this.myAddress &&
            !this.sockets.some(s => s.peerAddress === url) &&
            !this.connectingPeers.has(url)
        );

        // Shuffle eligible peers to prevent clumping
        eligiblePeers.sort(() => 0.5 - Math.random());

        for (let i = 0; i < Math.min(freeSlots, eligiblePeers.length); i++) {
            this.connectToPeer(eligiblePeers[i]);
        }
    }

    private initConnection(socket: P2PSocket): void {
        socket.missedPings = 0;

        // Set a handshake timeout: if they don't announce themselves in 5s, close them.
        const handshakeTimeout = setTimeout(() => {
            if (socket.readyState === WebSocket.OPEN && !socket.peerAddress) {
                Logger.log('P2P: Handshake timeout. Closing connection.');
                socket.close();
            }
        }, 5000);

        // Handle incoming messages
        socket.on('message', (data: string) => {
            try {
                const message: P2PMessage = JSON.parse(data);

                if (message.type === MessageType.ANNOUNCE_SELF) {
                    clearTimeout(handshakeTimeout);
                }

                this.handleMessage(socket, message);
            } catch (err) {
                Logger.error('P2P: Failed to parse incoming message:', err);
            }
        });

        socket.on('close', () => {
            clearTimeout(handshakeTimeout);
            this.removeSocket(socket);
        });

        socket.on('error', () => {
            clearTimeout(handshakeTimeout);
            this.removeSocket(socket);
        });

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

        // If this socket was an outgoing connection, verify it matches our expected address
        if (socket.isOutgoing && socket.peerAddress && socket.peerAddress !== peerAddress) {
            Logger.error(`Security Warning: Outgoing socket to ${socket.peerAddress} tried to announce itself as ${peerAddress}. Closing connection.`);
            socket.close();
            return;
        }

        socket.peerAddress = peerAddress;
        this.peerUrls.add(peerAddress);

        // Check if we already have an active socket for this address
        const existingSocket = this.sockets.find(s => s.peerAddress === peerAddress);

        // --- PEER LIMITS CHECK ---
        // If we already have an active socket for this address, we are just swapping them,
        // so we don't count the new socket against the limit yet.
        const isAlreadyConnected = !!existingSocket;
        const inboundCount = this.sockets.filter(s => !s.isOutgoing).length;
        const outboundCount = this.sockets.filter(s => s.isOutgoing).length;

        let isFull = false;
        if (!isAlreadyConnected) {
            if (socket.isOutgoing) {
                isFull = outboundCount >= this.MAX_OUTBOUND_PEERS;
            } else {
                isFull = inboundCount >= this.MAX_INBOUND_PEERS;
            }
        }

        if (isFull) {
            // We are at capacity. Provide the rejected peer with up to 10 random referrals to help them discover the network.
            const allPeers = Array.from(this.peerUrls);
            const shuffled = allPeers.sort(() => 0.5 - Math.random());
            const referralList = shuffled.slice(0, 10);

            this.write(socket, {
                type: MessageType.RESPONSE_PEERS,
                data: referralList
            });

            // Graceful close after delay to ensure message is sent
            setTimeout(() => socket.close(), 50);
            return;
        }

        // --- DEDUPLICATION ---
        if (existingSocket && existingSocket !== socket) {
            // Deterministic tie-breaker: We keep the outgoing connection if our address is smaller. 
            // Otherwise, we keep the incoming connection. This ensures both nodes make the same decision.
            const shouldKeepOutgoing = this.myAddress! < peerAddress;
            if (socket.isOutgoing === shouldKeepOutgoing) {
                socket.isAccepted = existingSocket.isAccepted;
                this.sockets.push(socket);
                existingSocket.close();
            } else {
                socket.close();
                return;
            }
        } else if (!existingSocket) {
            this.sockets.push(socket);
        }

        this.connectingPeers.delete(peerAddress);

        if (!socket.isAccepted) {
            // Grace period: only log and consider "accepted" if the connection stays open.
            // This filters out "hit-and-run" rejections in a crowded network.
            setTimeout(() => {
                if (socket.readyState === WebSocket.OPEN && this.sockets.includes(socket)) {
                    socket.isAccepted = true;
                    Logger.log(`P2P: Peer connected: ${peerAddress}. Total active peers: ${this.sockets.length}`);
                }
            }, 2000);
        }
        this.broadcast({ type: MessageType.RESPONSE_PEERS, data: [peerAddress] }, socket);
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
            if (url !== this.myAddress) {
                // Add to address book regardless of connection state
                this.peerUrls.add(url);
            }
        });

        // Waterfall discovery: As soon as we get new referrals, immediately try to connect to them if we have free slots.
        this.seekNewPeers();
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
        const wasActive = this.sockets.includes(socket);
        this.sockets = this.sockets.filter(s => s !== socket);
        const address = socket.peerAddress;

        if (address) {
            this.connectingPeers.delete(address);
            this.recentFailures.set(address, Date.now());

            // Only log if this was an established peer and no other sockets for this address remain.
            // We only log if the peer had graduated from the grace period (isAccepted).
            const remaining = this.sockets.some(s => s.peerAddress === address);
            if (!remaining && wasActive && socket.isAccepted) {
                Logger.log(`P2P: Peer disconnected: ${address}. Total active peers: ${this.sockets.length}`);
            }
        }

        // Waterfall discovery: When a socket closes (whether failure or graceful rejection),
        // an outbound slot might have freed up. Immediately try to fill it.
        this.seekNewPeers();
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

        if (this.reconnectInterval) {
            clearInterval(this.reconnectInterval);
            this.reconnectInterval = null;
        }

        if (this.wss) {
            this.wss.close();
            this.wss = null;
        }
    }
}
