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

function mineBlock(index: number, txs: Transaction[], previousHash: string, timestamp?: number): Block {
  // Every block MUST have a mining reward now
  const reward = NETWORK_CONSTANTS.calculateMiningReward(index - 1);
  const rewardTx = new Transaction(null, 'miner', reward);
  const block = new Block(index, timestamp || Date.now(), [...txs, rewardTx], previousHash);
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
    const block1 = mineBlock(1, [], genesis.hash, Date.now() + 100);
    const block2 = mineBlock(2, [], block1.hash, Date.now() + 200);
    expect(ChainValidator.isChainValid([genesis, block1, block2], genesis, 1)).toBe(true);
  });

  test('rejects a chain with a tampered genesis block', () => {
    const fakeGenesis = makeGenesisBlock();
    (fakeGenesis as any).timestamp = 9999999999999;
    expect(ChainValidator.isChainValid([fakeGenesis], genesis, 1)).toBe(false);
  });

  test('rejects a chain where a block hash has been tampered', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    // Tamper the stored hash directly
    (block1 as any).hash = 'deadbeef';
    expect(ChainValidator.isChainValid([genesis, block1], genesis, 1)).toBe(false);
  });

  test('rejects a chain where a block previousHash link is broken', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    const block2 = mineBlock(2, [], 'wrong-previous-hash');
    expect(ChainValidator.isChainValid([genesis, block1, block2], genesis, 1)).toBe(false);
  });

  test('rejects a chain containing a block with an invalid transaction', () => {
    const sender = ec.genKeyPair();
    const recipient = ec.genKeyPair();
    const tx = new Transaction(sender.getPublic('hex'), recipient.getPublic('hex'), 50);
    tx.signTransaction(sender);
    // Tamper the transaction amount after signing
    (tx as any).amount = 9999;

    const rewardTx = new Transaction(null, 'miner', 100);
    const block1 = new Block(1, Date.now(), [tx, rewardTx], genesis.hash);
    block1.mineBlock(1);

    expect(ChainValidator.isChainValid([genesis, block1], genesis, 1)).toBe(false);
  });

  test('validateBlock() passes for a valid block', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    expect(ChainValidator.validateBlock(block1, genesis, 100, 1)).toBe(true);
  });

  test('validateBlock() fails if hash is stale after tampering', () => {
    const block1 = mineBlock(1, [], genesis.hash);
    (block1 as any).hash = 'tampered';
    expect(ChainValidator.validateBlock(block1, genesis, 100, 1)).toBe(false);
  });

  test('validateBlock() fails if mining reward is missing', () => {
    const block1 = new Block(1, Date.now(), [], genesis.hash);
    block1.mineBlock(1);
    expect(ChainValidator.validateBlock(block1, genesis, 100, 1)).toBe(false);
  });

  test('validateBlock() fails if multiple mining rewards are present', () => {
    const tx1 = new Transaction(null, 'miner', 100);
    const tx2 = new Transaction(null, 'miner', 100);
    const block1 = new Block(1, Date.now(), [tx1, tx2], genesis.hash);
    block1.mineBlock(1);
    expect(ChainValidator.validateBlock(block1, genesis, 100, 1)).toBe(false);
  });

  test('validateBlock() fails if mining reward amount is incorrect', () => {
    const tx = new Transaction(null, 'miner', 500); // Should be 100
    const block1 = new Block(1, Date.now(), [tx], genesis.hash);
    block1.mineBlock(1);
    expect(ChainValidator.validateBlock(block1, genesis, 100, 1)).toBe(false);
  });
});
