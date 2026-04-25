import express from 'express';
import cors from 'cors';
import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';
import { P2PServer } from './P2PServer';

const app = express();
const port = process.env.PORT || 3000;
const p2pPort = process.env.P2P_PORT || 6000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize our blockchain
let myCoin = new Blockchain();
const p2pServer = new P2PServer(myCoin);

// Auto-connect to seed node if provided
const seedNode = process.env.SEED_NODE;
if (seedNode) {
  console.log(`Connecting to seed node: ${seedNode}`);
  p2pServer.connectToPeer(seedNode);
}

/**
 * Returns the entire blockchain
 */
app.get('/blocks', (req, res) => {
  res.json(myCoin.chain);
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
 * Returns the list of pending transactions in the mempool
 */
app.get('/pending', (req, res) => {
  res.json(myCoin.pendingTransactions);
});

app.post('/reset', (req, res) => {
  myCoin = new Blockchain();
  res.json({ message: 'Blockchain has been reset successfully.' });
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
    const tx = new Transaction(fromAddress, toAddress, amount);
    tx.signature = signature;

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

app.listen(port, () => {
  console.log(`Blockchain Node listening at http://localhost:${port}`);
  p2pServer.listen(Number(p2pPort));
});
