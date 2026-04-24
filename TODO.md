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

## Phase 4: Wallets & Security (Digital Signatures)
- [ ] Generate Public and Private key pairs (using Elliptic Curve Cryptography like RSA or secp256k1).
- [ ] Sign transactions with a private key.
- [ ] Verify transaction signatures before adding them to a block.

## Phase 5: Networking (The Decentralized Part) - *Optional Advanced Step*
- [ ] Build a simple HTTP API (e.g., using Express.js) to interact with our node.
- [ ] Connect multiple nodes together (P2P).
- [ ] Implement a consensus algorithm to resolve conflicts when nodes disagree on the chain.
