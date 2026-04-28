import React from 'react';
import { Cpu } from 'lucide-react';

interface MiningCardProps {
  mineBlock: () => Promise<void>;
  isMining: boolean;
  reward: number;
}

export const MiningCard: React.FC<MiningCardProps> = ({ mineBlock, isMining, reward }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '36px', 
          height: '36px', 
          background: 'rgba(99, 102, 241, 0.1)', 
          borderRadius: '10px', 
          color: 'var(--accent-primary)' 
        }}>
          <Cpu size={18} />
        </div>
        <h2 style={{ fontSize: '1rem' }}>Mining</h2>
      </div>

      <button 
        onClick={mineBlock} 
        disabled={isMining}
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center',
          width: '100%',
          flex: 1,
          gap: '8px', 
          cursor: isMining ? 'default' : 'pointer',
          background: isMining ? 'rgba(16, 185, 129, 0.2)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '16px',
          padding: '24px',
          color: 'white',
          boxShadow: isMining ? 'none' : '0 4px 15px -3px rgba(16, 185, 129, 0.4)',
          animation: isMining ? 'pulse 2s infinite' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
          border: 'none'
        }}
        onMouseEnter={(e) => { if (!isMining) {
          e.currentTarget.style.transform = 'translateY(-3px)';
          e.currentTarget.style.boxShadow = '0 10px 25px -5px rgba(16, 185, 129, 0.5)';
          e.currentTarget.style.filter = 'brightness(1.1)';
        }}}
        onMouseLeave={(e) => { if (!isMining) {
          e.currentTarget.style.transform = 'translateY(0)';
          e.currentTarget.style.boxShadow = '0 4px 15px -3px rgba(16, 185, 129, 0.4)';
          e.currentTarget.style.filter = 'brightness(1)';
        }}}
      >
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ marginBottom: '6px', fontSize: '1.25rem', color: 'white', fontWeight: 700 }}>
            {isMining ? 'Mining Block...' : 'Mine Next Block'}
          </h3>
          <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.85rem' }}>
            Earn <span style={{ fontWeight: 700, color: 'white' }}>{reward} AGC</span> Reward
          </p>
        </div>
      </button>
    </div>
  );
};
