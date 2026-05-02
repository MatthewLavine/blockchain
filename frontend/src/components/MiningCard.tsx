import React from 'react';
import { Cpu } from 'lucide-react';

interface MiningCardProps {
  mineBlock: () => Promise<void>;
  isMining: boolean;
  reward: number;
  pendingFees: number;
}

export const MiningCard: React.FC<MiningCardProps> = ({ mineBlock, isMining, reward, pendingFees }) => {
  return (
    <div className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
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
          <Cpu size={14} />
        </div>
        <h2 style={{ fontSize: '0.9rem' }}>Mining</h2>
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
          gap: '6px', 
          cursor: isMining ? 'default' : 'pointer',
          background: isMining 
            ? 'linear-gradient(135deg, #059669 0%, #065f46 100%)' 
            : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          borderRadius: '12px',
          padding: '20px 16px',
          color: 'white',
          boxShadow: isMining 
            ? '0 0 20px rgba(16, 185, 129, 0.4)' 
            : '0 4px 15px -3px rgba(16, 185, 129, 0.4)',
          animation: isMining ? 'pulse 1.5s infinite' : 'none',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          outline: 'none',
          border: 'none',
          transform: isMining ? 'scale(0.98)' : 'none'
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
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '16px' }}>
          {isMining && (
            <div className="animate-spin" style={{ display: 'flex', flexShrink: 0 }}>
              <Cpu size={18} />
            </div>
          )}
          <div style={{ textAlign: isMining ? 'left' : 'center' }}>
            <h3 style={{ marginBottom: '1px', fontSize: '0.9rem', color: 'white', fontWeight: 700, lineHeight: 1.2 }}>
              {isMining ? 'Mining...' : 'Mine Next Block'}
            </h3>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.7rem' }}>
              {isMining
                ? 'Processing...'
                : `${Number(reward + pendingFees).toLocaleString(undefined, { maximumFractionDigits: 6 })} AGC Reward`
              }
            </p>
          </div>
        </div>
      </button>
    </div>
  );
};
