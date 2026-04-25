import { Block } from '../Block';
import { Transaction } from '../Transaction';
import { ChainValidator } from '../ChainValidator';
import { NETWORK_CONSTANTS } from '../Constants';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

function makeGenesisBlock(): Block {
  return new Block(
    0,
    Date.parse(NETWORK_CONSTANTS.GENESIS_DATE),
    [],
    NETWORK_CONSTANTS.GENESIS_PREVIOUS_HASH
  );
}

function mineBlock(index: number, txs: Transaction[], previousHash: string): Block {
  const block = new Block(index, Date.now(), txs, previousHash);
  block.mineBlock(1); // difficulty=1 for speed
  return block;
}

describe('ChainValidator', () => {
  let genesis: Block;

  beforeEach(() => {
    genesis = makeGenesisBlock();
  });

  test('accepts a valid single-block chain (genesis only)', () => {
    expect(ChainValidator.isChainValid([genesis], genesis)).toBe(true);
  });

  test('accepts a valid multi-block chain', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    const block2 = mineBlock(2, [], block1.hash);
    expect(ChainValidator.isChainValid([genesis, block1, block2], genesis)).toBe(true);
  });

  test('rejects a chain with a tampered genesis block', () => {
    const fakeGenesis = makeGenesisBlock();
    (fakeGenesis as any).timestamp = 9999999999999;
    expect(ChainValidator.isChainValid([fakeGenesis], genesis)).toBe(false);
  });

  test('rejects a chain where a block hash has been tampered', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    // Tamper the stored hash directly
    (block1 as any).hash = 'deadbeef';
    expect(ChainValidator.isChainValid([genesis, block1], genesis)).toBe(false);
  });

  test('rejects a chain where a block previousHash link is broken', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    const block2 = mineBlock(2, [], 'wrong-previous-hash');
    expect(ChainValidator.isChainValid([genesis, block1, block2], genesis)).toBe(false);
  });

  test('rejects a chain containing a block with an invalid transaction', () => {
    const sender = ec.genKeyPair();
    const recipient = ec.genKeyPair();
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    tx.signTransaction(sender);
    // Tamper the transaction amount after signing
    (tx as any).amount = 9999;

    const block1 = new Block(1, Date.now(), [tx], genesis.hash);
    block1.mineBlock(1);

    expect(ChainValidator.isChainValid([genesis, block1], genesis)).toBe(false);
  });

  test('validateBlock() passes for a valid block', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    expect(ChainValidator.validateBlock(block1, genesis)).toBe(true);
  });

  test('validateBlock() fails if hash is stale after tampering', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    (block1 as any).hash = 'tampered';
    expect(ChainValidator.validateBlock(block1, genesis)).toBe(false);
  });
});
