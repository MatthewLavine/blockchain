import React from 'react';
import { History, Cpu, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Block } from '../hooks/useBlockchain';

interface ActivityListProps {
  blocks: Block[];
  walletAddress: string;
  onTransactionClick: (tx: any) => void;
}

export const ActivityList: React.FC<ActivityListProps> = ({ blocks, walletAddress, onTransactionClick }) => {
  const transactions = blocks
    .flatMap(b => b.transactions)
    .filter(tx => tx.fromAddress === walletAddress || tx.toAddress === walletAddress);

  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: transactions.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80, // Approximate height + gap
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
          <History size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Recent Activity</h2>
      </div>

      <div ref={parentRef} style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', flex: 1, paddingRight: '8px' }}>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No transactions found for this wallet.</p>
        ) : (
          <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
            {rowVirtualizer.getVirtualItems().map((virtualRow) => {
              const tx = transactions[virtualRow.index];
              const isSent = tx.fromAddress === walletAddress;
              const isMiningReward = tx.fromAddress === null;
              return (
                <div
                  key={virtualRow.key}
                  ref={rowVirtualizer.measureElement}
                  data-index={virtualRow.index}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`,
                    paddingBottom: '12px'
                  }}
                >
                  <div 
                    onClick={() => onTransactionClick(tx)}
                    style={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      gap: '12px', 
                      padding: '10px', 
                      background: 'rgba(0,0,0,0.1)', 
                      borderRadius: '10px', 
                      border: '1px solid var(--glass-border)',
                      cursor: 'pointer'
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
                      background: isMiningReward ? 'rgba(16, 185, 129, 0.1)' : (isSent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                      color: isMiningReward ? 'var(--accent-success)' : (isSent ? '#f87171' : 'var(--accent-success)')
                    }}>
                      {isMiningReward ? <Cpu size={16} /> : (isSent ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />)}
                    </div>
                    
                    <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0, gap: '2px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{isMiningReward ? 'Mining Reward' : (isSent ? 'Sent' : 'Received')}</div>
                        <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSent && !isMiningReward ? '#f87171' : 'var(--accent-success)', whiteSpace: 'nowrap' }}>
                          {isSent && !isMiningReward ? '-' : '+'}{Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                        </div>
                      </div>
                      <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                        {isSent ? `To: ${tx.toAddress.substring(0, 20)}...` : (isMiningReward ? 'System Generation' : `From: ${tx.fromAddress?.substring(0, 20)}...`)}
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
