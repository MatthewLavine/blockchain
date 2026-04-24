import * as crypto from 'crypto';

export class Block {
  public timestamp: number;
  public data: any;
  public previousHash: string;
  public hash: string;

  constructor(timestamp: number, data: any, previousHash: string = '') {
    this.timestamp = timestamp;
    this.data = data;
    this.previousHash = previousHash;
    // We calculate the hash based on the initial properties of the block
    this.hash = this.calculateHash();
  }

  /**
   * Calculates the SHA-256 hash of this block.
   * The hash acts like a unique digital fingerprint for the block's data.
   */
  public calculateHash(): string {
    const dataToHash = this.previousHash + this.timestamp + JSON.stringify(this.data);
    
    return crypto
      .createHash('sha256')
      .update(dataToHash)
      .digest('hex');
  }
}
