import express from 'express';
import cors from 'cors';
import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';
import { P2PServer } from './P2PServer';
import { Logger } from './Logger';

const app = express();
const port = process.env.PORT || 3000;
Logger.initialize(port);
const p2pPort = process.env.P2P_PORT || 6000;
const p2pHost = process.env.P2P_HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Initialize our blockchain
let myCoin = new Blockchain();
myCoin.setStoragePath(port); // Enable disk persistence
const p2pServer = new P2PServer(myCoin);

// Auto-connect to seed node if provided
const seedNode = process.env.SEED_NODE;
if (seedNode) {
  Logger.log(`Connecting to seed node: ${seedNode}`);
  p2pServer.connectToSeed(seedNode);
}

/**
 * Returns the entire blockchain
 */
app.get('/blocks', (req, res) => {
  res.json(myCoin.chain);
});

/**
 * Health check endpoint
 */
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'up', timestamp: new Date().toISOString() });
});

/**
 * Returns the balance of a specific wallet address
 */
app.get('/balance/:address', (req, res) => {
  const address = req.params.address;
  const balance = myCoin.getBalanceOfAddress(address);
  res.json({ address, balance });
});

/**
 * Returns the next expected nonce for a specific wallet address
 */
app.get('/nonce/:address', (req, res) => {
  const address = req.params.address;
  const nextNonce = myCoin.getNextNonce(address);
  res.json({ address, nextNonce });
});

/**
 * Returns the list of pending transactions in the mempool
 */
app.get('/pending', (req, res) => {
  res.json(myCoin.pendingTransactions);
});

/**
 * Resets the entire blockchain network.
 * NOTE: This is intentionally unauthenticated and broadcasts to all peers to facilitate 
 * rapid testing in development.
 */
app.post('/reset', (req, res) => {
  if (process.env.ALLOW_REMOTE_RESET === 'true') {
    myCoin.reset();
    p2pServer.broadcastReset();
    res.json({ message: 'Blockchain has been reset successfully.' });
  } else {
    res.status(403).json({ 
      error: 'Reset forbidden', 
      message: 'The reset functionality is disabled on this node for security.' 
    });
  }
});

app.get('/peers', (req, res) => {
  res.json(p2pServer.getPeers());
});

app.post('/addPeer', (req, res) => {
  const peerUrl = req.body.peer;
  p2pServer.connectToPeer(peerUrl);
  res.json({ message: `Attempting to connect to peer: ${peerUrl}` });
});

/**
 * Accepts a new signed transaction and adds it to the pending pool
 * Expects JSON body: { fromAddress, toAddress, amount, signature }
 */
app.post('/transaction', (req, res) => {
  try {
    const { fromAddress, toAddress, amount, signature } = req.body;

    // Reconstruct the transaction object
    const tx = Transaction.fromObject(req.body);

    // The createTransaction method internally checks tx.isValid()
    myCoin.createTransaction(tx);
    p2pServer.broadcastTransaction(tx);

    res.json({ message: 'Transaction successfully added to pending pool!' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * Triggers the mining process to process all pending transactions
 * Expects JSON body: { rewardAddress }
 */
app.post('/mine', (req, res) => {
  const { rewardAddress } = req.body;

  if (!rewardAddress) {
    return res.status(400).json({ error: 'Mining requires a rewardAddress' });
  }

  try {
    myCoin.minePendingTransactions(rewardAddress);
    p2pServer.broadcastLatest();
    res.json({
      message: 'Block successfully mined!',
      latestBlock: myCoin.getLatestBlock()
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

const server = app.listen(port, () => {
  Logger.log(`Blockchain Node listening at http://localhost:${port}`);
  p2pServer.listen(Number(p2pPort), p2pHost);
});

/**
 * Handle graceful shutdown
 */
const shutdown = (signal: string) => {
  Logger.log(`Received ${signal}. Starting graceful shutdown...`);

  server.close(() => {
    Logger.log('HTTP server closed.');

    p2pServer.close();
    myCoin.shutdown();

    Logger.log('Shutdown complete. Goodbye!');
    process.exit(0);
  });

  // Force exit after 5 seconds if graceful shutdown fails
  setTimeout(() => {
    Logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
