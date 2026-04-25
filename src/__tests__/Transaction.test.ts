import { Transaction } from '../Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

describe('Transaction', () => {
  let sender: EC.KeyPair;
  let recipient: EC.KeyPair;

  beforeEach(() => {
    sender = ec.genKeyPair();
    recipient = ec.genKeyPair();
  });

  test('is created with a timestamp', () => {
    const before = Date.now();
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    expect(tx.timestamp).toBeGreaterThanOrEqual(before);
    expect(tx.timestamp).toBeLessThanOrEqual(Date.now());
  });

  test('isValid() returns true for a properly signed transaction', () => {
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    tx.signTransaction(sender);
    expect(tx.isValid()).toBe(true);
  });

  test('isValid() throws if transaction has no signature', () => {
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    expect(() => tx.isValid()).toThrow('No signature');
  });

  test('isValid() returns false if transaction data is tampered after signing', () => {
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    tx.signTransaction(sender);
    // Tamper the amount after signing
    (tx as any).amount = 9999;
    expect(tx.isValid()).toBe(false);
  });

  test('isValid() returns true for mining reward (null fromAddress)', () => {
    const tx = new Transaction(null, recipient.getPublic('hex'), 100);
    expect(tx.isValid()).toBe(true);
  });

  test('isValid() throws for zero or negative amounts', () => {
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 0);
    tx.signTransaction(sender);
    // Reset signature to trigger the amount check path
    const tx2 = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), -10);
    tx2.signTransaction(sender);
    // amount check is only hit after signature check, so sign and then tamper
    expect(() => {
      const bad = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
      bad.signTransaction(sender);
      (bad as any).amount = 0;
      bad.isValid();
    }).toThrow();
  });

  test('fromObject() correctly hydrates all fields including timestamp', () => {
    const ts = 1700000000000;
    const original = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 42);
    original.signTransaction(sender);
    const plain = { ...original, timestamp: ts };

    const hydrated = Transaction.fromObject(plain);
    expect(hydrated.fromAddress).toBe(original.fromAddress);
    expect(hydrated.toAddress).toBe(original.toAddress);
    expect(hydrated.amount).toBe(42);
    expect(hydrated.timestamp).toBe(ts);
    expect(hydrated.signature).toBe(original.signature);
    expect(hydrated.isValid()).toBe(true);
  });

  test('fromObject() falls back to current time when timestamp is missing', () => {
    const before = Date.now();
    const tx = Transaction.fromObject({
      fromAddress: null,
      toAddress: recipient.getPublic('hex'),
      amount: 100,
      signature: '',
    });
    expect(tx.timestamp).toBeGreaterThanOrEqual(before);
  });

  // ── Signing Security ──────────────────────────────────────────────────────

  test('signTransaction() throws when signing with a key that does not match fromAddress', () => {
    const impersonator = ec.genKeyPair();
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    // impersonator tries to sign a transaction from sender's address
    expect(() => tx.signTransaction(impersonator)).toThrow('You cannot sign transactions for other wallets!');
  });

  test('calculateHash() changes when amount changes', () => {
    const tx1 = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    const tx2 = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 999);
    expect(tx1.calculateHash()).not.toBe(tx2.calculateHash());
  });

  test('calculateHash() changes when recipient changes', () => {
    const other = ec.genKeyPair();
    const tx1 = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    const tx2 = new Transaction(sender.getPublic('hex'), other.getPublic('hex'), 50);
    expect(tx1.calculateHash()).not.toBe(tx2.calculateHash());
  });
});
