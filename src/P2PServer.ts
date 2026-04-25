import WebSocket from 'ws';
import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';

// Define message types to avoid string literal errors
enum MessageType {
    QUERY_LATEST = 0,
    QUERY_ALL = 1,
    RESPONSE_BLOCKCHAIN = 2,
    BROADCAST_TRANSACTION = 3
}

export class P2PServer {
    private sockets: WebSocket[] = [];
    private blockchain: Blockchain;

    constructor(blockchain: Blockchain) {
        this.blockchain = blockchain;
    }

    /**
     * Start the P2P server to listen for incoming connections from peers
     */
    public listen(port: number): void {
        const server = new WebSocket.Server({ port });
        
        server.on('connection', (socket) => {
            console.log(`P2P Connection established on port ${port}`);
            this.initConnection(socket);
        });

        console.log(`Listening for P2P connections on port: ${port}`);
    }

    /**
     * Connect to a specific peer URL (e.g. ws://localhost:6001)
     */
    public connectToPeer(peerUrl: string): void {
        const socket = new WebSocket(peerUrl);
        socket.on('open', () => this.initConnection(socket));
        socket.on('error', (err) => console.log('P2P Connection failed:', err.message));
    }

    private initConnection(socket: WebSocket): void {
        this.sockets.push(socket);
        console.log('Peer added to sockets list. Total peers:', this.sockets.length);

        // Handle incoming messages
        socket.on('message', (data: string) => {
            const message = JSON.parse(data);
            this.handleMessage(socket, message);
        });

        // Clean up on disconnect
        socket.on('close', () => this.removeSocket(socket));
        socket.on('error', () => this.removeSocket(socket));

        // When we first connect, ask for the latest block
        this.write(socket, { type: MessageType.QUERY_LATEST });
    }

    private handleMessage(socket: WebSocket, message: any): void {
        switch (message.type) {
            case MessageType.QUERY_LATEST:
                this.write(socket, {
                    type: MessageType.RESPONSE_BLOCKCHAIN,
                    data: [this.blockchain.getLatestBlock()]
                });
                break;
            
            case MessageType.QUERY_ALL:
                this.write(socket, {
                    type: MessageType.RESPONSE_BLOCKCHAIN,
                    data: this.blockchain.chain
                });
                break;

            case MessageType.RESPONSE_BLOCKCHAIN:
                this.handleBlockchainResponse(message.data);
                break;

            case MessageType.BROADCAST_TRANSACTION:
                this.handleTransactionBroadcast(message.data);
                break;
        }
    }

    private handleBlockchainResponse(receivedBlocks: any[]): void {
        if (receivedBlocks.length === 0) return;

        const latestBlockReceived = receivedBlocks[receivedBlocks.length - 1];
        const latestBlockHeld = this.blockchain.getLatestBlock();

        // If the received block is newer than what we have
        if (latestBlockReceived.index > latestBlockHeld.index) {
            console.log(`Blockchain possibly out of sync. Peer index: ${latestBlockReceived.index}, local index: ${latestBlockHeld.index}`);
            
            // If the received block follows our current head, just add it
            if (latestBlockHeld.hash === latestBlockReceived.previousHash) {
                console.log('New block matches our current head. Appending to chain.');
                this.blockchain.chain.push(latestBlockReceived);
                this.broadcastLatest();
            } 
            // If we received exactly one block that doesn't follow ours, we need to request the whole chain
            else if (receivedBlocks.length === 1) {
                console.log('We need to query the entire chain from our peer.');
                this.broadcast({ type: MessageType.QUERY_ALL });
            } 
            // Otherwise, we've received a multi-block chain. Try to replace our local chain.
            else {
                console.log('Received longer chain. Attempting to replace local chain.');
                this.blockchain.replaceChain(receivedBlocks);
            }
        } else {
            console.log('Received blockchain is not longer than local blockchain. Do nothing.');
        }
    }

    private handleTransactionBroadcast(data: any): void {
        const tx = Object.assign(new Transaction(null, '', 0), data);
        try {
            this.blockchain.createTransaction(tx);
            // Re-broadcast to other peers who might not have it
            this.broadcast({ type: MessageType.BROADCAST_TRANSACTION, data: tx });
        } catch (err) {
            // Transaction might already be in mempool or is invalid, ignore
        }
    }

    /**
     * Broadcast a message to ALL connected peers
     */
    public broadcast(message: any): void {
        this.sockets.forEach(socket => this.write(socket, message));
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

    private write(socket: WebSocket, message: any): void {
        if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify(message));
        }
    }

    private removeSocket(socket: WebSocket): void {
        this.sockets = this.sockets.filter(s => s !== socket);
    }

    public getPeers(): string[] {
        return this.sockets.map(s => (s as any)._url || 'Unknown Peer');
    }
}
