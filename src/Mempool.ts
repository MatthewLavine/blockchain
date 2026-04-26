import { Transaction } from './Transaction';

/**
 * Manages the pool of pending transactions (Mempool).
 * This will handle future fee-based sorting and size limiting.
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
     * Clears the pool entirely
     */
    public clear(): void {
        this.transactions = [];
    }

    /**
     * Returns the number of transactions in the pool
     */
    public size(): number {
        return this.transactions.length;
    }

    /**
     * Helper for serialization
     */
    public toJSON(): Transaction[] {
        return this.transactions;
    }
}
