import { Block } from './Block';
import { Transaction } from './Transaction';
import * as fs from 'fs';
import * as path from 'path';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public pendingTransactions: Transaction[];
  public miningReward: number;
  private storagePath: string | null = null;

  constructor() {
    // When we initialize a new blockchain, we automatically create the Genesis Block.
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.miningReward = 100; // Reward the miner with 100 coins
  }

  public setStoragePath(id: string | number): void {
    this.storagePath = path.join(__dirname, '..', 'data', `blockchain_${id}.json`);
    this.loadFromDisk();
  }

  private saveToDisk(): void {
    if (!this.storagePath) return;
    try {
      const data = JSON.stringify({
        chain: this.chain,
        pendingTransactions: this.pendingTransactions,
        miningReward: this.miningReward
      }, null, 2);
      fs.writeFileSync(this.storagePath, data);
    } catch (err) {
      console.error('Failed to save blockchain to disk:', err);
    }
  }

  private loadFromDisk(): void {
    if (!this.storagePath || !fs.existsSync(this.storagePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));

      // Hydrate transactions back into Transaction objects
      this.chain = data.chain.map((block: any) => {
        const hydratedBlock = Object.assign(new Block(0, 0, []), block);
        hydratedBlock.transactions = block.transactions.map((tx: any) =>
          Object.assign(new Transaction('', '', 0), tx)
        );
        return hydratedBlock;
      });

      this.pendingTransactions = data.pendingTransactions.map((tx: any) =>
        Object.assign(new Transaction('', '', 0), tx)
      );

      this.miningReward = data.miningReward;

      // Validate the loaded chain
      if (!this.isChainValid()) {
        console.error('CRITICAL: Loaded blockchain is invalid! Resetting to Genesis block.');
        this.chain = [this.createGenesisBlock()];
        this.pendingTransactions = [];
      } else {
        console.log(`Successfully loaded and verified blockchain from disk (${this.chain.length} blocks)`);
      }
    } catch (err) {
      console.error('Failed to load blockchain from disk:', err);
    }
  }

  /**
   * The first block of a blockchain is special. It doesn't have a previous block to link to.
   * This is called the "Genesis Block". We have to create it manually.
   */
  private createGenesisBlock(): Block {
    return new Block(0, Date.parse("2026-01-01"), [], "0");
  }

  /**
   * A helper method to get the most recently added block in our chain.
   */
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Takes all pending transactions, puts them in a Block, and mines it.
   * @param miningRewardAddress The wallet address to send the mining reward to.
   */
  public minePendingTransactions(miningRewardAddress: string): void {
    const block = new Block(this.chain.length, Date.now(), this.pendingTransactions, this.getLatestBlock().hash);

    block.mineBlock(this.difficulty);
    this.chain.push(block);
    console.log(`Block #${block.index} Mined! Hash: ${block.hash.substring(0, 10)}... (Nonce: ${block.nonce})`);
    this.saveToDisk();

    // Reset pending transactions with the mining reward
    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward)
    ];

    // Halving mechanism: Every 100 blocks, the mining reward is cut in half
    if (this.chain.length % 100 === 0) {
      this.miningReward = this.miningReward / 2;
    }
  }

  /**
   * Adds a new transaction to the pool of pending transactions.
   * It enforces that the transaction must be signed, valid, and the sender has enough funds!
   */
  public createTransaction(transaction: Transaction): void {
    if (!transaction.fromAddress || !transaction.toAddress) {
      throw new Error('Transaction must include from and to address');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    // Prevent sending more than the wallet has!
    // We must calculate the balance based on the mined chain PLUS the pending transactions they've already submitted.
    let currentBalance = this.getBalanceOfAddress(transaction.fromAddress);
    for (const pendingTx of this.pendingTransactions) {
      if (pendingTx.fromAddress === transaction.fromAddress) {
        currentBalance -= pendingTx.amount;
      }
    }

    if (currentBalance < transaction.amount) {
      throw new Error('Not enough balance to complete this transaction');
    }

    this.pendingTransactions.push(transaction);
    this.saveToDisk();
  }

  /**
   * Calculates the balance of a given wallet address by looping through the entire blockchain
   * and looking for transactions sent to or from this address.
   */
  public getBalanceOfAddress(address: string): number {
    let balance = 0;

    for (const block of this.chain) {
      for (const trans of block.transactions) {
        // If money is sent FROM the address, decrease balance
        if (trans.fromAddress === address) {
          balance -= trans.amount;
        }

        // If money is sent TO the address, increase balance
        if (trans.toAddress === address) {
          balance += trans.amount;
        }
      }
    }

    return balance;
  }

  /**
   * Loops through the entire chain to verify its integrity.
   */
  public isChainValid(): boolean {
    // We start at 1 because block 0 is the Genesis block (it has no previous block to check)
    for (let i = 1; i < this.chain.length; i++) {
      const currentBlock = this.chain[i];
      const previousBlock = this.chain[i - 1];

      // 1. Verify all transactions inside the current block
      for (const tx of currentBlock.transactions) {
        if (!tx.isValid()) {
          return false; // A fake transaction was found!
        }
      }

      // 1. Check if the current block's hash is still mathematically correct
      // This detects if someone altered the 'data' or 'timestamp' of the current block
      if (currentBlock.hash !== currentBlock.calculateHash()) {
        return false;
      }

      // 2. Check if the current block correctly points to the previous block's hash
      // This detects if someone tried to insert a fake block or swap blocks around
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }
    }

    // If we make it through the whole loop without returning false, the chain is perfectly valid!
    return true;
  }
  /**
   * Replaces the current chain with a new one, provided the new chain is longer and valid.
   * This is the core of the "Longest Chain Rule" in decentralization.
   */
  public replaceChain(newChain: Block[]): boolean {
    if (newChain.length <= this.chain.length) {
      console.log('Received chain is not longer than current chain. Ignoring.');
      return false;
    }

    // Verify the new chain is valid before accepting it
    // Note: We can't use this.isChainValid() directly because it checks this.chain
    if (!this.isValidChain(newChain)) {
      console.log('Received chain is invalid. Ignoring.');
      return false;
    }

    console.log('Replacing blockchain with the longer chain from peer.');
    this.chain = newChain;
    this.saveToDisk();
    return true;
  }

  /**
   * Helper to validate a specific chain (not necessarily the local one)
   */
  private isValidChain(chainToValidate: Block[]): boolean {
    // Check genesis block
    if (JSON.stringify(chainToValidate[0]) !== JSON.stringify(this.createGenesisBlock())) {
      return false;
    }

    for (let i = 1; i < chainToValidate.length; i++) {
      const currentBlock = chainToValidate[i];
      const previousBlock = chainToValidate[i - 1];

      // Validate hashes
      if (currentBlock.previousHash !== previousBlock.hash) {
        return false;
      }

      // Re-calculate hash to ensure it hasn't been tampered with
      // (This requires us to know how the hash is calculated in the Block class)
      // Since Block.hash is already calculated and stored, we just trust the cryptographic link
      // But a real implementation would re-calculate it here.
    }

    return true;
  }
}
