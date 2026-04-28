import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ec as EC } from 'elliptic';
import SHA256 from 'crypto-js/sha256';

const ec = new EC('secp256k1');
const API_BASE = (import.meta.env.VITE_API_BASE || 'http://localhost:7000').replace(/\/$/, '');
const UNITS_PER_COIN = 1000000;

export interface Transaction {
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  timestamp: number;
  nonce: number;
  signature: string;
}

export interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
}

export function useBlockchain() {
  // Wallet State
  const [keyPair, setKeyPair] = useState<any>(null);
  const [walletAddress, setWalletAddress] = useState('');
  const [balance, setBalance] = useState(0);

  // Blockchain State
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [peers, setPeers] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isMining, setIsMining] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Helper for consistent error handling (including rate limits)
  const handleApiError = useCallback((err: any, fallback: string) => {
    if (err.response?.status === 429) {
      return err.response.data?.error || 'Too many requests. Please slow down.';
    }
    return err.response?.data?.error || err.response?.data?.message || fallback;
  }, []);

  // Initialize Wallet
  useEffect(() => {
    const key = ec.genKeyPair();
    setKeyPair(key);
    setWalletAddress(key.getPublic('hex'));
  }, []);

  const fetchData = useCallback(async (silent = false) => {
    if (!walletAddress) return;
    const startTime = Date.now();
    if (!silent) setIsLoading(true);

    try {
      const [blocksRes, balanceRes, pendingRes, peersRes] = await Promise.all([
        axios.get(`${API_BASE}/blocks`),
        axios.get(`${API_BASE}/balance/${walletAddress}`),
        axios.get(`${API_BASE}/pending`),
        axios.get(`${API_BASE}/peers`)
      ]);

      // Convert atomic units back to AGC for display
      const hydratedBlocks = blocksRes.data.map((block: Block) => ({
        ...block,
        transactions: block.transactions.map(tx => ({
          ...tx,
          amount: tx.amount / UNITS_PER_COIN
        }))
      }));

      setBlocks(hydratedBlocks.reverse());
      setBalance(balanceRes.data.balance / UNITS_PER_COIN);
      setPendingTransactions(pendingRes.data.map((tx: Transaction) => ({
        ...tx,
        amount: tx.amount / UNITS_PER_COIN
      })));

      setPeers(peersRes.data);
      setError('');
    } catch (err) {
      if (!silent) setError(handleApiError(err, 'Failed to connect to the blockchain node.'));
    } finally {
      if (!silent) {
        const elapsedTime = Date.now() - startTime;
        const waitTime = Math.max(0, 600 - elapsedTime);
        setTimeout(() => setIsLoading(false), waitTime);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 3000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const sendTransaction = async (recipient: string, amount: number) => {
    if (!keyPair || !recipient || !amount) return false;
    try {
      // 1. Fetch the next expected nonce for this account
      const nonceRes = await axios.get(`${API_BASE}/nonce/${walletAddress}`);
      const nonce = nonceRes.data.nextNonce;

      const timestamp = Date.now();
      // Convert user input (AGC) to atomic units for the backend
      const atomicAmount = Math.round(amount * UNITS_PER_COIN);
      const tx = { fromAddress: walletAddress, toAddress: recipient, amount: atomicAmount, timestamp, nonce };

      // 2. Hash the transaction (including the nonce)
      const hash = SHA256(`${tx.fromAddress}|${tx.toAddress}|${tx.amount}|${tx.timestamp}|${tx.nonce}`).toString();

      // 3. Sign the hash
      const signature = keyPair.sign(hash, 'hex').toDER('hex');

      await axios.post(`${API_BASE}/transaction`, { ...tx, signature });
      setSuccess('Transaction submitted to the pending pool!');
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
      return true;
    } catch (err: any) {
      setError(handleApiError(err, 'Failed to submit transaction.'));
      setTimeout(() => setError(''), 5000);
      return false;
    }
  };

  const mineBlock = async () => {
    setIsMining(true);
    try {
      await axios.post(`${API_BASE}/mine`, { rewardAddress: walletAddress });
      setSuccess('Block successfully mined! You received a reward.');
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(handleApiError(err, 'Mining failed.'));
      setTimeout(() => setError(''), 5000);
    } finally {
      setIsMining(false);
    }
  };

  const addPeer = async (peerUrl: string) => {
    try {
      await axios.post(`${API_BASE}/addPeer`, { peer: peerUrl });
      setSuccess('Peer connection attempted.');
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(handleApiError(err, 'Failed to add peer.'));
      setTimeout(() => setError(''), 5000);
    }
  };

  const resetChain = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await axios.post(`${API_BASE}/reset`);
      setSuccess(response.data.message);
      await fetchData();
    } catch (err: any) {
      setError(handleApiError(err, 'Failed to reset blockchain.'));
    } finally {
      setIsLoading(false);
      setTimeout(() => {
        setSuccess('');
        setError('');
      }, 5000);
    }
  };

  return {
    walletAddress,
    balance,
    blocks,
    pendingTransactions,
    peers,
    isLoading,
    isMining,
    error,
    success,
    fetchData,
    sendTransaction,
    mineBlock,
    addPeer,
    resetChain
  };
}
