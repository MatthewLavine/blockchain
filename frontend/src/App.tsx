import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { ec as EC } from 'elliptic';
import SHA256 from 'crypto-js/sha256';
import { 
  Shield, 
  Wallet, 
  Database, 
  Cpu, 
  Send, 
  RefreshCcw, 
  History,
  AlertCircle,
  CheckCircle2,
  Lock
} from 'lucide-react';

const ec = new EC('secp256k1');
const API_BASE = 'http://localhost:3000';

interface Transaction {
  fromAddress: string | null;
  toAddress: string;
  amount: number;
  signature: string;
}

interface Block {
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
}

function App() {
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

  // Form State
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  // 1. Initialize Wallet
  useEffect(() => {
    const key = ec.genKeyPair();
    setKeyPair(key);
    setWalletAddress(key.getPublic('hex'));
  }, []);

  // 2. Fetch Data
  const fetchData = useCallback(async (silent = false) => {
    if (!walletAddress) return;
    
    const startTime = Date.now();
    if (!silent) setIsLoading(true);
    
    try {
      const [blocksRes, balanceRes] = await Promise.all([
        axios.get(`${API_BASE}/blocks`),
        axios.get(`${API_BASE}/balance/${walletAddress}`)
      ]);
      setBlocks(blocksRes.data.reverse()); // Show newest blocks first
      setBalance(balanceRes.data.balance);
      setError('');
    } catch (err) {
      if (!silent) setError('Failed to connect to the blockchain node.');
    } finally {
      // If not silent, ensure the loading animation is visible for at least 600ms
      if (!silent) {
        const elapsedTime = Date.now() - startTime;
        const waitTime = Math.max(0, 600 - elapsedTime);
        setTimeout(() => setIsLoading(false), waitTime);
      }
    }
  }, [walletAddress]);

  useEffect(() => {
    fetchData(); // Initial load (not silent)

    // Set up polling every 3 seconds to keep tabs in sync
    const interval = setInterval(() => {
      fetchData(true); // Silent update
    }, 3000);

    return () => clearInterval(interval);
  }, [fetchData]);

  // 3. Handle Send Transaction
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyPair || !recipient || !amount) return;

    try {
      const tx = {
        fromAddress: walletAddress,
        toAddress: recipient,
        amount: parseFloat(amount)
      };

      // Cryptographic Signing (Matches the backend's calculateHash logic)
      const hash = SHA256(tx.fromAddress + tx.toAddress + tx.amount).toString();
      const signature = keyPair.sign(hash).toDER('hex');

      await axios.post(`${API_BASE}/transaction`, {
        ...tx,
        signature
      });

      setSuccess('Transaction submitted to the pending pool!');
      setRecipient('');
      setAmount('');
      fetchData();
      setTimeout(() => setSuccess(''), 5000);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to submit transaction.');
      setTimeout(() => setError(''), 5000);
    }
  };

  // 4. Handle Mining
  const handleMine = async () => {
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

  return (
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      {/* Header */}
      <header style={{ marginBottom: '40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="gradient-text" style={{ fontSize: '2.5rem', fontWeight: 700 }}>Antigravity Chain</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Secure, Transparent, Decentralized.</p>
        </div>
        <button onClick={fetchData} className="glass-card" style={{ padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}>
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Notifications */}
      {error && (
        <div className="glass-card" style={{ marginBottom: '20px', border: '1px solid #ef444455', color: '#f87171', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ marginBottom: '20px', border: '1px solid #10b98155', color: '#34d399', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CheckCircle2 size={20} />
          <p>{success}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        {/* Left Column: Wallet & Actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          {/* Wallet Card */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
                <Wallet size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>My Wallet</h2>
            </div>
            
            <div style={{ marginBottom: '20px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginBottom: '8px' }}>Public Address</label>
              <div className="glass-card" style={{ padding: '12px', fontSize: '0.75rem', overflowWrap: 'anywhere', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--glass-border)' }}>
                {walletAddress || 'Generating...'}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
              <div>
                <label style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', display: 'block', marginBottom: '4px' }}>Balance</label>
                <div style={{ fontSize: '2rem', fontWeight: 600 }}>{balance} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>AGC</span></div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-success)', fontSize: '0.875rem' }}>
                <Shield size={16} />
                <span>Verified</span>
              </div>
            </div>
          </div>

          {/* Send Transaction */}
          <div className="glass-card">
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
              <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', color: 'var(--accent-secondary)' }}>
                <Send size={24} />
              </div>
              <h2 style={{ fontSize: '1.25rem' }}>Send Coins</h2>
            </div>

            <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <div>
                <input 
                  type="text" 
                  placeholder="Recipient Address" 
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                />
              </div>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  placeholder="Amount" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'white', outline: 'none' }}
                />
                <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>AGC</span>
              </div>
              <button type="submit" className="btn-primary" disabled={isLoading}>
                Sign & Send Transaction
              </button>
            </form>
          </div>

          {/* Mine Button */}
          <button 
            onClick={handleMine} 
            disabled={isMining}
            className="glass-card" 
            style={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              gap: '15px', 
              cursor: isMining ? 'default' : 'pointer',
              borderColor: isMining ? 'var(--accent-primary)' : 'var(--glass-border)',
              animation: isMining ? 'pulse 2s infinite' : 'none'
            }}
          >
            <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--accent-success)' }}>
              <Cpu size={32} className={isMining ? 'animate-spin' : ''} />
            </div>
            <div style={{ textAlign: 'center' }}>
              <h3 style={{ marginBottom: '4px' }}>{isMining ? 'Mining in progress...' : 'Start Mining'}</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Solve the next block and earn 100 AGC reward</p>
            </div>
          </button>
        </section>

        {/* Right Column: Block Explorer */}
        <section className="glass-card" style={{ maxHeight: '1000px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <Database size={24} />
            </div>
            <h2 style={{ fontSize: '1.25rem' }}>Blockchain Explorer</h2>
          </div>

          <div style={{ overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {blocks.map((block, index) => (
              <div key={block.hash} className="glass-card" style={{ background: 'rgba(0,0,0,0.15)', padding: '20px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>Block #{blocks.length - index - 1}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                      <History size={14} style={{ color: 'var(--text-secondary)' }} />
                      <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(block.timestamp).toLocaleString()}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transactions</div>
                    <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{block.transactions.length}</div>
                  </div>
                </div>

                <div style={{ marginBottom: '12px' }}>
                  <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Hash</label>
                  <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{block.hash}</div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.75rem', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
                  <Lock size={12} />
                  <span>Nonce: {block.nonce}</span>
                  <span style={{ marginLeft: 'auto', color: 'var(--accent-success)' }}>Validated</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0.4); }
          70% { box-shadow: 0 0 0 15px rgba(99, 102, 241, 0); }
          100% { box-shadow: 0 0 0 0 rgba(99, 102, 241, 0); }
        }
        .animate-spin {
          animation: spin 1.5s linear infinite;
        }
      `}} />
    </div>
  );
}

export default App;
