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

    beforeEach(() => {
        antigravity = new Blockchain();
        // Give some initial money via a manual block if needed, 
        // but mining rewards are easier.
        antigravity.minePendingTransactions(myAddress); // Block 1: Miner reward to me
    });

    test('should prevent replay attacks in addBlock', () => {
        const tx = new Transaction(myAddress, otherAddress, 10);
        tx.signTransaction(myKey);
        
        antigravity.createTransaction(tx);
        antigravity.minePendingTransactions(myAddress); // Block 2 includes tx

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
        expect(() => {
            antigravity.addBlock(replayedBlock);
        }).toThrow(/Replay attack detected/);
        
        expect(antigravity.getBalanceOfAddress(myAddress)).toBe(balanceAfterFirst);
    });

    test('should prevent concatenation collisions in hashing', () => {
        // tx1: from="abc", to="def", amount=1, ts=2 -> "abc|def|1|2"
        // tx2: from="ab", to="cdef", amount=1, ts=2 -> "ab|cdef|1|2"
        // With delimiters, these hashes will be different.
        
        const tx1 = new Transaction('abc', 'def', 1);
        tx1.timestamp = 2;
        
        const tx2 = new Transaction('ab', 'cdef', 1);
        tx2.timestamp = 2;
        
        expect(tx1.calculateHash()).not.toBe(tx2.calculateHash());
    });

    test('should sync mempool when a block is added externally', () => {
        const tx = new Transaction(myAddress, otherAddress, 5);
        tx.signTransaction(myKey);
        
        antigravity.createTransaction(tx);
        expect(antigravity.pendingTransactions.length).toBe(1);

        // Simulate a peer mining this transaction first
        const rewardAmount = 100 * 1000000;
        const peerBlock = new Block(
            antigravity.chain.length,
            Date.now(),
            [tx, new Transaction(null, otherAddress, rewardAmount)],
            antigravity.getLatestBlock().hash
        );
        peerBlock.mineBlock(antigravity.difficulty);

        antigravity.addBlock(peerBlock);

        // Transaction should be removed from mempool
        expect(antigravity.pendingTransactions.length).toBe(0);
    });
});
