import * as crypto from 'crypto';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

export class Transaction {
  public fromAddress: string | null;
  public toAddress: string;
  public amount: number;
  public timestamp: number;
  public nonce: number;
  public signature: string;

  /**
   * @param fromAddress The sender's public key (wallet address). Can be null for mining rewards.
   * @param toAddress The recipient's public key (wallet address).
   * @param amount The number of coins being sent.
   * @param nonce The sequential number for this account's transactions.
   */
  constructor(fromAddress: string | null, toAddress: string, amount: number, nonce: number = 0) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
    this.timestamp = Date.now();
    this.nonce = nonce;
    this.signature = ''; // Will be populated when the transaction is signed
  }

  /**
   * Calculates the hash of the transaction. We need to sign the hash of the data,
   * not the raw data itself.
   */
  public calculateHash(): string {
    return crypto
      .createHash('sha256')
      .update(`${this.fromAddress}|${this.toAddress}|${this.amount}|${this.timestamp}|${this.nonce}`)
      .digest('hex');
  }

  /**
   * Signs the transaction with the given private key.
   * @param signingKey The KeyPair object from elliptic.
   */
  public signTransaction(signingKey: EC.KeyPair): void {
    // 1. You can only spend coins from a wallet you own!
    // So we check if the public key of the person signing matches the 'fromAddress'
    if (signingKey.getPublic('hex') !== this.fromAddress) {
      throw new Error('You cannot sign transactions for other wallets!');
    }

    // 2. Hash the transaction data
    const hashTx = this.calculateHash();
    
    // 3. Create the cryptographic signature
    const sig = signingKey.sign(hashTx, 'hex');
    
    // 4. Store the signature in DER format (a standard way to represent signatures)
    this.signature = sig.toDER('hex');
  }

  /**
   * Verifies if the signature is valid and matches the transaction data.
   */
  public isValid(): boolean {
    // 1. Mining rewards are valid by default (they have no 'from' address to check)
    if (this.fromAddress === null) return true;

    // 2. Prevent sending negative, zero, or non-integer amounts!
    if (!Number.isInteger(this.amount) || this.amount <= 0) {
      throw new Error('Transaction amount must be a positive integer (atomic units)');
    }

    // 3. If it has no signature, it's definitely invalid
    if (!this.signature || this.signature.length === 0) {
      throw new Error('No signature in this transaction');
    }

    // 3. Verify the signature!
    // We recreate the public key object from the 'fromAddress' hex string
    const publicKey = ec.keyFromPublic(this.fromAddress, 'hex');
    
    // We check if the signature we stored was created by this public key for this specific transaction hash
    return publicKey.verify(Buffer.from(this.calculateHash(), 'hex'), this.signature);
  }

  /**
   * Static factory to create a Transaction instance from a raw object.
   * Useful for hydrating data from JSON or P2P messages.
   */
  static fromObject(obj: Record<string, any>): Transaction {
    const tx = new Transaction(obj.fromAddress, obj.toAddress, obj.amount, obj.nonce ?? 0);
    tx.timestamp = obj.timestamp ?? Date.now();
    tx.signature = obj.signature;
    return tx;
  }
}
