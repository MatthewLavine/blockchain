import { Blockchain } from '../Blockchain';
import { Transaction } from '../Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

// Helper: generate a funded wallet by mining a reward to it
async function fundWallet(chain: Blockchain, address: string): Promise<void> {
  chain.minePendingTransactions(address);
}

describe('Blockchain', () => {
  let chain: Blockchain;
  let alice: EC.KeyPair;
  let bob: EC.KeyPair;

  beforeEach(() => {
    chain = new Blockchain();
    alice = ec.genKeyPair();
    bob = ec.genKeyPair();
  });

  // ── Balance ──────────────────────────────────────────────────────────────

  test('getBalanceOfAddress() returns 0 for a new address', () => {
    expect(chain.getBalanceOfAddress(alice.getPublic('hex'))).toBe(0);
  });

  test('getBalanceOfAddress() reflects mining rewards', () => {
    chain.minePendingTransactions(alice.getPublic('hex'));
    // The reward tx is now in the latest block
    expect(chain.getBalanceOfAddress(alice.getPublic('hex'))).toBeGreaterThan(0);
  });

  // ── createTransaction ─────────────────────────────────────────────────────

  test('createTransaction() rejects an unsigned transaction', () => {
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 10);
    // No signature — should throw
    expect(() => chain.createTransaction(tx)).toThrow();
  });

  test('createTransaction() rejects a transaction with insufficient funds', () => {
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 9999);
    tx.signTransaction(alice);
    expect(() => chain.createTransaction(tx)).toThrow('Not enough balance');
  });

  test('createTransaction() accepts a valid funded transaction', () => {
    // Fund alice
    chain.minePendingTransactions(alice.getPublic('hex'));

    const aliceBalance = chain.getBalanceOfAddress(alice.getPublic('hex'));
    expect(aliceBalance).toBeGreaterThan(0);

    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance);
    tx.signTransaction(alice);
    expect(() => chain.createTransaction(tx)).not.toThrow();
    expect(chain.pendingTransactions.length).toBeGreaterThan(0);
  });

  // ── replaceChain (Longest Chain Rule) ─────────────────────────────────────

  test('replaceChain() rejects a chain that is not longer', () => {
    const shorterChain = chain.chain.slice();
    const result = chain.replaceChain(shorterChain);
    expect(result).toBe(false);
  });

  test('replaceChain() rejects an invalid longer chain', () => {
    const other = new Blockchain();
    other.minePendingTransactions(bob.getPublic('hex'));
    // Tamper a block
    (other.chain[1] as any).hash = 'tampered';

    const result = chain.replaceChain(other.chain);
    expect(result).toBe(false);
  });

  test('replaceChain() accepts a valid longer chain', () => {
    const other = new Blockchain();
    other.minePendingTransactions(bob.getPublic('hex'));
    other.minePendingTransactions(bob.getPublic('hex'));

    const result = chain.replaceChain(other.chain);
    expect(result).toBe(true);
    expect(chain.chain.length).toBe(other.chain.length);
  });

  // ── isChainValid ─────────────────────────────────────────────────────────

  test('isChainValid() returns true for a fresh chain', () => {
    expect(chain.isChainValid()).toBe(true);
  });

  test('isChainValid() returns false after tampering a block', () => {
    chain.minePendingTransactions(alice.getPublic('hex'));
    (chain.chain[1] as any).hash = 'tampered';
    expect(chain.isChainValid()).toBe(false);
  });

  // ── Mining Flow ───────────────────────────────────────────────────────────

  test('minePendingTransactions() adds a new block to the chain', () => {
    expect(chain.chain.length).toBe(1); // genesis only
    chain.minePendingTransactions(alice.getPublic('hex'));
    expect(chain.chain.length).toBe(2);
  });

  test('minePendingTransactions() clears the mempool', () => {
    // Add a user transaction first
    chain.minePendingTransactions(alice.getPublic('hex'));
    const aliceBalance = chain.getBalanceOfAddress(alice.getPublic('hex'));

    const userTx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance);
    userTx.signTransaction(alice);
    chain.createTransaction(userTx);

    // Mine — should clear the mempool
    chain.minePendingTransactions(bob.getPublic('hex'));
    expect(chain.pendingTransactions).toHaveLength(0);
  });

  test('getLatestBlock() returns the most recently added block', () => {
    chain.minePendingTransactions(alice.getPublic('hex'));
    const latest = chain.getLatestBlock();
    expect(latest.index).toBe(chain.chain.length - 1);
    expect(latest).toBe(chain.chain[chain.chain.length - 1]);
  });

  test('initial miningReward matches NETWORK_CONSTANTS', () => {
    const { NETWORK_CONSTANTS } = require('../Constants');
    expect(chain.miningReward).toBe(NETWORK_CONSTANTS.INITIAL_MINING_REWARD);
  });

  // ── Double-Spend Prevention ───────────────────────────────────────────────

  test('createTransaction() prevents double-spend using pending balance', () => {
    // Fund alice
    chain.minePendingTransactions(alice.getPublic('hex'));
    const aliceBalance = chain.getBalanceOfAddress(alice.getPublic('hex'));

    // First tx spends the full balance — should succeed
    const tx1 = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance);
    tx1.signTransaction(alice);
    expect(() => chain.createTransaction(tx1)).not.toThrow();

    // Second tx tries to spend the same balance before it's mined — should fail
    const tx2 = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance);
    tx2.signTransaction(alice);
    expect(() => chain.createTransaction(tx2)).toThrow('Not enough balance');
  });

  test('createTransaction() rejects floating point amounts', () => {
    chain.minePendingTransactions(alice.getPublic('hex'));
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 10.5);
    tx.signTransaction(alice);
    expect(() => chain.createTransaction(tx)).toThrow('atomic units');
  });
});
