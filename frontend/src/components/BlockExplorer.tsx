import React from 'react';
import { Database, CheckCircle2 } from 'lucide-react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Block } from '../hooks/useBlockchain';

interface BlockExplorerProps {
  blocks: Block[];
  onBlockClick: (block: Block) => void;
}

export const BlockExplorer: React.FC<BlockExplorerProps> = ({ blocks, onBlockClick }) => {
  const parentRef = React.useRef<HTMLDivElement>(null);

  const rowVirtualizer = useVirtualizer({
    count: blocks.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 38,
    overscan: 5,
  });

  return (
    <section className="glass-card" style={{ display: 'flex', flexDirection: 'column', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexShrink: 0 }}>
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
          <Database size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Blockchain Ledger</h2>
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: '80px 2fr 1.5fr 80px 1fr',
        background: 'var(--table-header-bg)',
        borderBottom: '2px solid var(--glass-border)',
        color: 'var(--text-secondary)',
        textTransform: 'uppercase',
        fontSize: '0.7rem',
        letterSpacing: '0.05em',
        fontWeight: 600,
        padding: '14px 10px',
        marginRight: '8px' // Account for scrollbar space
      }}>
        <div>Index</div>
        <div>Hash</div>
        <div>Time</div>
        <div style={{ textAlign: 'center' }}>Txs</div>
        <div style={{ textAlign: 'right' }}>Status</div>
      </div>

      <div ref={parentRef} style={{ overflowY: 'auto', overflowX: 'hidden', flex: 1, paddingRight: '10px', marginTop: '4px' }}>
        <div style={{ height: `${rowVirtualizer.getTotalSize()}px`, width: '100%', position: 'relative' }}>
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const block = blocks[virtualRow.index];
            const index = virtualRow.index;
            return (
              <div
                key={virtualRow.key}
                onClick={() => onBlockClick(block)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                  display: 'grid',
                  gridTemplateColumns: '80px 2fr 1.5fr 80px 1fr',
                  alignItems: 'center',
                  padding: '0 10px',
                  borderBottom: '1px solid rgba(255,255,255,0.03)',
                  transition: 'background 0.2s',
                  cursor: 'pointer',
                  fontSize: '0.8125rem'
                }}
                className="table-row-hover"
              >
                <div style={{ fontWeight: 600, color: 'var(--accent-primary)' }}>
                  #{blocks.length - index - 1}
                </div>
                <div style={{ fontFamily: 'monospace', color: 'var(--text-secondary)', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {block.hash.substring(0, 16)}...
                </div>
                <div style={{ whiteSpace: 'nowrap', color: 'var(--text-secondary)' }}>
                  {new Date(block.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <div style={{ textAlign: 'center' }}>
                  <span style={{
                    background: 'rgba(255,255,255,0.05)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 500
                  }}>
                    {block.transactions.length}
                  </span>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '4px', color: 'var(--accent-success)' }}>
                    <CheckCircle2 size={14} />
                    <span style={{ fontSize: '0.7rem' }}>Valid</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        .table-row-hover:hover {
          background: rgba(255, 255, 255, 0.02);
        }
      `}} />
    </section>
  );
};
