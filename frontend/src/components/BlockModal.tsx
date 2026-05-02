import React from 'react';
import { X, Hash, Clock, ArrowRight, ShieldCheck } from 'lucide-react';
import { Block } from '../hooks/useBlockchain';

interface BlockModalProps {
  block: Block | null;
  onClose: () => void;
}

export const BlockModal: React.FC<BlockModalProps> = ({ block, onClose }) => {
  if (!block) return null;

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
          maxWidth: '600px',
          maxHeight: '80vh',
          display: 'flex',
          flexDirection: 'column'
        }} 
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
      >
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexShrink: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem' }}>Block Details</h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
                {block.hash.substring(0, 24)}...
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

        {/* Info Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '24px', flexShrink: 0 }}>
          <div className="glass-card" style={{ padding: '15px', background: 'var(--glass-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '4px' }}>
              <Clock size={12} />
              <span>Timestamp</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {new Date(block.timestamp).toLocaleString()}
            </div>
          </div>
          <div className="glass-card" style={{ padding: '15px', background: 'var(--glass-bg)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.7rem', marginBottom: '4px' }}>
              <Hash size={12} />
              <span>Previous Hash</span>
            </div>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, fontFamily: 'monospace', textOverflow: 'ellipsis', overflow: 'hidden', color: 'var(--text-primary)' }}>
              {block.previousHash.substring(0, 12)}...
            </div>
          </div>
        </div>

        {/* Transactions List */}
        <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-primary)' }}>
            Transactions ({block.transactions.length})
          </h3>

          {/* Total Fees Summary */}
          {block.index > 0 && (() => {
            const totalFees = block.transactions
              .filter(tx => tx.fromAddress !== null)
              .reduce((sum, tx) => sum + tx.fee, 0);
            return totalFees > 0 ? (
              <div className="glass-card" style={{ padding: '12px', background: 'rgba(251, 191, 36, 0.05)', border: '1px solid rgba(251, 191, 36, 0.2)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Fees Collected</span>
                <span style={{ fontWeight: 700, color: 'var(--accent-warning)' }}>
                  {Number(totalFees).toLocaleString(undefined, { maximumFractionDigits: 6 })} AGC
                </span>
              </div>
            ) : null;
          })()}
          
          {block.transactions.length === 0 ? (
            <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '30px', background: 'var(--glass-bg)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
              Genesis Block (No transactions)
            </p>
          ) : (
            block.transactions.map((tx, i) => (
              <div key={i} className="glass-card" style={{ padding: '15px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ fontWeight: 700, color: 'var(--accent-primary)', fontSize: '1rem' }}>
                    {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} AGC
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {tx.fromAddress && (
                      <span style={{ fontSize: '0.65rem', color: 'var(--accent-warning)', background: 'rgba(251, 191, 36, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                        Fee: {Number(tx.fee).toLocaleString(undefined, { maximumFractionDigits: 6 })} AGC
                      </span>
                    )}
                    <div style={{ fontSize: '0.65rem', background: 'rgba(16, 185, 129, 0.1)', color: 'var(--accent-success)', padding: '2px 8px', borderRadius: '4px' }}>
                      Confirmed
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '2px', color: 'var(--text-secondary)' }}>From</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-primary)' }}>{tx.fromAddress || 'SYSTEM (Reward)'}</div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', flexShrink: 0 }}>
                    <ArrowRight size={14} />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontSize: '0.6rem', textTransform: 'uppercase', marginBottom: '2px', color: 'var(--text-secondary)' }}>To</div>
                    <div style={{ fontFamily: 'monospace', fontSize: '0.7rem', wordBreak: 'break-all', color: 'var(--text-primary)' }}>{tx.toAddress}</div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
