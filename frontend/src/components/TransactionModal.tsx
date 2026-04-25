import React from 'react';
import { X, Send, ArrowRight, ShieldCheck, Fingerprint, Coins, Clock } from 'lucide-react';
import { Transaction } from '../hooks/useBlockchain';

interface TransactionModalProps {
  transaction: Transaction | null;
  onClose: () => void;
}

export const TransactionModal: React.FC<TransactionModalProps> = ({ transaction, onClose }) => {
  if (!transaction) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--modal-overlay)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div 
        style={{
          width: '100%',
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column'
        }} 
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <Send size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Transaction Details</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={11} />
                {transaction.timestamp
                  ? new Date(transaction.timestamp).toLocaleString()
                  : 'Timestamp unavailable'}
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-secondary)' }}
            className="glass-card"
          >
            <X size={20} />
          </button>
        </div>

        {/* Amount Card */}
        <div className="glass-card" style={{ 
          padding: '20px', 
          background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%)', 
          border: '1px solid var(--accent-primary)',
          textAlign: 'center',
          marginBottom: '24px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--accent-primary)', marginBottom: '8px' }}>
            <Coins size={32} />
          </div>
          <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--text-primary)' }}>
            {transaction.amount} <span style={{ fontSize: '1rem', color: 'var(--text-secondary)' }}>AGC</span>
          </div>
        </div>

        {/* Peer Info */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '24px' }}>
          <div className="glass-card" style={{ padding: '15px', background: 'var(--glass-bg)' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Sender (From)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-primary)' }}>
              {transaction.fromAddress || 'SYSTEM (Mining Reward)'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', color: 'var(--text-secondary)' }}>
            <ArrowRight size={20} />
          </div>

          <div className="glass-card" style={{ padding: '15px', background: 'var(--glass-bg)' }}>
            <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: '6px' }}>Recipient (To)</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.8rem', wordBreak: 'break-all', color: 'var(--text-primary)' }}>
              {transaction.toAddress}
            </div>
          </div>
        </div>

        {/* Security Meta */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <div className="glass-card" style={{ flex: 1, padding: '12px', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={16} style={{ color: 'var(--accent-success)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>Valid Signature</span>
          </div>
          <div className="glass-card" style={{ flex: 1, padding: '12px', background: 'var(--glass-bg)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Fingerprint size={16} style={{ color: 'var(--accent-primary)' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>ECC Signed</span>
          </div>
        </div>
      </div>
    </div>
  );
};
