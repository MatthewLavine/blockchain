import { Transaction } from '../Transaction';
import { Mempool } from '../Mempool';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

function makeTx(amount: number = 10): Transaction {
  const sender = ec.genKeyPair();
  const recipient = ec.genKeyPair();
  const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), amount);
  tx.signTransaction(sender);
  return tx;
}

describe('Mempool', () => {
  let mempool: Mempool;

  beforeEach(() => {
    mempool = new Mempool();
  });

  test('starts empty', () => {
    expect(mempool.size()).toBe(0);
    expect(mempool.getTransactions()).toHaveLength(0);
  });

  test('addTransaction() increases size', () => {
    mempool.addTransaction(makeTx());
    expect(mempool.size()).toBe(1);
    mempool.addTransaction(makeTx());
    expect(mempool.size()).toBe(2);
  });

  test('getTransactions() returns a copy, not the internal array', () => {
    mempool.addTransaction(makeTx());
    const copy = mempool.getTransactions();
    copy.push(makeTx());
    // Internal state should be unchanged
    expect(mempool.size()).toBe(1);
  });

  test('clear() empties the pool', () => {
    mempool.addTransaction(makeTx());
    mempool.addTransaction(makeTx());
    mempool.clear();
    expect(mempool.size()).toBe(0);
  });

  test('setTransactions() replaces the pool', () => {
    mempool.addTransaction(makeTx());
    const newTxs = [makeTx(), makeTx(), makeTx()];
    mempool.setTransactions(newTxs);
    expect(mempool.size()).toBe(3);
  });

  test('toJSON() returns the transactions array', () => {
    const tx = makeTx();
    mempool.addTransaction(tx);
    const json = mempool.toJSON();
    expect(json).toHaveLength(1);
    expect(json[0].amount).toBe(tx.amount);
  });
});
