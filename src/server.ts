import express from 'express';
import cors from 'cors';
import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';

const app = express();
const port = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize our blockchain
const myCoin = new Blockchain();

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
  console.log('Available endpoints:');
  console.log(' - GET  /blocks');
  console.log(' - GET  /balance/:address');
  console.log(' - POST /transaction');
  console.log(' - POST /mine');
});
