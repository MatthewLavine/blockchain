import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ec as EC } from 'elliptic';
import SHA256 from 'crypto-js/sha256';

const ec = new EC('secp256k1');
const API_BASE = 'http://localhost:3000';

export interface Transaction {
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  signature: string;
}

export interface Block {
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
      const [blocksRes, balanceRes] = await Promise.all([
        axios.get(`${API_BASE}/blocks`),
        axios.get(`${API_BASE}/balance/${walletAddress}`)
      ]);
      setBlocks(blocksRes.data.reverse());
      setBalance(balanceRes.data.balance);
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
    if (!keyPair || !recipient || !amount) return;
    try {
      const tx = { fromAddress: walletAddress, toAddress: recipient, amount };
      const hash = SHA256(tx.fromAddress + tx.toAddress + tx.amount).toString();
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

  return {
    walletAddress,
    balance,
    blocks,
    isLoading,
    isMining,
    error,
    success,
    fetchData,
    sendTransaction,
    mineBlock
  };
}
