import { Block } from './Block';
import { Transaction } from './Transaction';
import { Logger } from './Logger';
import { Mempool } from './Mempool';
import { ChainValidator } from './ChainValidator';
import { NETWORK_CONSTANTS } from './Constants';
import * as fs from 'fs';
import * as path from 'path';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  private mempool: Mempool;
  public miningReward: number;
  private storagePath: string | null = null;

  constructor() {
    // When we initialize a new blockchain, we automatically create the Genesis Block.
    this.chain = [this.createGenesisBlock()];
    this.difficulty = NETWORK_CONSTANTS.INITIAL_DIFFICULTY;
    this.mempool = new Mempool();
    this.miningReward = NETWORK_CONSTANTS.INITIAL_MINING_REWARD;
  }

  public get pendingTransactions(): Transaction[] {
    return this.mempool.getTransactions();
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
      Logger.error('Failed to save blockchain to disk:', err);
    }
  }

  private loadFromDisk(): void {
    if (!this.storagePath || !fs.existsSync(this.storagePath)) return;
    try {
      const data = JSON.parse(fs.readFileSync(this.storagePath, 'utf8'));

      // Hydrate chain and transactions using factory methods
      this.chain = data.chain.map((block: any) => Block.fromObject(block));

      this.mempool.setTransactions(data.pendingTransactions.map((tx: any) =>
        Transaction.fromObject(tx)
      ));

      this.miningReward = data.miningReward;

      // Validate the loaded chain
      if (!this.isChainValid()) {
        Logger.error('CRITICAL: Loaded blockchain is invalid! Resetting to Genesis block.');
        this.chain = [this.createGenesisBlock()];
        this.mempool.clear();
        this.saveToDisk(); // Overwrite the corrupt file with a fresh start
      } else {
        Logger.log(`Successfully loaded and verified blockchain from disk (${this.chain.length} blocks)`);
      }
    } catch (err) {
      Logger.error('Failed to load blockchain from disk:', err);
    }
  }

  /**
   * Resets the chain to the Genesis block and clears all transactions.
   * This is immediately persisted to disk.
   */
  public reset(): void {
    this.chain = [this.createGenesisBlock()];
    this.mempool.clear();
    this.saveToDisk();
  }

  /**
   * The first block of a blockchain is special. It doesn't have a previous block to link to.
   * This is called the "Genesis Block". We have to create it manually.
   */
  private createGenesisBlock(): Block {
    return new Block(
      0,
      Date.parse(NETWORK_CONSTANTS.GENESIS_DATE),
      [],
      NETWORK_CONSTANTS.GENESIS_PREVIOUS_HASH
    );
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
    // 1. Create the reward transaction for the miner
    const rewardTx = new Transaction(null, miningRewardAddress, this.miningReward);
    
    // 2. Combine with other pending transactions
    const transactionsToMine = [...this.mempool.getTransactions(), rewardTx];

    // 3. Create and mine the block
    const block = new Block(this.chain.length, Date.now(), transactionsToMine, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);
    
    Logger.log(`Block #${block.index} Mined! Hash: ${block.hash.substring(0, 10)}... (Nonce: ${block.nonce})`);
    
    // 4. Add the mined block to our chain
    this.addBlock(block);

    // 5. Clear the mempool
    this.mempool.clear();

    // 6. Update internal state for the NEXT mining operation (halving check)
    this.miningReward = NETWORK_CONSTANTS.calculateMiningReward(this.chain.length);
  }

  /**
   * Directly adds a block to the chain and saves it to disk.
   * Useful for syncing blocks received from peers.
   */
  public addBlock(newBlock: Record<string, any> | Block): void {
    const hydratedBlock = newBlock instanceof Block ? newBlock : Block.fromObject(newBlock);
    this.chain.push(hydratedBlock);
    this.saveToDisk();
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

    if (this.mempool.containsTransaction(transaction)) {
      throw new Error('Duplicate transaction: This transaction is already in the pending pool.');
    }

    // Prevent sending more than the wallet has!
    // We must calculate the balance based on the mined chain PLUS the pending transactions they've already submitted.
    let currentBalance = this.getBalanceOfAddress(transaction.fromAddress);
    for (const pendingTx of this.mempool.getTransactions()) {
      if (pendingTx.fromAddress === transaction.fromAddress) {
        currentBalance -= pendingTx.amount;
      }
    }

    if (currentBalance < transaction.amount) {
      throw new Error('Not enough balance to complete this transaction');
    }

    this.mempool.addTransaction(transaction);
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
    return ChainValidator.isChainValid(this.chain, this.createGenesisBlock());
  }
  /**
   * Replaces the current chain with a new one, provided the new chain is longer and valid.
   * This is the core of the "Longest Chain Rule" in decentralization.
   */
  public replaceChain(newChain: (Record<string, any> | Block)[]): boolean {
    if (newChain.length <= this.chain.length) {
      Logger.log('Received chain is not longer than current chain. Ignoring.');
      return false;
    }

    // Hydrate the new chain for validation and use
    const hydratedChain = newChain.map(obj => obj instanceof Block ? obj : Block.fromObject(obj));

    // Verify the new chain is valid before accepting it
    if (!ChainValidator.isChainValid(hydratedChain, this.createGenesisBlock())) {
      Logger.log('Received chain is invalid. Ignoring.');
      return false;
    }

    Logger.log('Replacing blockchain with the longer chain from peer.');
    this.chain = hydratedChain;
    this.miningReward = NETWORK_CONSTANTS.calculateMiningReward(this.chain.length);
    this.saveToDisk();
    return true;
  }

  /**
   * Gracefully shuts down the blockchain, ensuring latest state is persisted.
   */
  public shutdown(): void {
    Logger.log('Shutting down blockchain... Saving latest state.');
    this.saveToDisk();
  }
}
