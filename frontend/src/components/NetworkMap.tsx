import { Share2, Globe, Server, Activity, ChevronRight, X, Plus } from 'lucide-react';

interface NetworkMapProps {
  isOpen: boolean;
  onClose: () => void;
  peers: string[];
  onAddPeer: () => void;
}

export const NetworkMap: React.FC<NetworkMapProps> = ({ isOpen, onClose, peers, onAddPeer }) => {
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
          maxWidth: '500px',
          display: 'flex',
          flexDirection: 'column'
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

          {peers.length === 0 ? (
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
            <p>No peers connected.<br/>Start a second node to test P2P!</p>
          </div>
        ) : (
          peers.map((peer, i) => (
            <div key={i} className="glass-card" style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.02)', 
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
