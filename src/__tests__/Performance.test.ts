import { Blockchain } from '../Blockchain';
import { Transaction } from '../Transaction';
import { performance } from 'perf_hooks';

describe('Blockchain Performance Benchmark', () => {
  let chain: Blockchain;

  let mockTime = 1800000000000;

  beforeEach(() => {
    chain = new Blockchain();
    chain.difficulty = 0;
    mockTime = 1800000000000;
    jest.spyOn(Date, 'now').mockImplementation(() => mockTime++);
    // Mock signature verification to focus on scanning performance
    jest.spyOn(Transaction.prototype, 'isValid').mockReturnValue(true);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  const buildChain = (numBlocks: number, txsPerBlock: number) => {
    const address = 'alice';
    const recipient = 'bob';
    const start = performance.now();

    // Initial fund
    chain.minePendingTransactions(address);

    for (let i = 0; i < numBlocks; i++) {
      for (let j = 0; j < txsPerBlock; j++) {
        // Mock transaction that doesn't need signing
        const tx = new Transaction(address, recipient, 1, 0, 1000);
        (chain as any).pendingTransactions.push(tx);
      }
      chain.minePendingTransactions(address);
    }
    return performance.now() - start;
  };

  test('Benchmark getLedger() and isChainValid() performance', () => {
    const sizes = [10, 100, 1000, 10000, 100000];
    const txsPerBlock = 10;

    process.stdout.write('\n--- Comprehensive Performance Benchmark (Crypto Mocked) ---\n');
    process.stdout.write(`(Simulating ${txsPerBlock} transactions per block)\n\n`);
    process.stdout.write('Blocks | Total Txs | Build Time | getLedger() | isChainValid()\n');
    process.stdout.write('-------|-----------|------------|-------------|---------------\n');

    for (const size of sizes) {
      chain = new Blockchain();
      chain.difficulty = 0;
      const buildTime = buildChain(size, txsPerBlock);

      const startLedger = performance.now();
      (chain as any).getLedger();
      const endLedger = performance.now();

      const startValid = performance.now();
      const isValid = chain.isChainValid(0);
      const endValid = performance.now();

      expect(isValid).toBe(true);

      const totalTxs = size * (txsPerBlock + 1);
      process.stdout.write(
        `${size.toString().padStart(6)} | ` +
        `${totalTxs.toString().padStart(9)} | ` +
        `${buildTime.toFixed(2).padStart(8)}ms | ` +
        `${(endLedger - startLedger).toFixed(2).padStart(9)}ms | ` +
        `${(endValid - startValid).toFixed(2).padStart(11)}ms\n`
      );
    }
    process.stdout.write('--------------------------------------------------------------\n\n');
  }, 300000);
});
