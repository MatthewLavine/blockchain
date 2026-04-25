import React from 'react';
import { History, Cpu, Send } from 'lucide-react';
import { Block } from '../hooks/useBlockchain';

interface ActivityListProps {
  blocks: Block[];
  walletAddress: string;
}

export const ActivityList: React.FC<ActivityListProps> = ({ blocks, walletAddress }) => {
  const transactions = blocks
    .flatMap(b => b.transactions)
    .filter(tx => tx.fromAddress === walletAddress || tx.toAddress === walletAddress);

  return (
    <div className="glass-card" style={{ maxHeight: '400px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
          <History size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Recent Activity</h2>
      </div>

      <div style={{ overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {transactions.length === 0 ? (
          <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '20px' }}>No transactions found for this wallet.</p>
        ) : (
          transactions.map((tx, i) => {
            const isSent = tx.fromAddress === walletAddress;
            const isMiningReward = tx.fromAddress === null;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '15px', padding: '12px', background: 'rgba(0,0,0,0.1)', borderRadius: '12px', border: '1px solid var(--glass-border)' }}>
                <div style={{ 
                  padding: '8px', 
                  borderRadius: '8px', 
                  background: isMiningReward ? 'rgba(16, 185, 129, 0.1)' : (isSent ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)'),
                  color: isMiningReward ? 'var(--accent-success)' : (isSent ? '#f87171' : 'var(--accent-success)')
                }}>
                  {isMiningReward ? <Cpu size={18} /> : (isSent ? <Send size={18} style={{ transform: 'rotate(-45deg)' }} /> : <Send size={18} style={{ transform: 'rotate(135deg)' }} />)}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '0.875rem', fontWeight: 600 }}>{isMiningReward ? 'Mining Reward' : (isSent ? 'Sent' : 'Received')}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '150px' }}>
                    {isSent ? `To: ${tx.toAddress}` : (isMiningReward ? 'System Generation' : `From: ${tx.fromAddress}`)}
                  </div>
                </div>
                <div style={{ fontWeight: 700, color: isSent && !isMiningReward ? '#f87171' : 'var(--accent-success)' }}>
                  {isSent && !isMiningReward ? '-' : '+'}{tx.amount}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
