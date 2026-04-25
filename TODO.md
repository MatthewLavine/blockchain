# Blockchain Implementation Roadmap

## Phase 1: The Core Data Structures (Completed)
- [x] Create the `Block` class (Timestamp, Data, Previous Hash, Hash).
- [x] Create the `Blockchain` class to manage the chain.
- [x] Implement the "Genesis Block" (the very first block).
- [x] Build the hashing mechanism (SHA-256) to secure the blocks.
- [x] Implement checking the integrity/validity of the chain.

## Phase 2: Proof of Work (Mining) (Completed)
- [x] Implement a "Proof of Work" algorithm.
- [x] Introduce a `difficulty` level to the blockchain.
- [x] Modify block creation so it requires "mining" (finding a hash that starts with a certain number of zeros).

## Phase 3: Transactions & Rewards (Completed)
- [x] Create a `Transaction` class (Sender, Recipient, Amount).
- [x] Manage a pool of pending transactions.
- [x] Introduce mining rewards (giving coins to the node that mines the block).
- [x] Calculate a user's wallet balance by iterating through the blockchain history.

## Phase 4: Wallets & Security (Digital Signatures) (Completed)
- [x] Generate Public and Private key pairs (using Elliptic Curve Cryptography like RSA or secp256k1).
- [x] Sign transactions with a private key.
- [x] Verify transaction signatures before adding them to a block.

## Phase 5: Polishing the Core Logic (Completed)
- [x] Prevent negative balances (ensure sender has enough funds before accepting a transaction).
- [x] Ensure mining rewards don't artificially inflate the system too easily (e.g., halving the reward over time, or hardcoding max supply).
- [x] Add basic transaction validation (e.g., amount must be > 0).

## Phase 6: Networking & HTTP API (The Decentralized Part) (Completed)
- [x] Initialize an Express.js server to run our node.
- [x] Create `GET /blocks` endpoint to view the blockchain.
- [x] Create `POST /transaction` endpoint to submit a new signed transaction.
- [x] Create `GET /mine` endpoint to trigger the mining process.
- [x] Implement Peer-to-Peer (P2P) synchronization via WebSockets.
- [x] Implement the "Longest Chain Rule" for decentralized consensus.

## Phase 7: Visual Web Interface (Front-end Dashboard) (Completed)
- [x] Initialize a new modern React + Vite application.
- [x] Create a "Blockchain Explorer" view to render the blocks and their hashes.
- [x] Create a "Wallet" interface to display balance and public key.
- [x] Create a "Send Transaction" form that handles cryptographic signing in the browser.
- [x] Implement beautiful, premium aesthetics with dark mode and micro-animations.
- [x] Add interactive detail modals for blocks and transactions.

## Phase 8: Advanced Networking (Gossip & Orchestration) (Completed)
- [x] Implement a **Gossip Protocol** for automatic peer discovery.
- [x] Add self-announcement and socket deduplication for a clean network mesh.
- [x] Build a "Network Map" UI to visualize connected peers.
- [x] Create automation scripts (`.ps1` and `.sh`) to launch multi-node local networks.
- [x] Implement a "Seed Node" mechanism for self-healing connections.

## Phase 9: Persistence (Database) (Completed)
- [x] Implement a storage layer to save the blockchain to disk (port-specific JSON files).
- [x] Load and cryptographically verify the existing chain from disk on startup.
- [x] Ensure the P2P layer handles disk-loaded chains correctly during sync.
- [x] Implement **Global Reset Propagation** to synchronize state purges across the network.

## Phase 10: Code Refactoring & Type Safety (Current)
- [x] **Unified Serialization**: Implement static `.fromJSON()` factories for `Block` and `Transaction` classes.
- [ ] **P2P Message Handlers**: Decompose the massive `handleMessage` switch into discrete, named handler methods.
- [ ] **Type Enforcement**: Define TypeScript interfaces for all P2P message payloads (removing `any`).
- [ ] **Context-Aware Logger**: Create a utility to prefix logs with node identity (e.g. `[Node 3000]`).

## Phase 11: Network Evolution
- [ ] **Dynamic Difficulty**: Adjust mining difficulty based on block time (The "Bitcoin" Update).
- [ ] **Transaction Fees**: Implement priority fees for transactions in the mempool.
- [ ] **Chain Visualization**: Add a visual "Graph" view to the Network Map showing connections between nodes.
