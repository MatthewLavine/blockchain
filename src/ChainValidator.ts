import { Block } from './Block';

/**
 * Static utility for auditing and validating the blockchain integrity.
 */
export class ChainValidator {
    /**
     * Validates an entire blockchain from start to finish.
     * @param chain The array of blocks to validate.
     * @param genesisBlock The expected genesis block to compare against.
     */
    public static isChainValid(chain: Block[], genesisBlock: Block): boolean {
        // 1. Verify Genesis Block
        if (JSON.stringify(chain[0]) !== JSON.stringify(genesisBlock)) {
            return false;
        }

        // 2. Verify subsequent blocks
        for (let i = 1; i < chain.length; i++) {
            const currentBlock = chain[i];
            const previousBlock = chain[i - 1];

            if (!this.validateBlock(currentBlock, previousBlock)) {
                return false;
            }
        }

        return true;
    }

    /**
     * Validates a single block against its predecessor.
     */
    public static validateBlock(block: Block, previousBlock: Block): boolean {
        // 1. Check if the block's hash is mathematically correct
        if (block.hash !== block.calculateHash()) {
            return false;
        }

        // 2. Check if it points to the correct previous block
        if (block.previousHash !== previousBlock.hash) {
            return false;
        }

        // 3. Verify all transactions inside the block
        for (const tx of block.transactions) {
            if (!tx.isValid()) {
                return false;
            }
        }

        return true;
    }
}
