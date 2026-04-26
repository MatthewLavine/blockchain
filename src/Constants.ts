/**
 * Global Network Constants for Antigravity Chain
 */
export const NETWORK_CONSTANTS = {
    INITIAL_DIFFICULTY: 4,
    INITIAL_MINING_REWARD: 100,
    HALVING_INTERVAL: 100,
    GENESIS_DATE: "2026-01-01",
    GENESIS_PREVIOUS_HASH: "0",
    calculateMiningReward: (chainLength: number): number => {
        const halvings = Math.floor(chainLength / 100); // 100 is HALVING_INTERVAL
        return 100 / Math.pow(2, halvings); // 100 is INITIAL_MINING_REWARD
    }
};
