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
}
