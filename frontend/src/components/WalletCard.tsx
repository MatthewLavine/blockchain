import React, { useState } from 'react';
import { Wallet, Shield, Copy, Check } from 'lucide-react';

interface WalletCardProps {
  address: string;
  balance: number;
}

export const WalletCard: React.FC<WalletCardProps> = ({ address, balance }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
        <div style={{ padding: '8px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '8px', color: 'var(--accent-primary)' }}>
          <Wallet size={20} />
        </div>
        <h2 style={{ fontSize: '1.1rem' }}>My Wallet</h2>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-success)', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
          <Shield size={12} />
          <span>Verified</span>
        </div>
      </div>
      
      <div style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Public Address</label>
          <button 
            onClick={handleCopy}
            style={{ color: copied ? 'var(--accent-success)' : 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.7rem' }}
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            <span>{copied ? 'Copied!' : 'Copy'}</span>
          </button>
        </div>
        <div className="glass-card" style={{ padding: '8px', fontSize: '0.7rem', overflowWrap: 'anywhere', background: 'rgba(0,0,0,0.2)', border: '1px dashed var(--glass-border)' }}>
          {address || 'Generating...'}
        </div>
      </div>

      <div>
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Balance</label>
        <div style={{ fontSize: '1.25rem', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>AGC</span>
        </div>
      </div>
    </div>
  );
};
