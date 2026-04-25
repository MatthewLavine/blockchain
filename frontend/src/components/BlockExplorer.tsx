import React from 'react';
import { Database, History, Lock } from 'lucide-react';
import { Block } from '../hooks/useBlockchain';

interface BlockExplorerProps {
  blocks: Block[];
}

export const BlockExplorer: React.FC<BlockExplorerProps> = ({ blocks }) => {
  return (
    <section className="glass-card" style={{ maxHeight: '1000px', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
          <Database size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Blockchain Explorer</h2>
      </div>

      <div style={{ overflowY: 'auto', paddingRight: '10px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {blocks.map((block, index) => (
          <div key={block.hash} className="glass-card" style={{ background: 'rgba(0,0,0,0.15)', padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '15px' }}>
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 600, textTransform: 'uppercase' }}>Block #{blocks.length - index - 1}</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <History size={14} style={{ color: 'var(--text-secondary)' }} />
                  <span style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>{new Date(block.timestamp).toLocaleString()}</span>
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Transactions</div>
                <div style={{ fontSize: '1.125rem', fontWeight: 600 }}>{block.transactions.length}</div>
              </div>
            </div>

            <div style={{ marginBottom: '12px' }}>
              <label style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', display: 'block', marginBottom: '4px' }}>Hash</label>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-secondary)', wordBreak: 'break-all', fontFamily: 'monospace' }}>{block.hash}</div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: 'var(--text-secondary)', fontSize: '0.75rem', paddingTop: '12px', borderTop: '1px solid var(--glass-border)' }}>
              <Lock size={12} />
              <span>Nonce: {block.nonce}</span>
              <span style={{ marginLeft: 'auto', color: 'var(--accent-success)' }}>Validated</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};
