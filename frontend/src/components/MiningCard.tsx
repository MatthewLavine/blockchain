import React from 'react';
import { Cpu } from 'lucide-react';

interface MiningCardProps {
  mineBlock: () => Promise<void>;
  isMining: boolean;
  reward: number;
}

export const MiningCard: React.FC<MiningCardProps> = ({ mineBlock, isMining, reward }) => {
  return (
    <button 
      onClick={mineBlock} 
      disabled={isMining}
      className="glass-card" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        width: '100%',
        flex: 1,
        justifyContent: 'center',
        gap: '15px', 
        cursor: isMining ? 'default' : 'pointer',
        borderColor: isMining ? 'var(--accent-primary)' : 'var(--glass-border)',
        animation: isMining ? 'pulse 2s infinite' : 'none'
      }}
    >
      <div style={{ padding: '10px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--accent-success)' }}>
        <div className={isMining ? 'animate-spin' : ''}>
          <Cpu size={24} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '2px', fontSize: '1rem', color: 'var(--text-primary)' }}>{isMining ? 'Mining...' : 'Start Mining'}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Earn {reward} AGC reward</p>
      </div>
    </button>
  );
};
