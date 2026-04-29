import { Share2, Globe, Server, Activity, X, Plus } from 'lucide-react';
import ForceGraph2D from 'react-force-graph-2d';
import { useMemo, useRef, useEffect, useState, useLayoutEffect } from 'react';

interface NetworkMapProps {
  isOpen: boolean;
  onClose: () => void;
  peers: string[];
  onAddPeer: () => void;
  isDarkMode: boolean;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({ isOpen, onClose, peers, onAddPeer, isDarkMode }) => {
  const fgRef = useRef<any>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 250 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Use a stable array of unique peers to prevent unnecessary re-renders
  const uniquePeers = useMemo(() => {
    return Array.from(new Set(peers));
  }, [Array.from(new Set(peers)).sort().join(',')]);

  const graphData = useMemo(() => {
    // Resolve CSS variables for the canvas
    const rootStyle = getComputedStyle(document.documentElement);
    const primaryColor = rootStyle.getPropertyValue('--accent-primary').trim() || '#6366f1';
    const successColor = rootStyle.getPropertyValue('--accent-success').trim() || '#10b981';
    const linkColor = isDarkMode ? 'rgba(99, 102, 241, 0.4)' : 'rgba(99, 102, 241, 0.25)';

    const nodes = [
      { id: 'Local Node', name: 'This Node', group: 1, val: 8, color: primaryColor },
      ...uniquePeers.map(peer => ({ id: peer, name: peer.replace('ws://', ''), group: 2, val: 4, color: successColor }))
    ];

    const links = uniquePeers.map(peer => ({
      source: 'Local Node',
      target: peer,
      color: linkColor
    }));

    return { nodes, links };
  }, [uniquePeers, isDarkMode]);

  // Apply forces immediately before the browser paints
  // Dependency on dimensions.width ensures this runs after the container size is measured and ForceGraph2D mounts.
  useLayoutEffect(() => {
    if (fgRef.current) {
      fgRef.current.d3Force('charge')?.strength(-150); // moderate repulsion
      fgRef.current.d3Force('link')?.distance(30);     // moderate links
      fgRef.current.d3ReheatSimulation();
    }
  }, [isOpen, uniquePeers, dimensions.width]);

  useEffect(() => {
    if (isOpen && containerRef.current) {
      setDimensions({
        width: containerRef.current.offsetWidth,
        height: 250
      });
    }
  }, [isOpen, uniquePeers]);

  if (!isOpen) return null;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      backgroundColor: 'var(--modal-overlay)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 2000,
      padding: '20px'
    }} onClick={onClose}>
      <div
        style={{
          width: '100%',
          maxWidth: '600px', // slightly wider to accommodate the graph better
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '90vh',
          overflowY: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
        className="glass-card"
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ padding: '8px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: '8px', color: 'var(--accent-success)' }}>
              <Globe size={20} />
            </div>
            <h2 style={{ fontSize: '1.25rem', color: 'var(--text-primary)' }}>Network Map</h2>
          </div>
          <button
            onClick={onClose}
            style={{ padding: '8px', borderRadius: '10px', color: 'var(--text-secondary)' }}
            className="glass-card"
          >
            <X size={20} />
          </button>
        </div>

        {/* Visual Network Graph */}
        <div
          ref={containerRef}
          style={{
            width: '100%',
            height: '250px',
            borderRadius: '12px',
            overflow: 'hidden',
            border: '1px solid var(--glass-border)',
            background: 'var(--input-bg)',
            marginBottom: '20px',
            position: 'relative'
          }}
        >
          {dimensions.width > 0 && (
            <ForceGraph2D
              ref={fgRef}
              width={dimensions.width}
              height={dimensions.height}
              graphData={graphData}
              nodeLabel="name"
              nodeColor={node => (node as any).color}
              nodeRelSize={3}
              linkColor={link => (link as any).color}
              linkWidth={2}
              d3VelocityDecay={0.3}
              enableNodeDrag={true}
              enableZoomInteraction={true}
              enablePanInteraction={true}
              backgroundColor="transparent"
            />
          )}
          {uniquePeers.length === 0 && (
            <div style={{
              position: 'absolute',
              top: 0, left: 0, right: 0, bottom: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              pointerEvents: 'none',
              color: 'var(--text-secondary)',
              fontSize: '0.85rem'
            }}>
              No connections to visualize
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '20px' }}>
          {/* Local Node Entry */}
          <div className="glass-card" style={{
            padding: '12px',
            background: 'rgba(99, 102, 241, 0.1)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            border: '1px solid var(--accent-primary)'
          }}>
            <div style={{ position: 'relative' }}>
              <Server size={18} style={{ color: 'var(--accent-primary)' }} />
              <div style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                width: 8,
                height: 8,
                background: 'var(--accent-success)',
                borderRadius: '50%',
                border: '2px solid var(--glass-bg)'
              }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                This Node <span style={{ fontSize: '0.65rem', opacity: 0.7, marginLeft: '4px' }}>(Local)</span>
              </div>
              <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Activity size={10} />
                <span>Primary Instance</span>
              </div>
            </div>
          </div>

          {uniquePeers.length === 0 ? (
            <div style={{
              padding: '20px',
              textAlign: 'center',
              background: 'rgba(0,0,0,0.1)',
              borderRadius: '12px',
              border: '1px dashed var(--glass-border)',
              color: 'var(--text-secondary)',
              fontSize: '0.8rem'
            }}>
              <Share2 size={24} style={{ marginBottom: '8px', opacity: 0.5 }} />
              <p>No peers connected.<br />Start a second node to test P2P!</p>
            </div>
          ) : (
            uniquePeers.map((peer, i) => (
              <div key={i} className="glass-card" style={{
                padding: '12px',
                background: 'var(--input-bg)',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                border: '1px solid var(--glass-border)'
              }}>
                <div style={{ position: 'relative' }}>
                  <Server size={18} style={{ color: 'var(--accent-primary)' }} />
                  <div style={{
                    position: 'absolute',
                    bottom: -2,
                    right: -2,
                    width: 8,
                    height: 8,
                    background: 'var(--accent-success)',
                    borderRadius: '50%',
                    border: '2px solid var(--glass-bg)'
                  }} />
                </div>

                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-primary)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                    {peer.replace('ws://', '')}
                  </div>
                  <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Activity size={10} />
                    <span>Active Connection</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={onAddPeer}
            className="glass-card"
            style={{ flex: 1, padding: '12px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 600, color: 'var(--accent-primary)', display: 'flex', justifyContent: 'center', gap: '8px', alignItems: 'center' }}
          >
            <Plus size={16} />
            Connect New Peer
          </button>
        </div>

        <div style={{
          marginTop: '20px',
          padding: '12px',
          background: 'rgba(99, 102, 241, 0.05)',
          borderRadius: '8px',
          fontSize: '0.75rem',
          color: 'var(--text-secondary)',
          lineHeight: 1.4,
          border: '1px solid rgba(99, 102, 241, 0.1)'
        }}>
          <strong>Pro Tip:</strong> Run another node on port 3001 and connect to <code>ws://localhost:6001</code> to see the network in action!
        </div>
      </div>
    </div>
  );
};
