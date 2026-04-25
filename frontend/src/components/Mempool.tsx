import React from 'react';
import { Layers, Send, ArrowRight } from 'lucide-react';
import { Transaction } from '../hooks/useBlockchain';

interface MempoolProps {
  transactions: Transaction[];
}

export const Mempool: React.FC<MempoolProps> = ({ transactions }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
          <Layers size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Mempool (Pending)</h2>
        <span style={{ 
          marginLeft: 'auto', 
          background: 'rgba(99, 102, 241, 0.1)', 
          color: 'var(--accent-primary)', 
          padding: '4px 12px', 
          borderRadius: '20px', 
          fontSize: '0.75rem', 
          fontWeight: 600 
        }}>
          {transactions.length} Transactions
        </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', flex: 1 }}>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            No pending transactions. All clear!
          </p>
        ) : (
          transactions.map((tx, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '6px', 
              padding: '10px', 
              background: 'rgba(99, 102, 241, 0.05)', 
              borderRadius: '10px', 
              border: '1px solid rgba(99, 102, 241, 0.2)' 
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--accent-primary)', fontSize: '0.85rem', fontWeight: 600 }}>
                  <Send size={14} />
                  <span>{tx.amount} AGC</span>
                </div>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'rgba(255,255,255,0.05)', padding: '2px 6px', borderRadius: '4px' }}>Pending</span>
              </div>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                <span style={{ fontFamily: 'monospace' }}>{tx.fromAddress?.substring(0, 6)}...</span>
                <ArrowRight size={12} />
                <span style={{ fontFamily: 'monospace' }}>{tx.toAddress.substring(0, 6)}...</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
