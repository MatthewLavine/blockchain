# 🌌 Antigravity Chain

Antigravity Chain is a custom-built, cryptographically secure blockchain implementation with a premium, multi-panel React dashboard. It features a full peer-to-peer transaction model, mining rewards with halving mechanisms, and an interactive block explorer.

## ✨ Features

- **🔐 Cryptographically Secure**: Uses Elliptic Curve Cryptography (ECC) for transaction signing and SHA-256 for block hashing.
- **🏗️ Modular Architecture**: Clean separation between the blockchain logic (TypeScript backend) and the dashboard (React/Vite frontend).
- **📟 Dashboard UI**: A high-density, 3-column responsive layout with:
    - **Wallet Management**: Public address generation and balance tracking.
    - **Interactive Ledger**: Click any block to see detailed transaction history.
    - **Mempool**: Real-time view of pending transactions.
    - **Mining Controls**: Manual mining triggers with reward tracking.
- **🌗 Theme-Aware**: Fully integrated Dark and Light modes with premium glassmorphism aesthetics.
- **🔄 Live Updates**: Polling system ensures the dashboard reflects the latest state of the chain.

## 🛠️ Technology Stack

- **Backend**: Node.js, Express, TypeScript, Elliptic (ECC), Crypto-JS (SHA-256).
- **Frontend**: React, Vite, Lucide Icons, Vanilla CSS (Glassmorphism).
- **Dev Tools**: ts-node-dev (for auto-restarting backend).

## 🚀 Getting Started

### 1. Prerequisites
- Node.js (v16+)
- npm or yarn

### 2. Installation
Clone the repository and install dependencies in both the root and frontend directories:

```bash
# Install root (backend) dependencies
npm install

# Install frontend dependencies
cd frontend
npm install
```

### 3. Running the Project
You will need two terminal windows open:

**Terminal 1: Backend Server**
```bash
npm run dev
```

**Terminal 2: Frontend Dashboard**
```bash
cd frontend
npm run dev
```

The dashboard will be available at `http://localhost:5173`.

## 📜 Blockchain Rules
- **Genesis Block**: The chain starts with a special hardcoded block.
- **Mining Rewards**: Miners receive coins for securing the network.
- **Halving**: The mining reward is cut in half every **100 blocks**.
- **Difficulty**: The proof-of-work difficulty is currently set to 4 (leading zeros).

## 📄 License
This project is for educational purposes. Feel free to use and modify it!
