import React from 'react';
import { Layers, ArrowUpRight, ArrowDownLeft, ArrowRight } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Transaction } from '../hooks/useBlockchain';

interface MempoolProps {
  transactions: Transaction[];
  walletAddress: string;
  onTransactionClick: (tx: Transaction) => void;
}

export const Mempool: React.FC<MempoolProps> = ({ transactions, walletAddress, onTransactionClick }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, // Approximate height + gap
    overscan: 5,
  });

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '44px', 
          height: '44px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '12px', 
          color: 'var(--accent-primary)' 
        }}>
          <Layers size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Mempool (Pending)</h2>
        <span style={{ 
          marginLeft: 'auto', 
          background: 'rgba(99, 102, 241, 0.1)', 
          color: 'var(--accent-primary)', 
          padding: '4px 10px', 
          borderRadius: '20px', 
          fontSize: '0.75rem', 
          fontWeight: 600,
          whiteSpace: 'nowrap'
        }}>
          {transactions.length} Txs
        </span>
      </div>

      <div ref={parentRef} style={{ display: 'flex', flexDirection: 'column', overflowY: 'auto', flex: 1, paddingRight: '8px' }}>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px', background: 'var(--input-bg)', borderRadius: '12px', border: '1px dashed var(--glass-border)' }}>
            No pending transactions. All clear!
          </p>
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const tx = transactions[virtualRow.index];
              return (
                <div
                  key={virtualRow.key}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: `${virtualRow.size}px`,
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '10px'
                  }}
                >
                  <div 
                    onClick={() => onTransactionClick(tx)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '12px', 
                      padding: '10px', 
                      background: 'rgba(99, 102, 241, 0.05)', 
                      borderRadius: '10px', 
                      border: '1px solid rgba(99, 102, 241, 0.2)',
                      cursor: 'pointer',
                      height: '100%'
                    }}
                  >
                    <div style={{ 
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '32px',
                      height: '32px',
                      borderRadius: '8px', 
                      flexShrink: 0,
                      background: tx.fromAddress === walletAddress ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                      color: tx.fromAddress === walletAddress ? '#f87171' : 'var(--accent-success)'
                    }}>
                      {tx.fromAddress === walletAddress ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--accent-primary)' }}>
                          {Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })} AGC
                        </div>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', background: 'var(--input-bg)', padding: '2px 6px', borderRadius: '4px' }}>Pending</span>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        <span style={{ fontFamily: 'monospace' }}>{tx.fromAddress?.substring(0, 6)}...</span>
                        <ArrowRight size={12} />
                        <span style={{ fontFamily: 'monospace' }}>{tx.toAddress.substring(0, 6)}...</span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
