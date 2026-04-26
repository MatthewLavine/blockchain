import { Block } from './Block';
import { NETWORK_CONSTANTS } from './Constants';

/**
 * Static utility for auditing and validating the blockchain integrity.
 */
export class ChainValidator {
    /**
     * Validates an entire blockchain from start to finish.
     * @param chain The array of blocks to validate.
     * @param genesisBlock The expected genesis block to compare against.
     * @param difficulty The expected Proof of Work difficulty.
     */
    public static isChainValid(chain: Block[], genesisBlock: Block, difficulty: number = NETWORK_CONSTANTS.INITIAL_DIFFICULTY): boolean {
        // 1. Verify Genesis Block (comparing hash is more reliable than JSON stringify)
        if (chain[0].hash !== genesisBlock.hash || chain[0].hash !== chain[0].calculateHash()) {
            return false;
        }

        // 2. Verify subsequent blocks
        const knownSignatures: Set<string> = new Set();
        const ledger: Map<string, number> = new Map();
        
        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const previousBlock = chain[i - 1];

            // The reward for THIS block is determined by its index
            const expectedReward = NETWORK_CONSTANTS.calculateMiningReward(currentBlock.index);

            if (!this.validateBlock(currentBlock, previousBlock, expectedReward, difficulty, ledger)) {
                return false;
            }

            // Check for duplicate transactions across blocks
            for (const tx of currentBlock.transactions) {
                if (tx.signature) {
                    if (knownSignatures.has(tx.signature)) {
                        return false; // Duplicate transaction signature found in different blocks!
                    }
                    knownSignatures.add(tx.signature);
                }
            }
        }

        return true;
    }

    /**
     * Validates a single block against its predecessor.
     */
    public static validateBlock(block: Block, previousBlock: Block, expectedReward: number, difficulty: number, ledger: Map<string, number>): boolean {
        // 1. Check if index is sequential
        if (block.index !== previousBlock.index + 1) {
            return false;
        }

        // 1b. Check if block size is within limits
        if (block.transactions.length > NETWORK_CONSTANTS.MAX_BLOCK_TRANSACTIONS) {
            return false;
        }

        // 2. Check if the block's hash is mathematically correct
        if (block.hash !== block.calculateHash()) {
            return false;
        }

        // 3. Check if Proof of Work is satisfied (starts with 'difficulty' zeros)
        const target = Array(difficulty + 1).join("0");
        if (block.hash.substring(0, difficulty) !== target) {
            return false;
        }

        // 4. Check if it points to the correct previous block
        if (block.previousHash !== previousBlock.hash) {
            return false;
        }

        // 5. Verify timestamp bounds
        // - Block time must be after previous block time
        // - Block time must not be more than 2 hours in the future
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        const currentTime = Date.now();
        
        if (block.timestamp <= previousBlock.timestamp) {
            return false;
        }
        
        if (block.timestamp > currentTime + TWO_HOURS_MS) {
            return false;
        }

        // 3. Verify all transactions inside the block
        let miningRewards = 0;
        for (const tx of block.transactions) {
            if (!tx.isValid() || !Number.isInteger(tx.amount)) {
                return false;
            }

            // Count mining rewards (fromAddress === null)
            if (tx.fromAddress === null) {
                miningRewards++;
                // Verify reward amount
                if (tx.amount !== expectedReward) {
                    return false;
                }
                
                // Add reward to recipient
                const currentBalance = ledger.get(tx.toAddress) || 0;
                ledger.set(tx.toAddress, currentBalance + tx.amount);
            } else {
                // Regular transaction: Check balance
                const senderBalance = ledger.get(tx.fromAddress) || 0;
                if (senderBalance < tx.amount) {
                    return false; // Sender has insufficient funds!
                }
                
                // Transfer funds
                ledger.set(tx.fromAddress, senderBalance - tx.amount);
                const recipientBalance = ledger.get(tx.toAddress) || 0;
                ledger.set(tx.toAddress, recipientBalance + tx.amount);
            }
        }

        // 4. Each block must have EXACTLY one mining reward
        if (miningRewards !== 1) {
            return false;
        }

        return true;
    }
}
