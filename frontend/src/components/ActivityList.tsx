import React from 'react';
import { History, Cpu, Send } from 'lucide-react';
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

  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
          <History size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Recent Activity</h2>
      </div>

      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px', paddingRight: '8px' }}>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No transactions found for this wallet.</p>
        ) : (
          transactions.map((tx, i) => {
            const isSent = tx.fromAddress === walletAddress;
            const isMiningReward = tx.fromAddress === null;
            return (
              <div 
                key={i} 
                onClick={() => onTransactionClick(tx)}
                style={{ 
                  display: 'flex', 
                  flexDirection: 'column',
                  gap: '6px', 
                  padding: '10px', 
                  background: 'rgba(0,0,0,0.1)', 
                  borderRadius: '10px', 
                  border: '1px solid var(--glass-border)',
                  cursor: 'pointer'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      padding: '6px', 
                      borderRadius: '6px', 
                      background: isMiningReward ? 'rgba(16, 185, 129, 0.1)' : (isSent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                      color: isMiningReward ? 'var(--accent-success)' : (isSent ? '#f87171' : 'var(--accent-success)')
                    }}>
                      {isMiningReward ? <Cpu size={14} /> : (isSent ? <Send size={14} style={{ transform: 'rotate(-45deg)' }} /> : <Send size={14} style={{ transform: 'rotate(135deg)' }} />)}
                    </div>
                    <div style={{ fontSize: '0.8125rem', fontWeight: 600 }}>{isMiningReward ? 'Mining Reward' : (isSent ? 'Sent' : 'Received')}</div>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: isSent && !isMiningReward ? '#f87171' : 'var(--accent-success)', whiteSpace: 'nowrap' }}>
                    {isSent && !isMiningReward ? '-' : '+'}{Number(tx.amount).toLocaleString(undefined, { maximumFractionDigits: 8 })}
                  </div>
                </div>
                
                <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', paddingLeft: '30px' }}>
                  {isSent ? `To: ${tx.toAddress.substring(0, 20)}...` : (isMiningReward ? 'System Generation' : `From: ${tx.fromAddress?.substring(0, 20)}...`)}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
