import { Block } from './Block';
import { Transaction } from './Transaction';

export class Blockchain {
  public chain: Block[];
  public difficulty: number;
  public pendingTransactions: Transaction[];
  public miningReward: number;

  constructor() {
    // When we initialize a new blockchain, we automatically create the Genesis Block.
    this.chain = [this.createGenesisBlock()];
    this.difficulty = 4;
    this.pendingTransactions = [];
    this.miningReward = 100; // Reward the miner with 100 coins
  }

  /**
   * The first block of a blockchain is special. It doesn't have a previous block to link to.
   * This is called the "Genesis Block". We have to create it manually.
   */
  private createGenesisBlock(): Block {
    return new Block(Date.parse("2026-01-01"), [], "0");
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
    // In a real blockchain like Bitcoin, a block has a max size and miners choose which
    // transactions to include. For this tutorial, we just include all pending transactions.
    const block = new Block(Date.now(), this.pendingTransactions, this.getLatestBlock().hash);
    
    // Mine the block
    block.mineBlock(this.difficulty);

    console.log('Block successfully mined!');
    this.chain.push(block);

    // Reset the pending transactions array and add the mining reward for the NEXT block
    // Notice that the 'fromAddress' is null because the system is creating these coins out of thin air!
    this.pendingTransactions = [
      new Transaction(null, miningRewardAddress, this.miningReward)
    ];
  }

  /**
   * Adds a new transaction to the pool of pending transactions.
   */
  public createTransaction(transaction: Transaction): void {
    this.pendingTransactions.push(transaction);
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
}
