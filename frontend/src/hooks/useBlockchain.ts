import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ec as EC } from 'elliptic';
import SHA256 from 'crypto-js/sha256';

const ec = new EC('secp256k1');
const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:3000';
const UNITS_PER_COIN = 1000000;

export interface Transaction {
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  timestamp: number;
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
      if (!silent) setError('Failed to connect to the blockchain node.');
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
      const timestamp = Date.now();
      // Convert user input (AGC) to atomic units for the backend
      const atomicAmount = Math.round(amount * UNITS_PER_COIN);
      const tx = { fromAddress: walletAddress, toAddress: recipient, amount: atomicAmount, timestamp };
      
      const hash = SHA256(tx.fromAddress + tx.toAddress + tx.amount + tx.timestamp).toString();
      const signature = keyPair.sign(hash).toDER('hex');

      await axios.post(`${API_BASE}/transaction`, { ...tx, signature });
      setSuccess('Transaction submitted to the pending pool!');
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
      return true;
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit transaction.');
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
      setError('Mining failed.');
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
      setError('Failed to add peer.');
    }
  };

  const resetChain = async () => {
    setIsLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/reset`, {
        method: 'POST',
      });
      const data = await response.json();
      setSuccess(data.message);
      await fetchData();
    } catch (err) {
      setError('Failed to reset blockchain.');
    } finally {
      setIsLoading(false);
      setTimeout(() => setSuccess(''), 3000);
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
