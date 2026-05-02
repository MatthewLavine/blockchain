import { Transaction } from './Transaction';

/**
 * Manages the pool of pending transactions (Mempool).
 * Handles fee-based priority sorting and transaction selection.
 */
export class Mempool {
    private transactions: Transaction[] = [];

    /**
     * Adds a transaction to the pool
     */
    public addTransaction(transaction: Transaction): void {
        this.transactions.push(transaction);
    }

    /**
     * Checks if a transaction is already in the pool
     */
    public containsTransaction(transaction: Transaction): boolean {
        return this.transactions.some(tx => tx.signature === transaction.signature);
    }

    /**
     * Returns all transactions currently in the pool
     */
    public getTransactions(): Transaction[] {
        return [...this.transactions];
    }

    /**
     * Clears the pool and replaces it with new transactions (e.g. after mining)
     */
    public setTransactions(transactions: Transaction[]): void {
        this.transactions = transactions;
    }

    /**
     * Clears all transactions from the pool
     */
    public clear(): void {
        this.transactions = [];
    }

    /**
     * Removes specific transactions from the pool.
     * Useful after mining to only remove the transactions that were included in the block.
     */
    public removeTransactions(transactionsToRemove: Transaction[]): void {
        const signaturesToRemove = new Set(transactionsToRemove.map(tx => tx.signature));
        this.transactions = this.transactions.filter(tx => !signaturesToRemove.has(tx.signature));
    }

    /**
     * Returns the number of transactions in the pool
     */
    public size(): number {
        return this.transactions.length;
    }

    public getTransactionsByPriority(maxCount?: number): Transaction[] {
        if (this.transactions.length === 0) return [];

        // 1. Group transactions by sender and sort each group by nonce
        const senderQueues = new Map<string, Transaction[]>();
        for (const tx of this.transactions) {
            const from = tx.fromAddress || 'unknown';
            if (!senderQueues.has(from)) senderQueues.set(from, []);
            senderQueues.get(from)!.push(tx);
        }

        // Sort each queue by nonce ascending
        for (const queue of senderQueues.values()) {
            queue.sort((a, b) => a.nonce - b.nonce);
        }

        const selectedTransactions: Transaction[] = [];
        const limit = maxCount || Infinity;

        // 2. Selection algorithm:
        // Continually pick the highest-fee transaction that is currently "mineable"
        // (i.e., it's the next nonce for that sender among the remaining transactions).
        while (selectedTransactions.length < limit) {
            let bestTx: Transaction | null = null;
            let bestTxIndex = -1;
            let bestSender = '';

            for (const [sender, queue] of senderQueues.entries()) {
                if (queue.length > 0) {
                    const candidate = queue[0];
                    if (!bestTx || candidate.fee > bestTx.fee) {
                        bestTx = candidate;
                        bestSender = sender;
                    }
                }
            }

            if (!bestTx) break; // No more mineable transactions

            selectedTransactions.push(bestTx);
            senderQueues.get(bestSender)!.shift(); // Remove from queue
            if (senderQueues.get(bestSender)!.length === 0) {
                senderQueues.delete(bestSender);
            }
        }

        return selectedTransactions;
    }

    /**
     * Helper for serialization
     */
    public toJSON(): Transaction[] {
        return this.transactions;
    }
}
