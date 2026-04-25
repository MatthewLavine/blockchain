import React from 'react';
import { Layers, Send, ArrowRight } from 'lucide-react';
import { Transaction } from '../hooks/useBlockchain';

interface MempoolProps {
  transactions: Transaction[];
}

export const Mempool: React.FC<MempoolProps> = ({ transactions }) => {
  return (
    <div className="glass-card" style={{ marginBottom: '30px' }}>
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

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', background: 'rgba(0,0,0,0.05)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            No pending transactions. All clear!
          </p>
        ) : (
          transactions.map((tx, i) => (
            <div key={i} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '15px', 
              padding: '12px', 
              background: 'rgba(99, 102, 241, 0.05)', 
              borderRadius: '12px', 
              border: '1px solid rgba(99, 102, 241, 0.2)' 
            }}>
              <div style={{ color: 'var(--accent-primary)' }}>
                <Send size={16} />
              </div>
              <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.8125rem' }}>
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{tx.fromAddress?.substring(0, 8)}...</span>
                <ArrowRight size={14} style={{ color: 'var(--text-secondary)' }} />
                <span style={{ color: 'var(--text-secondary)', fontFamily: 'monospace' }}>{tx.toAddress.substring(0, 8)}...</span>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                {tx.amount} AGC
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
