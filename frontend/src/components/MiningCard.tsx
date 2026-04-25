import React from 'react';
import { Cpu } from 'lucide-react';

interface MiningCardProps {
  mineBlock: () => Promise<void>;
  isMining: boolean;
}

export const MiningCard: React.FC<MiningCardProps> = ({ mineBlock, isMining }) => {
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
        gap: '15px', 
        cursor: isMining ? 'default' : 'pointer',
        borderColor: isMining ? 'var(--accent-primary)' : 'var(--glass-border)',
        animation: isMining ? 'pulse 2s infinite' : 'none'
      }}
    >
      <div style={{ padding: '15px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '50%', color: 'var(--accent-success)' }}>
        <div className={isMining ? 'animate-spin' : ''}>
          <Cpu size={32} />
        </div>
      </div>
      <div style={{ textAlign: 'center' }}>
        <h3 style={{ marginBottom: '4px', color: 'var(--text-primary)' }}>{isMining ? 'Mining in progress...' : 'Start Mining'}</h3>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem' }}>Solve the next block and earn 100 AGC reward</p>
      </div>
    </button>
  );
};
