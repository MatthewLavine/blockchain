import React from 'react';
import { Wallet, Shield } from 'lucide-react';

interface WalletCardProps {
  address: string;
  balance: number;
}

export const WalletCard: React.FC<WalletCardProps> = ({ address, balance }) => {
  return (
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
          {address || 'Generating...'}
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
  );
};
