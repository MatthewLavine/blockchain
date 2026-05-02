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
        try {
            // 1. Verify Genesis Block
            if (chain[0].hash !== genesisBlock.hash) {
                throw new Error("Genesis block hash mismatch");
            }
            if (chain[0].hash !== chain[0].calculateHash()) {
                throw new Error("Genesis block hash is mathematically incorrect");
            }

            // 2. Verify subsequent blocks
            const knownSignatures: Set<string> = new Set();
            const ledger: Map<string, number> = new Map();
            const nonces: Map<string, number> = new Map();
            
            // 2. Process Genesis transactions
            for (const tx of chain[0].transactions) {
                const recipientBalance = ledger.get(tx.toAddress) || 0;
                ledger.set(tx.toAddress, recipientBalance + tx.amount);
                
                if (tx.fromAddress) {
                    const currentNonce = nonces.get(tx.fromAddress) || 0;
                    nonces.set(tx.fromAddress, currentNonce + 1);
                }

                if (tx.signature) knownSignatures.add(tx.signature);
            }

            for (let i = 1; i < chain.length; i++) {
                const currentBlock = chain[i];
                const previousBlock = chain[i - 1];
                const expectedReward = NETWORK_CONSTANTS.calculateMiningReward(currentBlock.index);

                const tempLedger = new Map(ledger);
                const tempNonces = new Map(nonces);

                this.validateBlock(currentBlock, previousBlock, expectedReward, difficulty, tempLedger, tempNonces);

                // Sync the permanent ledger and nonces if block is valid
                tempLedger.forEach((val, key) => ledger.set(key, val));
                tempNonces.forEach((val, key) => nonces.set(key, val));

                // Check for duplicate transactions across blocks
                for (const tx of currentBlock.transactions) {
                    if (tx.signature) {
                        if (knownSignatures.has(tx.signature)) {
                            throw new Error(`Duplicate transaction signature found across blocks: ${tx.signature.substring(0, 10)}...`);
                        }
                        knownSignatures.add(tx.signature);
                    }
                }
            }

            return true;
        } catch (error: any) {
            console.error(`Blockchain validation failed: ${error.message}`);
            return false;
        }
    }

    /**
     * Validates a single block against its predecessor.
     * Throws an Error if validation fails.
     */
    public static validateBlock(block: Block, previousBlock: Block, expectedReward: number, difficulty: number, ledger: Map<string, number>, nonces: Map<string, number>): void {
        // 1. Check if index is sequential
        if (block.index !== previousBlock.index + 1) {
            throw new Error(`Non-sequential block index: Expected ${previousBlock.index + 1} but got ${block.index}`);
        }

        // 1b. Check if block size is within limits
        if (block.transactions.length > NETWORK_CONSTANTS.MAX_BLOCK_TRANSACTIONS) {
            throw new Error(`Block exceeds maximum transaction limit: ${block.transactions.length} > ${NETWORK_CONSTANTS.MAX_BLOCK_TRANSACTIONS}`);
        }

        // 2. Check if the block's hash is mathematically correct
        const calculatedHash = block.calculateHash();
        if (block.hash !== calculatedHash) {
            throw new Error(`Invalid block hash: Block header claims ${block.hash.substring(0, 10)}... but actual hash is ${calculatedHash.substring(0, 10)}...`);
        }

        // 3. Check if Proof of Work is satisfied
        const target = Array(difficulty + 1).join("0");
        if (block.hash.substring(0, difficulty) !== target) {
            throw new Error(`Proof of Work not satisfied: Hash ${block.hash.substring(0, 10)}... does not meet difficulty of ${difficulty}`);
        }

        // 4. Check if it points to the correct previous block
        if (block.previousHash !== previousBlock.hash) {
            throw new Error(`Previous hash mismatch: Block points to ${block.previousHash.substring(0, 10)}... but actual previous hash is ${previousBlock.hash.substring(0, 10)}...`);
        }

        // 5. Verify timestamp bounds
        const TWO_HOURS_MS = 2 * 60 * 60 * 1000;
        const currentTime = Date.now();
        
        if (block.timestamp <= previousBlock.timestamp) {
            throw new Error(`Block timestamp is too early: ${block.timestamp} is not after ${previousBlock.timestamp}`);
        }
        
        if (block.timestamp > currentTime + TWO_HOURS_MS) {
            throw new Error(`Block timestamp is too far in the future: ${block.timestamp} (current limit: ${currentTime + TWO_HOURS_MS})`);
        }

        // 6. Verify all transactions inside the block
        let miningRewardsCount = 0;
        const seenSignatures = new Set<string>();

        for (const tx of block.transactions) {
            if (!tx.isValid()) {
                throw new Error(`Invalid transaction signature or structure found in block: ${tx.signature?.substring(0, 10) || 'N/A'}`);
            }
            
            if (!Number.isInteger(tx.amount)) {
                throw new Error(`Transaction amount must be an integer: ${tx.amount}`);
            }

            // Prevent intra-block replay
            if (tx.signature) {
                if (seenSignatures.has(tx.signature)) {
                    throw new Error(`Duplicate transaction signature within same block: ${tx.signature.substring(0, 10)}...`);
                }
                seenSignatures.add(tx.signature);
            }

            // Count mining rewards (fromAddress === null)
            if (tx.fromAddress === null) {
                miningRewardsCount++;
                
                // Add reward to recipient
                const currentBalance = ledger.get(tx.toAddress) || 0;
                ledger.set(tx.toAddress, currentBalance + tx.amount);
            } else {
                // Regular transaction: Check balance
                const senderBalance = ledger.get(tx.fromAddress) || 0;
                if (senderBalance < tx.amount + tx.fee) {
                    throw new Error(`Insufficient funds for transaction from ${tx.fromAddress.substring(0, 10)}...: Needs ${tx.amount + tx.fee} but has ${senderBalance}`);
                }
                
                // Transfer funds
                ledger.set(tx.fromAddress, senderBalance - tx.amount - tx.fee);
                const recipientBalance = ledger.get(tx.toAddress) || 0;
                ledger.set(tx.toAddress, recipientBalance + tx.amount);

                // Validate and increment nonce
                const currentNonce = nonces.get(tx.fromAddress) || 0;
                if (tx.nonce !== currentNonce) {
                    throw new Error(`Invalid nonce for sender ${tx.fromAddress.substring(0, 10)}...: Expected ${currentNonce} but transaction has ${tx.nonce}`);
                }
                nonces.set(tx.fromAddress, currentNonce + 1);
            }
        }

        // 7. Each block must have EXACTLY one mining reward
        if (miningRewardsCount !== 1) {
            throw new Error(`Invalid number of mining rewards in block: Expected 1, found ${miningRewardsCount}`);
        }

        // 8. Verify reward tx amount = block reward + total fees collected
        const totalFees = block.transactions
            .filter(tx => tx.fromAddress !== null)
            .reduce((sum, tx) => sum + tx.fee, 0);
        const rewardTx = block.transactions.find(tx => tx.fromAddress === null)!;
        if (rewardTx.amount !== expectedReward + totalFees) {
            throw new Error(`Invalid mining reward amount: Expected ${expectedReward + totalFees} (Reward: ${expectedReward}, Fees: ${totalFees}) but block reward is ${rewardTx.amount}`);
        }
    }
}
