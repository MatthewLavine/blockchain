# 🌌 Antigravity Chain
[![CI](https://github.com/MatthewLavine/blockchain/actions/workflows/ci.yml/badge.svg)](https://github.com/MatthewLavine/blockchain/actions/workflows/ci.yml)

Antigravity Chain is a custom-built, cryptographically secure blockchain implementation designed for high reliability and security. It features a decentralized P2P network, a premium React dashboard, and a hardened consensus engine.

> [!NOTE]
> I used Gemini to write this app as an exercise to learn how blockchains work.

## ✨ Core Features

- **🔐 Enterprise-Grade Security**:
    - **Replay Protection**: Prevents re-submitting mined transactions using a high-performance signature index.
    - **PoW Enforcement**: Strictly validates that all blocks meet the network's Proof of Work difficulty.
    - **Collision-Resistant Hashing**: Uses structured data hashing with separators to prevent concatenation attacks.
    - **Timestamp Guard**: Rejects blocks with manipulated timestamps (past or future).
- **🌐 Decentralized P2P Network**:
    - **Longest Chain Rule**: Automatically syncs and adopts the most valid, work-intensive chain from peers.
    - **Optimized Propagation**: Intelligent broadcast routing prevents network loops and minimizes redundant traffic.
    - **Automatic Discovery**: Nodes automatically share peer lists to build a robust mesh network.
- **🏗️ Robust Architecture**:
    - **Atomic Persistence**: Periodically saves state to disk with graceful shutdown handling (`SIGTERM`/`SIGINT`).
    - **DOS Protection**: Implements hard limits on mempool size to prevent memory exhaustion attacks.
    - **Halving Mechanism**: Automated mining reward halving every 100 blocks to control inflation.
- **📟 Premium Dashboard**:
    - **Real-time Explorer**: Interactive ledger with deep-dive transaction inspection.
    - **Wallet Suite**: Integrated ECC key generation and balance tracking.
    - **Glassmorphism UI**: High-density, theme-aware responsive design with professional aesthetics.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript, Elliptic (secp256k1), Crypto (SHA-256).
- **Frontend**: React, Vite, Lucide Icons, Vanilla CSS (Glassmorphism).
- **Infrastructure**: Docker & Docker Compose for multi-node simulation.

## 🚀 Getting Started

### 1. Docker (Recommended)
The easiest way to see the decentralized network in action is using Docker Compose, which spins up 5 nodes and the frontend:

```bash
# Start the network
docker compose up --build

# Open the dashboard
# http://localhost:8080
```

### 2. Manual Installation
If you prefer running a single node locally:

```bash
# Install dependencies
npm install
cd frontend && npm install && cd ..

# Start Backend (Terminal 1)
npm run dev

# Start Frontend (Terminal 2)
cd frontend && npm run dev
```

## 📜 Network Protocol
- **Consensus**: Proof of Work (SHA-256).
- **Initial Difficulty**: 4 (leading zeros).
- **Initial Reward**: 100 AGC.
- **Halving Interval**: 100 Blocks.
- **Signature Algorithm**: ECDSA (secp256k1).
- **P2P Sync**: WebSocket-based mesh.

## 📄 License
This project is for educational purposes. Feel free to use and modify it!
