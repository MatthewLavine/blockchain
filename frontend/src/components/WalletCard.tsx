import React, { useState } from 'react';
import { Wallet, Shield, ShieldAlert, Copy, Check, Save, Clock, RefreshCw } from 'lucide-react';

interface WalletCardProps {
  address: string;
  balance: number;
  effectiveBalance: number;
  walletType?: 'saved' | 'temporary';
  hasSavedWallet?: boolean;
  generateSavedWallet?: () => void;
  generateTemporaryWallet?: () => void;
  loadSavedWallet?: () => void;
}

export const WalletCard: React.FC<WalletCardProps> = ({ 
  address, 
  balance,
  effectiveBalance,
  walletType = 'saved',
  hasSavedWallet = false,
  generateSavedWallet,
  generateTemporaryWallet,
  loadSavedWallet
}) => {
  const [copied, setCopied] = useState(false);
  const hasPendingSpends = Math.abs(balance - effectiveBalance) > 0.0000001;

  const handleCopy = () => {
    if (!address) return;
    navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="glass-card" style={{ position: 'relative' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '36px', 
          height: '36px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '10px', 
          color: 'var(--accent-primary)' 
        }}>
          <Wallet size={18} />
        </div>
        <h2 style={{ fontSize: '1rem' }}>My Wallet</h2>
        
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: '8px' }}>
          {walletType === 'saved' ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-success)', fontSize: '0.7rem', background: 'rgba(16, 185, 129, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
              <Shield size={12} />
              <span>Saved</span>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--accent-warning)', fontSize: '0.7rem', background: 'rgba(251, 191, 36, 0.1)', padding: '4px 8px', borderRadius: '20px' }}>
              <ShieldAlert size={12} />
              <span>Temporary</span>
            </div>
          )}
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
        <div 
          onClick={handleCopy}
          className="glass-card" 
          style={{ 
            padding: '8px', 
            fontSize: '0.7rem', 
            overflowWrap: 'anywhere', 
            background: 'var(--input-bg)', 
            border: '1px dashed var(--glass-border)',
            cursor: 'pointer',
            transition: 'all 0.2s'
          }}
          title="Click to copy"
          onMouseEnter={(e) => e.currentTarget.style.borderColor = 'var(--accent-primary)'}
          onMouseLeave={(e) => e.currentTarget.style.borderColor = 'var(--glass-border)'}
        >
          {address || 'Generating...'}
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
        <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
          {hasPendingSpends ? 'Available Balance' : 'Current Balance'}
        </label>
        <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>
          {Number(effectiveBalance).toLocaleString(undefined, { maximumFractionDigits: 8 })} <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontWeight: 500 }}>AGC</span>
        </div>
        {hasPendingSpends && (
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span>Total Mined: {Number(balance).toLocaleString(undefined, { maximumFractionDigits: 8 })} AGC</span>
          </div>
        )}
      </div>

      <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid var(--glass-border)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
          <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block' }}>Wallet Mode</label>
          
          {walletType === 'saved' && (
            <button 
              onClick={() => {
                if (window.confirm('Are you sure? This will overwrite your currently saved wallet with a new one.')) {
                  generateSavedWallet?.();
                }
              }}
              style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--accent-primary)', opacity: 0.8 }}
              onMouseEnter={(e) => e.currentTarget.style.opacity = '1'}
              onMouseLeave={(e) => e.currentTarget.style.opacity = '0.8'}
            >
              <RefreshCw size={10} />
              <span>Regenerate</span>
            </button>
          )}
        </div>

        <div style={{ display: 'flex', background: 'var(--glass-bg-darker)', borderRadius: '10px', padding: '4px', position: 'relative', border: '1px solid var(--glass-border)' }}>
          <button
            onClick={() => {
              if (walletType !== 'saved') {
                if (hasSavedWallet) {
                  loadSavedWallet?.();
                } else {
                  generateSavedWallet?.();
                }
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: walletType === 'saved' ? 'rgba(99, 102, 241, 0.2)' : 'transparent',
              color: walletType === 'saved' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: walletType === 'saved' ? '1px solid rgba(99, 102, 241, 0.3)' : '1px solid transparent',
              boxShadow: walletType === 'saved' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s ease',
              cursor: walletType === 'saved' ? 'default' : 'pointer'
            }}
          >
            <Save size={14} style={{ color: walletType === 'saved' ? 'var(--accent-primary)' : 'inherit' }} />
            <span>Saved Wallet</span>
          </button>
          
          <button
            onClick={() => {
              if (walletType !== 'temporary') {
                generateTemporaryWallet?.();
              }
            }}
            style={{
              flex: 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              padding: '8px',
              borderRadius: '8px',
              fontSize: '0.75rem',
              fontWeight: 500,
              background: walletType === 'temporary' ? 'rgba(251, 191, 36, 0.15)' : 'transparent',
              color: walletType === 'temporary' ? 'var(--text-primary)' : 'var(--text-secondary)',
              border: walletType === 'temporary' ? '1px solid rgba(251, 191, 36, 0.3)' : '1px solid transparent',
              boxShadow: walletType === 'temporary' ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
              transition: 'all 0.2s ease',
              cursor: walletType === 'temporary' ? 'default' : 'pointer'
            }}
          >
            <Clock size={14} style={{ color: walletType === 'temporary' ? 'var(--accent-warning)' : 'inherit' }} />
            <span>Temporary</span>
          </button>
        </div>
      </div>
    </div>
  );
};
