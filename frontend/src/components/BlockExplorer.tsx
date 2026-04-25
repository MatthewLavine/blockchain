import React from 'react';
import { Database, Lock, CheckCircle2 } from 'lucide-react';
import { Block } from '../hooks/useBlockchain';

interface BlockExplorerProps {
  blocks: Block[];
}

export const BlockExplorer: React.FC<BlockExplorerProps> = ({ blocks }) => {
  return (
    <section className="glass-card" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '10px', color: 'var(--accent-primary)' }}>
          <Database size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Blockchain Ledger</h2>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid var(--glass-border)', color: 'var(--text-secondary)' }}>
              <th style={{ padding: '10px 8px', fontWeight: 500 }}>Index</th>
              <th style={{ padding: '10px 8px', fontWeight: 500 }}>Hash</th>
              <th style={{ padding: '10px 8px', fontWeight: 500 }}>Time</th>
              <th style={{ padding: '10px 8px', fontWeight: 500 }}>Txs</th>
              <th style={{ padding: '10px 8px', fontWeight: 500, textAlign: 'right' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {blocks.map((block, index) => (
              <tr key={block.hash} style={{ borderBottom: '1px solid rgba(255,255,255,0.03)', transition: 'background 0.2s' }} className="table-row-hover">
                <td style={{ padding: '10px 8px', fontWeight: 600, color: 'var(--accent-primary)' }}>
                  #{blocks.length - index - 1}
                </td>
                <td style={{ padding: '10px 8px', fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>
                  {block.hash.substring(0, 16)}...
                </td>
                <td style={{ padding: '10px 8px', whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'center' }}>
                  <span style={{ 
                    background: 'rgba(255,255,255,0.05)', 
                    padding: '2px 8px', 
                    borderRadius: '4px',
                    fontWeight: 500
                  }}>
                    {block.transactions.length}
                  </span>
                </td>
                <td style={{ padding: '10px 8px', textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: 'var(--accent-success)' }}>
                    <CheckCircle2 size={14} />
                    <span style={{ fontSize: '0.7rem' }}>Valid</span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}} />
    </section>
  );
};
