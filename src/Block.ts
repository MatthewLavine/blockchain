import * as crypto from 'crypto';
import { Transaction } from './Transaction';

export class Block {
  public index: number;
  public timestamp: number;
  public transactions: Transaction[];
  public previousHash: string;
  public hash: string;
  public nonce: number;

  constructor(index: number, timestamp: number, transactions: Transaction[], previousHash: string = '') {
    this.index = index;
    this.timestamp = timestamp;
    this.transactions = transactions;
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
    const dataToHash = this.index + this.previousHash + this.timestamp + JSON.stringify(this.transactions) + this.nonce;
    
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
  }

  /**
   * Static factory to create a Block instance from a raw object.
   * Recursively hydrates internal Transactions as well.
   */
  static fromObject(obj: Record<string, any>): Block {
    const transactions = obj.transactions.map((tx: any) => Transaction.fromObject(tx));
    const block = new Block(obj.index, obj.timestamp, transactions, obj.previousHash);
    block.nonce = obj.nonce;
    block.hash = obj.hash;
    return block;
  }
}
