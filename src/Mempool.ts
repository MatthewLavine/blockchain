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
     * Clears all transactions from the pool
     */
    public clear(): void {
        this.transactions = [];
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

    /**
     * Returns transactions sorted by fee descending (highest fee first) for priority mining.
     * Optionally limited to a maximum count.
     */
    public getTransactionsByPriority(maxCount?: number): Transaction[] {
        const sorted = [...this.transactions].sort((a, b) => b.fee - a.fee);
        return maxCount ? sorted.slice(0, maxCount) : sorted;
    }

    /**
     * Helper for serialization
     */
    public toJSON(): Transaction[] {
        return this.transactions;
    }
}
