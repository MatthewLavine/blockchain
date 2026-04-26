/**
 * Global Network Constants for Antigravity Chain
 */
export const NETWORK_CONSTANTS = {
    INITIAL_DIFFICULTY: 4,
    UNITS_PER_COIN: 1000000,
    INITIAL_MINING_REWARD: 100 * 1000000, // 100 AGC in atomic units
    HALVING_INTERVAL: 100,
    MAX_BLOCK_TRANSACTIONS: 1000,
    GENESIS_DATE: "2026-01-01",
    GENESIS_PREVIOUS_HASH: "0",
    calculateMiningReward: (chainLength: number): number => {
        const halvings = Math.floor(chainLength / 100);
        // Using integer math for halving
        return Math.floor((100 * 1000000) / Math.pow(2, halvings));
    }
};
