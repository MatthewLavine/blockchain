import { Block } from './Block';
import { Transaction } from './Transaction';
import { Logger } from './Logger';
import { Mempool } from './Mempool';
import { ChainValidator } from './ChainValidator';
import { NETWORK_CONSTANTS } from './Constants';
import { Level } from 'level';
import * as fs from 'fs';
import * as path from 'path';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  private mempool: Mempool;
  public miningReward: number;
  private db: Level<string, any> | null = null;
  private storagePath: string | null = null;
  private knownSignatures: Set<string> = new Set();
  private ledger: Map<string, number> = new Map();
  private accountNonces: Map<string, number> = new Map();
  private MAX_MEMPOOL_SIZE = 5000;
  private saveQueue: Promise<void> = Promise.resolve();
  private lastSavedIndex: number = -1; // Tracks the highest block index persisted to disk

  constructor() {
    // When we initialize a new blockchain, we automatically create the Genesis Block.
    this.chain = [this.createGenesisBlock()];
    this.difficulty = NETWORK_CONSTANTS.INITIAL_DIFFICULTY;
    this.mempool = new Mempool();
    this.miningReward = NETWORK_CONSTANTS.INITIAL_MINING_REWARD;
    this.ledger = new Map();
    this.accountNonces = new Map();
    // Process Genesis transactions (if any)
    this.updateLedgerWithBlock(this.chain[0]);
  }

  public get pendingTransactions(): Transaction[] {
    return this.mempool.getTransactions();
  }

  public async setStoragePath(id: string | number): Promise<void> {
    const dbPath = path.join(__dirname, '..', 'data', `blockchain_db_${id}`);
    this.storagePath = dbPath;
    this.db = new Level(dbPath, { valueEncoding: 'json' });
    await this.loadFromDisk();
  }

  private async saveToDisk(): Promise<void> {
    if (!this.db) return;

    // We use a promise-based queue to ensure that multiple saveToDisk calls 
    // are executed sequentially, preventing race conditions on the 'meta:latestIndex'.
    this.saveQueue = this.saveQueue.then(async () => {
      try {
        const batch = this.db!.batch();

        // 1. Metadata and Mempool
        batch.put('meta:latestIndex', (this.chain.length - 1).toString());
        batch.put('meta:miningReward', this.miningReward.toString());
        batch.put('mempool', this.pendingTransactions);

        // 2. Delta Persistence: Only save blocks that haven't been persisted yet.
        // This handles both single-block appends and large P2P syncs efficiently.
        for (let i = this.lastSavedIndex + 1; i < this.chain.length; i++) {
          batch.put(`block:${i}`, this.chain[i]);
        }

        await batch.write();
        
        // Only update the lastSavedIndex after a successful write
        this.lastSavedIndex = this.chain.length - 1;
      } catch (err) {
        Logger.error('Failed to save blockchain to LevelDB:', err);
      }
    });

    return this.saveQueue;
  }

  private async loadFromDisk(): Promise<void> {
    if (!this.db) return;
    try {
      const latestIndexStr = await this.db.get('meta:latestIndex');
      const latestIndex = parseInt(latestIndexStr);
      this.lastSavedIndex = latestIndex;
      
      const chain: Block[] = [];
      for (let i = 0; i <= latestIndex; i++) {
        const blockData = await this.db.get(`block:${i}`);
        chain.push(Block.fromObject(blockData));
      }
      this.chain = chain;

      const mempoolData = await this.db.get('mempool');
      this.mempool.setTransactions(mempoolData.map((tx: any) =>
        Transaction.fromObject(tx)
      ));

      const rewardStr = await this.db.get('meta:miningReward');
      this.miningReward = parseFloat(rewardStr);

      // Rebuild stateful ledger and nonces from the trusted block history
      this.ledger = this.getLedger();
      this.accountNonces = this.getAccountNonces();

      // Rebuild the known signatures set for fast replay protection
      this.knownSignatures.clear();
      for (const block of this.chain) {
        for (const tx of block.transactions) {
          if (tx.signature) this.knownSignatures.add(tx.signature);
        }
      }

      // Validate the loaded chain
      if (!this.isChainValid()) {
        Logger.error('CRITICAL: Loaded blockchain is invalid! Resetting to Genesis block.');
        await this.reset();
      } else {
        Logger.log(`Successfully loaded and verified blockchain from LevelDB (${this.chain.length} blocks)`);
      }
    } catch (err: any) {
      if (err.code === 'LEVEL_NOT_FOUND') {
        Logger.log('No existing blockchain found. Starting fresh.');
        await this.saveToDisk();
      } else {
        Logger.error('Failed to load blockchain from LevelDB:', err);
        await this.reset();
      }
    }
  }

  public async reset(): Promise<void> {
    this.chain = [this.createGenesisBlock()];
    this.difficulty = NETWORK_CONSTANTS.INITIAL_DIFFICULTY;
    this.miningReward = NETWORK_CONSTANTS.INITIAL_MINING_REWARD;
    this.mempool.clear();
    this.ledger.clear();
    this.knownSignatures.clear();
    this.accountNonces.clear();
    this.lastSavedIndex = -1; // Reset persistence tracker
    await this.saveToDisk();
    Logger.log('Blockchain reset to genesis state.');
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
  public async minePendingTransactions(miningRewardAddress: string): Promise<void> {
    // 1. Create the reward transaction for the miner (base reward + all pending fees)
    const nextBlockIndex = this.chain.length;
    const currentReward = NETWORK_CONSTANTS.calculateMiningReward(nextBlockIndex);

    // Select highest-fee transactions up to the block size limit
    const maxTxPerBlock = NETWORK_CONSTANTS.MAX_BLOCK_TRANSACTIONS - 1;
    const selectedTxs = this.mempool.getTransactionsByPriority(maxTxPerBlock);

    // Sum fees from selected transactions only
    const totalFees = selectedTxs.reduce((sum, tx) => sum + tx.fee, 0);
    const rewardTx = new Transaction(null, miningRewardAddress, currentReward + totalFees, 0, 0);

    // 2. Combine with other pending transactions
    const transactionsToMine = [...selectedTxs, rewardTx];

    // 3. Create and mine the block
    const block = new Block(this.chain.length, Date.now(), transactionsToMine, this.getLatestBlock().hash);
    block.mineBlock(this.difficulty);

    Logger.log(`Block #${block.index} Mined! Hash: ${block.hash.substring(0, 10)}... (Nonce: ${block.nonce})`);

    // 4. Add the mined block to our chain
    await this.addBlock(block);

    // 5. Remove only the transactions that were mined into the block from the mempool
    this.mempool.removeTransactions(transactionsToMine);

    // 6. Update internal state for the NEXT mining operation
    this.miningReward = NETWORK_CONSTANTS.calculateMiningReward(this.chain.length);
  }

  /**
   * Directly adds a block to the chain and saves it to disk.
   * Useful for syncing blocks received from peers.
   */
  public async addBlock(newBlock: Record<string, any> | Block): Promise<void> {
    const hydratedBlock = newBlock instanceof Block ? newBlock : Block.fromObject(newBlock);

    // 1. Prepare validation context
    const latestBlock = this.getLatestBlock();
    const expectedReward = NETWORK_CONSTANTS.calculateMiningReward(hydratedBlock.index);

    // Create a temporary copy of the ledger for atomic validation.
    // ChainValidator.validateBlock will mutate this copy.
    const tempLedger = new Map(this.ledger);
    const tempNonces = new Map(this.accountNonces);

    // 2. Perform full validation using the temporary ledger
    // First, check for replay attacks (both against existing chain and within this block)
    const currentBlockSignatures = new Set<string>();
    for (const tx of hydratedBlock.transactions) {
      if (tx.signature) {
        if (this.knownSignatures.has(tx.signature) || currentBlockSignatures.has(tx.signature)) {
          throw new Error(`Replay attack detected: Transaction with signature ${tx.signature.substring(0, 10)}... already exists.`);
        }
        currentBlockSignatures.add(tx.signature);
      }
    }

    try {
      ChainValidator.validateBlock(hydratedBlock, latestBlock, expectedReward, this.difficulty, tempLedger, tempNonces);
    } catch (error: any) {
      throw new Error(`Block #${hydratedBlock.index} failed validation: ${error.message}`);
    }

    // 3. Add to chain and update master ledger only if validation passed
    this.chain.push(hydratedBlock);
    this.ledger = tempLedger;
    this.accountNonces = tempNonces;

    // Add these signatures to our known set for replay protection
    for (const tx of hydratedBlock.transactions) {
      if (tx.signature) this.knownSignatures.add(tx.signature);
    }

    // 5. Sync mempool: Remove any transactions that were just included in this block
    this.mempool.removeTransactions(hydratedBlock.transactions);

    await this.saveToDisk();
  }

  /**
   * Updates the stateful ledger with transactions from a newly added block.
   */
  private updateLedgerWithBlock(block: Block): void {
    for (const tx of block.transactions) {
      if (tx.fromAddress !== null) {
        const senderBalance = this.ledger.get(tx.fromAddress) || 0;
        this.ledger.set(tx.fromAddress, senderBalance - tx.amount - tx.fee);
      }
      const recipientBalance = this.ledger.get(tx.toAddress) || 0;
      this.ledger.set(tx.toAddress, recipientBalance + tx.amount);
    }
  }

  /**
   * Builds the account nonce map based on all mined blocks.
   */
  public getAccountNonces(): Map<string, number> {
    const nonces = new Map<string, number>();
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress !== null) {
          const currentNonce = nonces.get(tx.fromAddress) || 0;
          nonces.set(tx.fromAddress, currentNonce + 1);
        }
      }
    }
    return nonces;
  }

  /**
   * Returns the next expected nonce for an address, considering both mined 
   * blocks and pending transactions in the mempool.
   */
  public getNextNonce(address: string): number {
    let nonce = this.accountNonces.get(address) || 0;
    
    // Add pending transactions from this address
    for (const tx of this.mempool.getTransactions()) {
      if (tx.fromAddress === address) {
        nonce++;
      }
    }
    
    return nonce;
  }

  /**
   * Adds a new transaction to the pool of pending transactions.
   * It enforces that the transaction must be signed, valid, and the sender has enough funds!
   */
  public async createTransaction(transaction: Transaction): Promise<void> {
    // Enforce minimum transaction fee
    if (transaction.fee < NETWORK_CONSTANTS.MIN_TRANSACTION_FEE) {
      throw new Error(
        `Transaction fee too low. Minimum fee is ${NETWORK_CONSTANTS.MIN_TRANSACTION_FEE} atomic units (${NETWORK_CONSTANTS.MIN_TRANSACTION_FEE / NETWORK_CONSTANTS.UNITS_PER_COIN} AGC).`
      );
    }

    if (transaction.fromAddress === null || !Transaction.isValidAddress(transaction.fromAddress)) {
      throw new Error('Invalid sender address format');
    }
    if (!Transaction.isValidAddress(transaction.toAddress)) {
      throw new Error('Invalid recipient address format');
    }

    if (!Number.isInteger(transaction.amount) || transaction.amount <= 0) {
      throw new Error('Transaction amount must be a positive integer (atomic units).');
    }

    if (!transaction.isValid()) {
      throw new Error('Cannot add invalid transaction to chain');
    }

    const expectedNonce = this.getNextNonce(transaction.fromAddress);
    if (transaction.nonce !== expectedNonce) {
      throw new Error(`Invalid nonce: Expected ${expectedNonce} but got ${transaction.nonce}.`);
    }

    if (this.mempool.containsTransaction(transaction)) {
      throw new Error('Duplicate transaction: This transaction is already in the pending pool.');
    }

    if (this.knownSignatures.has(transaction.signature)) {
      throw new Error('Replay attack detected: This transaction has already been mined and included in the blockchain.');
    }

    if (this.mempool.getTransactions().length >= this.MAX_MEMPOOL_SIZE) {
      throw new Error('Mempool is full. Please try again later.');
    }

    // Prevent sending more than the wallet has!
    // We must calculate the balance based on the mined chain PLUS the pending transactions they've already submitted.
    let currentBalance = this.getBalanceOfAddress(transaction.fromAddress);
    for (const pendingTx of this.mempool.getTransactions()) {
      if (pendingTx.fromAddress === transaction.fromAddress) {
        currentBalance -= (pendingTx.amount + pendingTx.fee);
      }
    }

    if (currentBalance < transaction.amount + transaction.fee) {
      throw new Error('Not enough balance to complete this transaction');
    }

    this.mempool.addTransaction(transaction);
    await this.saveToDisk();
  }

  /**
   * Calculates the balance of a given wallet address using the stateful ledger.
   */
  public getBalanceOfAddress(address: string): number {
    return this.ledger.get(address) || 0;
  }

  /**
   * Builds the full ledger (balance map) based on all mined blocks.
   * This is used for validating new blocks.
   */
  public getLedger(): Map<string, number> {
    const ledger = new Map<string, number>();
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.fromAddress !== null) {
          const senderBalance = ledger.get(tx.fromAddress) || 0;
          ledger.set(tx.fromAddress, senderBalance - tx.amount - tx.fee);
        }
        const recipientBalance = ledger.get(tx.toAddress) || 0;
        ledger.set(tx.toAddress, recipientBalance + tx.amount);
      }
    }
    return ledger;
  }

  /**
   * Loops through the entire chain to verify its integrity.
   */
  public isChainValid(difficulty: number = this.difficulty): boolean {
    return ChainValidator.isChainValid(this.chain, this.createGenesisBlock(), difficulty);
  }
  /**
   * Replaces the current chain with a new one, provided the new chain is longer and valid.
   * This is the core of the "Longest Chain Rule" in decentralization.
   */
  public async replaceChain(newChain: (Record<string, any> | Block)[]): Promise<boolean> {
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

    // Rebuild the stateful ledger and nonces for the new chain
    this.ledger = this.getLedger();
    this.accountNonces = this.getAccountNonces();

    // Rebuild signature set for the new chain
    this.knownSignatures.clear();
    for (const block of this.chain) {
      for (const tx of block.transactions) {
        if (tx.signature) this.knownSignatures.add(tx.signature);
      }
    }

    this.lastSavedIndex = -1; // Force a full chain rewrite to handle potential reorgs
    await this.saveToDisk();
    return true;
  }

  /**
   * Gracefully shuts down the blockchain, ensuring latest state is persisted.
   */
  public async shutdown(): Promise<void> {
    Logger.log('Shutting down blockchain... Saving latest state.');
    await this.saveToDisk();
    if (this.db) {
      await this.db.close();
    }
  }
}
