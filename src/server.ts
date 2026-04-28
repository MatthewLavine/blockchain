import express from 'express';
import cors from 'cors';
import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';
import { P2PServer } from './P2PServer';
import { Logger } from './Logger';
import rateLimit from 'express-rate-limit';

import { getLandingPage } from './LandingPage';

const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 7000;
Logger.initialize(port);
const p2pPort = process.env.P2P_PORT || 6000;
const p2pHost = process.env.P2P_HOST || 'localhost';

// Middleware
app.use(cors());
app.use(express.json());

// --- Rate Limiting ---

// Standard limiter for most endpoints
const globalLimiter = rateLimit({
  windowMs: 5 * 1000, // 10 seconds
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please slow down.' }
});

// Strict limiter for mining (expensive operation)
const miningLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Mining is rate-limited. Please wait before trying again.' }
});

// Strict limiter for transactions
const transactionLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Transaction submission is rate-limited.' }
});

// Very strict limiter for reset
const resetLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 2, // Limit each IP to 2 resets per 10 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Reset is heavily rate-limited.' }
});

// Apply global limiter to all routes
app.use(globalLimiter);

// --- Routes ---
app.get('/', (req, res) => {
  res.send(getLandingPage());
});

// Initialize our blockchain
let myCoin = new Blockchain();
myCoin.setStoragePath(port); // Enable disk persistence
const p2pServer = new P2PServer(myCoin);

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
app.post('/reset', resetLimiter, (req, res) => {
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
  const peerUrl = req.body?.peer;
  if (!peerUrl) {
    return res.status(400).json({ error: 'Missing required field: peer in JSON body' });
  }
  p2pServer.connectToPeer(peerUrl);
  res.json({ message: `Attempting to connect to peer: ${peerUrl}` });
});

/**
 * Accepts a new signed transaction and adds it to the pending pool
 * Expects JSON body: { fromAddress, toAddress, amount, signature }
 */
app.post('/transaction', transactionLimiter, (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({ error: 'Missing request body' });
    }
    const { fromAddress, toAddress, amount, signature } = req.body;

    if (!fromAddress || !toAddress || amount === undefined || !signature) {
      return res.status(400).json({ error: 'Missing required transaction fields' });
    }

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
app.post('/mine', miningLimiter, (req, res) => {
  const rewardAddress = req.body?.rewardAddress;

  if (!rewardAddress) {
    return res.status(400).json({ error: 'Mining requires a rewardAddress in the JSON body' });
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

/**
 * 404 Handler
 */
app.use((req, res) => {
  res.status(404).json({ error: 'Endpoint not found' });
});

/**
 * Global Error Handler
 */
app.use((err: any, req: any, res: any, next: any) => {
  Logger.error(`Unhandled error: ${err.message}`);
  res.status(500).json({ error: 'Internal server error' });
});

const server = app.listen(port, () => {
  Logger.log(`Blockchain Node listening at http://localhost:${port}`);
  p2pServer.listen(Number(p2pPort), p2pHost);

  // Auto-connect to seed node if provided
  const seedNode = process.env.SEED_NODE;
  if (seedNode) {
    Logger.log(`Connecting to seed node: ${seedNode}`);
    p2pServer.connectToSeed(seedNode);
  }
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
