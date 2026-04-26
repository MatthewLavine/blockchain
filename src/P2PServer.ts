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
    RESET_CHAIN = 7
}

interface P2PMessage {
    type: MessageType;
    data?: any; // We will further refine this in the handlers
}

export class P2PServer {
    private sockets: WebSocket[] = [];
    private peerUrls: Set<string> = new Set();
    private blockchain: Blockchain;
    private myAddress: string | null = null;

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
    }

    /**
     * Start the P2P server to listen for incoming connections from peers
     */
    public listen(port: number, host: string = 'localhost'): void {
        const server = new WebSocket.Server({ port });
        this.myAddress = `ws://${host}:${port}`;

        server.on('connection', (socket) => {
            this.initConnection(socket);
        });

        Logger.log(`Listening for P2P connections on port: ${port}`);
    }

    /**
     * Connect to a specific peer URL (e.g. ws://localhost:6001)
     */
    public connectToPeer(peerUrl: string): void {
        if (this.peerUrls.has(peerUrl)) return; // Already connecting/connected

        const socket = new WebSocket(peerUrl);
        socket.on('open', () => {
            this.peerUrls.add(peerUrl);
            this.initConnection(socket);
        });
        socket.on('error', (err) => {
            Logger.log('P2P Connection failed:', err.message);
            this.peerUrls.delete(peerUrl);
        });
    }

    private initConnection(socket: WebSocket): void {
        this.sockets.push(socket);

        // Handle incoming messages
        socket.on('message', (data: string) => {
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

    private handleMessage(socket: WebSocket, message: P2PMessage): void {
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
                this.handleResetChain();
                break;
        }
    }

    private handleQueryLatest(socket: WebSocket): void {
        this.write(socket, {
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: [this.blockchain.getLatestBlock()]
        });
    }

    private handleQueryAll(socket: WebSocket): void {
        this.write(socket, {
            type: MessageType.RESPONSE_BLOCKCHAIN,
            data: this.blockchain.chain
        });
    }

    private handleQueryPeers(socket: WebSocket): void {
        this.write(socket, {
            type: MessageType.RESPONSE_PEERS,
            data: Array.from(this.peerUrls)
        });
    }

    private handleAnnounceSelf(socket: WebSocket, peerAddress: string): void {
        if (!peerAddress || peerAddress === this.myAddress) return;

        // Check if we already have an active socket for this address
        const existingSocket = this.sockets.find(s => (s as any).peerAddress === peerAddress);

        if (existingSocket && existingSocket !== socket) {
            socket.close();
            return;
        }

        if (!this.peerUrls.has(peerAddress)) {
            this.peerUrls.add(peerAddress);
            // Share this new node with everyone else!
            this.broadcast({ type: MessageType.RESPONSE_PEERS, data: [peerAddress] });
        }

        // Tag the socket with the peer address for deduplication/tracking
        (socket as any).peerAddress = peerAddress;
        Logger.log(`Peer connected: ${peerAddress}. Total unique peers: ${this.getPeers().length}`);
    }

    private handleResetChain(): void {
        Logger.log('Received RESET_CHAIN signal. Wiping local state.');
        this.blockchain.reset();
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
                this.blockchain.addBlock(latestBlockReceived);
                this.broadcastLatest();
            } else if (receivedBlocks.length === 1) {
                Logger.log(`Out of sync. Requesting full chain from peer (Local: ${latestBlockHeld.index}, Peer: ${latestBlockReceived.index})`);
                this.broadcast({ type: MessageType.QUERY_ALL });
            } else {
                Logger.log(`Received longer chain. Replacing local chain (New length: ${receivedBlocks.length})`);
                this.blockchain.replaceChain(receivedBlocks);
            }
        }
    }

    private handleTransactionBroadcast(socket: WebSocket, data: Record<string, any>): void {
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
    public broadcast(message: P2PMessage, excludeSocket?: WebSocket): void {
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

    private write(socket: WebSocket, message: P2PMessage): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }

    private removeSocket(socket: WebSocket): void {
        this.sockets = this.sockets.filter(s => s !== socket);
        const address = (socket as any).peerAddress;
        if (address) {
            const remaining = this.sockets.some(s => (s as any).peerAddress === address);
            if (!remaining) {
                this.peerUrls.delete(address);
                Logger.log(`Peer disconnected: ${address}. Total unique peers: ${this.getPeers().length}`);
            }
        }
    }

    public getPeers(): string[] {
        return this.sockets
            .map(s => (s as any).peerAddress || (s.url ? s.url : 'Unknown Peer'))
            .filter(addr => addr && addr !== this.myAddress);
    }
}
