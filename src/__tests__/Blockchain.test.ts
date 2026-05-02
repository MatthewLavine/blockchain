import { Blockchain } from '../Blockchain';
import { Block } from '../Block';
import { Transaction } from '../Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

// Helper: generate a funded wallet by mining a reward to it
async function fundWallet(chain: Blockchain, address: string): Promise<void> {
  await chain.minePendingTransactions(address);
}

describe('Blockchain', () => {
  let chain: Blockchain;
  let alice: EC.KeyPair;
  let bob: EC.KeyPair;

  beforeEach(async () => {
    chain = new Blockchain();
    // Use a unique ID for each test to ensure LevelDB isolation
    await chain.setStoragePath(`test_${Math.random().toString(36).substring(7)}`);
    alice = ec.genKeyPair();
    bob = ec.genKeyPair();
  });

  afterEach(async () => {
    await chain.shutdown();
  });

  // ── Balance ──────────────────────────────────────────────────────────────

  test('getBalanceOfAddress() returns 0 for a new address', () => {
    expect(chain.getBalanceOfAddress(alice.getPublic('hex'))).toBe(0);
  });

  test('getBalanceOfAddress() reflects mining rewards', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    // The reward tx is now in the latest block
    expect(chain.getBalanceOfAddress(alice.getPublic('hex'))).toBeGreaterThan(0);
  });

  // ── createTransaction ─────────────────────────────────────────────────────

  test('createTransaction() rejects an unsigned transaction', async () => {
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 10, 0, 1000);
    // No signature — should throw
    await expect(chain.createTransaction(tx)).rejects.toThrow();
  });

  test('createTransaction() rejects a transaction with insufficient funds', async () => {
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 9999 * 1000000, 0, 1000);
    tx.signTransaction(alice);
    await expect(chain.createTransaction(tx)).rejects.toThrow('Not enough balance');
  });

  test('createTransaction() accepts a valid funded transaction', async () => {
    // Fund alice
    await chain.minePendingTransactions(alice.getPublic('hex'));

    const aliceBalance = chain.getBalanceOfAddress(alice.getPublic('hex'));
    expect(aliceBalance).toBeGreaterThan(0);

    // Spend amount leaving at least the fee behind
    const fee = 1000;
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance - fee, 0, fee);
    tx.signTransaction(alice);
    await expect(chain.createTransaction(tx)).resolves.not.toThrow();
    expect(chain.pendingTransactions.length).toBeGreaterThan(0);
  });

  test('createTransaction() rejects a transaction with fee too low', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 1000, 0, 0);
    tx.signTransaction(alice);
    await expect(chain.createTransaction(tx)).rejects.toThrow('fee too low');
  });

  test('createTransaction() rejects an invalid sender address', async () => {
    const tx = new Transaction('bad-address', bob.getPublic('hex'), 10, 0, 1000);
    // Since it's malformed, we don't even need to sign it to trigger the format check
    await expect(chain.createTransaction(tx)).rejects.toThrow('Invalid sender address format');
  });

  test('createTransaction() rejects an invalid recipient address', async () => {
    const tx = new Transaction(alice.getPublic('hex'), 'bad-address', 10, 0, 1000);
    tx.signTransaction(alice);
    await expect(chain.createTransaction(tx)).rejects.toThrow('Invalid recipient address format');
  });

  test('createTransaction() rejects a null sender address (system-only)', async () => {
    const tx = new Transaction(null, bob.getPublic('hex'), 10, 0, 1000);
    await expect(chain.createTransaction(tx)).rejects.toThrow('Invalid sender address format');
  });

  // ── replaceChain (Longest Chain Rule) ─────────────────────────────────────

  test('replaceChain() rejects a chain that is not longer', async () => {
    const shorterChain = chain.chain.slice();
    const result = await chain.replaceChain(shorterChain);
    expect(result).toBe(false);
  });

  test('replaceChain() rejects an invalid longer chain', async () => {
    const other = new Blockchain();
    await other.setStoragePath(`test_other_${Math.random().toString(36).substring(7)}`);
    await other.minePendingTransactions(bob.getPublic('hex'));
    // Tamper a block
    (other.chain[1] as any).hash = 'tampered';

    const result = await chain.replaceChain(other.chain);
    expect(result).toBe(false);
    await other.shutdown();
  });

  test('replaceChain() accepts a valid longer chain', async () => {
    const other = new Blockchain();
    await other.setStoragePath(`test_other_${Math.random().toString(36).substring(7)}`);
    await other.minePendingTransactions(bob.getPublic('hex'));
    await other.minePendingTransactions(bob.getPublic('hex'));

    const result = await chain.replaceChain(other.chain);
    expect(result).toBe(true);
    expect(chain.chain.length).toBe(other.chain.length);
    await other.shutdown();
  });

  // ── isChainValid ─────────────────────────────────────────────────────────

  test('isChainValid() returns true for a fresh chain', () => {
    expect(chain.isChainValid()).toBe(true);
  });

  test('isChainValid() returns false after tampering a block', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    (chain.chain[1] as any).hash = 'tampered';
    expect(chain.isChainValid()).toBe(false);
  });

  // ── Mining Flow ───────────────────────────────────────────────────────────

  test('minePendingTransactions() adds a new block to the chain', async () => {
    expect(chain.chain.length).toBe(1); // genesis only
    await chain.minePendingTransactions(alice.getPublic('hex'));
    expect(chain.chain.length).toBe(2);
  });

  test('minePendingTransactions() clears the mempool', async () => {
    // Add a user transaction first
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const aliceBalance = chain.getBalanceOfAddress(alice.getPublic('hex'));

    const fee = 1000;
    const userTx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance - fee, 0, fee);
    userTx.signTransaction(alice);
    await chain.createTransaction(userTx);

    // Mine — should clear the mempool
    await chain.minePendingTransactions(bob.getPublic('hex'));
    expect(chain.pendingTransactions).toHaveLength(0);
  });

  test('minePendingTransactions() only removes transactions that were included in the block', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const fee = 1000;
    const tx1 = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 10000, 0, fee);
    tx1.signTransaction(alice);
    await chain.createTransaction(tx1);

    const tx2 = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 20000, 1, fee);
    tx2.signTransaction(alice);
    await chain.createTransaction(tx2);

    // If we were to mine now, both would be included. 
    // To test the "partial clear" logic, we can manually call removeTransactions 
    // simulating a scenario where only tx1 was mined.
    (chain as any).mempool.removeTransactions([tx1]);

    expect(chain.pendingTransactions).toHaveLength(1);
    expect(chain.pendingTransactions[0].signature).toBe(tx2.signature);
  });

  test('addBlock() rejects blocks with invalid transactions', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const badTx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 10000000, 0, 1000); // too much money
    badTx.signTransaction(alice);
    
    const badBlock = new Block(chain.chain.length, Date.now(), [badTx], chain.getLatestBlock().hash);
    badBlock.mineBlock(chain.difficulty);

    await expect(chain.addBlock(badBlock)).rejects.toThrow('failed validation');
  });

  test('addBlock() should not mutate the ledger if validation fails halfway', async () => {
    const address = alice.getPublic('hex');
    const recipient = bob.getPublic('hex');
    
    // 1. Give Alice some money
    await chain.minePendingTransactions(address);
    const initialBalance = chain.getBalanceOfAddress(address);
    
    // 2. Create a block with one valid tx and one invalid tx (insufficient funds)
    const validTx = new Transaction(address, recipient, 1000, 0, 1000);
    validTx.signTransaction(alice);
    
    const invalidTx = new Transaction(address, recipient, initialBalance + 1, 1, 1000); 
    invalidTx.signTransaction(alice);
    
    const block = new Block(chain.chain.length, Date.now(), [validTx, invalidTx], chain.getLatestBlock().hash);
    block.mineBlock(chain.difficulty);
    
    // 3. Try to add the block
    try {
      await chain.addBlock(block);
    } catch (e) {
      // Expected
    }
    
    // 4. Verify Alice's balance is still initialBalance (the validTx was rolled back)
    expect(chain.getBalanceOfAddress(address)).toBe(initialBalance);
  });

  test('getLatestBlock() returns the most recently added block', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const latest = chain.getLatestBlock();
    expect(latest.index).toBe(chain.chain.length - 1);
    expect(latest).toBe(chain.chain[chain.chain.length - 1]);
  });

  test('initial miningReward matches NETWORK_CONSTANTS', () => {
    const { NETWORK_CONSTANTS } = require('../Constants');
    expect(chain.miningReward).toBe(NETWORK_CONSTANTS.INITIAL_MINING_REWARD);
  });

  // ── Double-Spend Prevention ───────────────────────────────────────────────

  test('createTransaction() prevents double-spend using pending balance', async () => {
    // Fund alice
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const aliceBalance = chain.getBalanceOfAddress(alice.getPublic('hex'));

    const fee = 1000;
    // First tx spends balance minus the fee — should succeed
    const tx1 = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance - fee, 0, fee);
    tx1.signTransaction(alice);
    await expect(chain.createTransaction(tx1)).resolves.not.toThrow();

    // Second tx tries to spend again before it's mined — should fail
    const tx2 = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), aliceBalance - fee, 1, fee);
    tx2.signTransaction(alice);
    await expect(chain.createTransaction(tx2)).rejects.toThrow('Not enough balance');
  });

  test('createTransaction() rejects floating point amounts', async () => {
    await chain.minePendingTransactions(alice.getPublic('hex'));
    const tx = new Transaction(alice.getPublic('hex'), bob.getPublic('hex'), 10.5, 0, 1000);
    tx.signTransaction(alice);
    await expect(chain.createTransaction(tx)).rejects.toThrow('atomic units');
  });
});
