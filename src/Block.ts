import * as crypto from 'crypto';

export class Block {
  public timestamp: number;
  public data: any;
  public previousHash: string;
  public hash: string;
  public nonce: number;

  constructor(timestamp: number, data: any, previousHash: string = '') {
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    this.nonce = 0;
    // We calculate the hash based on the initial properties of the block
    this.hash = this.calculateHash();
  }

  /**
   * Calculates the SHA-256 hash of this block.
   * The hash acts like a unique digital fingerprint for the block's data.
   */
  public calculateHash(): string {
    const dataToHash = this.previousHash + this.timestamp + JSON.stringify(this.data) + this.nonce;
    
    return crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');
  }

  /**
   * Implements Proof of Work.
   * It recalculates the hash over and over (by incrementing the nonce) until the hash starts
   * with a specific number of zeros (defined by the 'difficulty').
   */
  public mineBlock(difficulty: number): void {
    // Create a string of zeros with length equal to the difficulty
    // e.g., if difficulty is 3, target is "000"
    const target = Array(difficulty + 1).join("0");

    // Keep recalculating the hash until it starts with the target string of zeros
    while (this.hash.substring(0, difficulty) !== target) {
      this.nonce++;
      this.hash = this.calculateHash();
    }

    console.log(`Block Mined! Hash: ${this.hash} (Nonce: ${this.nonce})`);
  }
}
