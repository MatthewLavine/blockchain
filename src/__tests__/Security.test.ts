import { Blockchain } from '../Blockchain';
import { Transaction } from '../Transaction';
import { Block } from '../Block';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');
const myKey = ec.genKeyPair();
const myAddress = myKey.getPublic('hex');
const otherAddress = ec.genKeyPair().getPublic('hex');

describe('Blockchain Security', () => {
    let antigravity: Blockchain;

    beforeEach(async () => {
        antigravity = new Blockchain();
        await antigravity.setStoragePath(`test_security_${Math.random().toString(36).substring(7)}`);
        // Give some initial money via a manual block if needed, 
        // but mining rewards are easier.
        await antigravity.minePendingTransactions(myAddress); // Block 1: Miner reward to me
    });

    afterEach(async () => {
        await antigravity.shutdown();
    });

    test('should prevent replay attacks in addBlock', async () => {
        const tx = new Transaction(myAddress, otherAddress, 10, 0, 1000);
        tx.signTransaction(myKey);
        
        await antigravity.createTransaction(tx);
        await antigravity.minePendingTransactions(myAddress); // Block 2 includes tx

        const balanceAfterFirst = antigravity.getBalanceOfAddress(myAddress);

        // Attempt to replay the SAME transaction in a new block
        const replayedBlock = {
            index: 3,
            timestamp: Date.now(),
            transactions: [tx],
            previousHash: antigravity.getLatestBlock().hash,
            nonce: 0
        };
        
        // This should throw because the signature is already in knownSignatures
        await expect(async () => {
            await antigravity.addBlock(replayedBlock);
        }).rejects.toThrow(/Replay attack detected/);
        
        expect(antigravity.getBalanceOfAddress(myAddress)).toBe(balanceAfterFirst);
    });

    test('should prevent intra-block replay attacks (duplicate tx in same block)', async () => {
        const tx = new Transaction(myAddress, otherAddress, 10, 0, 1000);
        tx.signTransaction(myKey);
        
        // Block contains the SAME transaction twice
        const maliciousBlock = new Block(
            antigravity.chain.length,
            Date.now(),
            [tx, tx, new Transaction(null, myAddress, 100 * 1000000, 0, 0)],
            antigravity.getLatestBlock().hash
        );
        maliciousBlock.mineBlock(antigravity.difficulty);
        
        await expect(async () => {
            await antigravity.addBlock(maliciousBlock);
        }).rejects.toThrow(/Replay attack detected/);
        
        // Ensure balance was NOT deducted (block should be rejected entirely)
        expect(antigravity.getBalanceOfAddress(otherAddress)).toBe(0);
    });

    test('should prevent concatenation collisions in hashing', () => {
        // tx1: from="abc", to="def", amount=1, ts=2 -> "abc|def|1|2"
        // tx2: from="ab", to="cdef", amount=1, ts=2 -> "ab|cdef|1|2"
        // With delimiters, these hashes will be different.
        
        const tx1 = new Transaction('abc', 'def', 1, 0, 1000);
        tx1.timestamp = 2;
        
        const tx2 = new Transaction('ab', 'cdef', 1, 0, 1000);
        tx2.timestamp = 2;
        
        expect(tx1.calculateHash()).not.toBe(tx2.calculateHash());
    });

    test('should sync mempool when a block is added externally', async () => {
        const tx = new Transaction(myAddress, otherAddress, 5, 0, 1000);
        tx.signTransaction(myKey);
        
        await antigravity.createTransaction(tx);
        expect(antigravity.pendingTransactions.length).toBe(1);

        // Simulate a peer mining this transaction first
        // Reward = base reward + fee from tx
        const rewardAmount = 100 * 1000000 + 1000;
        const peerBlock = new Block(
            antigravity.chain.length,
            Date.now(),
            [tx, new Transaction(null, otherAddress, rewardAmount, 0, 0)],
            antigravity.getLatestBlock().hash
        );
        peerBlock.mineBlock(antigravity.difficulty);

        await antigravity.addBlock(peerBlock);

        // Transaction should be removed from mempool
        expect(antigravity.pendingTransactions.length).toBe(0);
    });
});
