import { Block } from '../Block';
import { Transaction } from '../Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

describe('Block', () => {

  // ── Hash Determinism ──────────────────────────────────────────────────────

  test('calculateHash() is deterministic for identical inputs', () => {
    const b1 = new Block(1, 1000, [], '0');
    const b2 = new Block(1, 1000, [], '0');
    expect(b1.calculateHash()).toBe(b2.calculateHash());
  });

  test('calculateHash() changes when index changes', () => {
    const b1 = new Block(1, 1000, [], '0');
    const b2 = new Block(2, 1000, [], '0');
    expect(b1.calculateHash()).not.toBe(b2.calculateHash());
  });

  test('calculateHash() changes when timestamp changes', () => {
    const b1 = new Block(1, 1000, [], '0');
    const b2 = new Block(1, 2000, [], '0');
    expect(b1.calculateHash()).not.toBe(b2.calculateHash());
  });

  test('calculateHash() changes when previousHash changes', () => {
    const b1 = new Block(1, 1000, [], 'abc');
    const b2 = new Block(1, 1000, [], 'xyz');
    expect(b1.calculateHash()).not.toBe(b2.calculateHash());
  });

  test('calculateHash() changes when transactions change', () => {
    const sender = ec.genKeyPair();
    const recipient = ec.genKeyPair();
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    tx.signTransaction(sender);

    const empty = new Block(1, 1000, [], '0');
    const withTx = new Block(1, 1000, [tx], '0');
    expect(empty.calculateHash()).not.toBe(withTx.calculateHash());
  });

  test('calculateHash() changes when nonce changes', () => {
    const block = new Block(1, 1000, [], '0');
    const hashBefore = block.calculateHash();
    block.nonce = 42;
    expect(block.calculateHash()).not.toBe(hashBefore);
  });

  // ── Proof of Work ─────────────────────────────────────────────────────────

  test('mineBlock() produces a hash satisfying the difficulty target', () => {
    const block = new Block(1, Date.now(), [], '0');
    block.mineBlock(3);
    expect(block.hash.startsWith('000')).toBe(true);
  });

  test('mineBlock() increments nonce until a solution is found', () => {
    const block = new Block(1, Date.now(), [], '0');
    expect(block.nonce).toBe(0);
    block.mineBlock(2);
    expect(block.nonce).toBeGreaterThan(0);
  });

  test('mineBlock() stores the solved hash on the block', () => {
    const block = new Block(1, Date.now(), [], '0');
    block.mineBlock(2);
    // The stored hash should match what calculateHash() produces with the final nonce
    expect(block.hash).toBe(block.calculateHash());
  });

  // ── Hydration ─────────────────────────────────────────────────────────────

  test('fromObject() restores all primitive fields correctly', () => {
    const original = new Block(3, 999, [], 'prevhash');
    original.mineBlock(1);

    const hydrated = Block.fromObject(JSON.parse(JSON.stringify(original)));

    expect(hydrated.index).toBe(original.index);
    expect(hydrated.timestamp).toBe(original.timestamp);
    expect(hydrated.previousHash).toBe(original.previousHash);
    expect(hydrated.hash).toBe(original.hash);
    expect(hydrated.nonce).toBe(original.nonce);
  });

  test('fromObject() hydrates nested transactions so isValid() still works', () => {
    const sender = ec.genKeyPair();
    const recipient = ec.genKeyPair();
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    tx.signTransaction(sender);

    const original = new Block(1, Date.now(), [tx], '0');
    const hydrated = Block.fromObject(JSON.parse(JSON.stringify(original)));

    expect(hydrated.transactions).toHaveLength(1);
    expect(hydrated.transactions[0].isValid()).toBe(true);
  });
});
