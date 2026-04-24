import { Block } from './Block';

export class Blockchain {
  public chain: Block[];

  constructor() {
    // When we initialize a new blockchain, we automatically create the Genesis Block.
    this.chain = [this.createGenesisBlock()];
  }

  /**
   * The first block of a blockchain is special. It doesn't have a previous block to link to.
   * This is called the "Genesis Block". We have to create it manually.
   */
  private createGenesisBlock(): Block {
    // We can hardcode the date, the data, and set the previous hash to "0"
    return new Block(Date.parse("2026-01-01"), "Genesis Block", "0");
  }

  /**
   * A helper method to get the most recently added block in our chain.
   */
  public getLatestBlock(): Block {
    return this.chain[this.chain.length - 1];
  }

  /**
   * Adds a new block to the chain.
   * Crucially, it links the new block to the previous one before adding it.
   */
  public addBlock(newBlock: Block): void {
    // 1. Point the new block to the current latest block in the chain
    newBlock.previousHash = this.getLatestBlock().hash;
    
    // 2. Because the properties of `newBlock` changed (we just changed its previousHash),
    // we MUST recalculate its hash. Otherwise, its hash would be invalid.
    newBlock.hash = newBlock.calculateHash();
    
    // 3. Add the block to our array
    this.chain.push(newBlock);
  }

  /**
   * Loops through the entire chain to verify its integrity.
   * Returns true if the chain is valid, false if it has been tampered with.
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
