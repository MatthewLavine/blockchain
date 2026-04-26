import { RefreshCcw, Sun, Moon, Trash2, Users, Plus, Code } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  fetchData: (silent?: boolean) => void;
  resetChain: () => void;
  peers: string[];
  onPeersClick: () => void;
  addPeer: (url: string) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode, fetchData, resetChain, peers, onPeersClick, addPeer, isLoading }) => {
  const handleReset = () => {
    if (window.confirm('Are you sure you want to reset the entire blockchain? This cannot be undone.')) {
      resetChain();
    }
  };

  const handleAddPeer = () => {
    const url = window.prompt('Enter Peer WebSocket URL (e.g., ws://localhost:6001):');
    if (url) addPeer(url);
  };

  return (
    <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ minWidth: '300px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2 }}>Antigravity Chain</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Secure, Transparent, Decentralized.</p>
          <div 
            onClick={onPeersClick}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '4px', 
              background: 'rgba(16, 185, 129, 0.1)', 
              color: 'var(--accent-success)', 
              padding: '2px 8px', 
              borderRadius: '12px', 
              fontSize: '0.7rem', 
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            <Users size={12} />
            <span>{peers.length} Peers</span>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={handleAddPeer}
          className="glass-card"
          style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center', color: 'var(--text-primary)' }}
          title="Add Peer"
        >
          <Plus size={18} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Connect</span>
        </button>
        <button
          onClick={handleReset}
          className="glass-card"
          style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center', color: '#ef4444' }}
          title="Reset Blockchain"
        >
          <Trash2 size={18} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Reset</span>
        </button>
        <a 
          href="https://github.com/MatthewLavine/blockchain" 
          target="_blank" 
          rel="noopener noreferrer"
          className="glass-card"
          style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)', textDecoration: 'none' }}
          title="View on GitHub"
        >
          <Code size={20} style={{ color: 'var(--accent-primary)' }} />
        </a>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="glass-card"
          style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', alignItems: 'center', color: 'var(--text-primary)' }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          <div style={{ color: 'var(--accent-primary)', display: 'flex', alignItems: 'center' }}>
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </div>
        </button>
        <button
          onClick={() => fetchData(false)}
          className="glass-card"
          style={{ padding: '10px 16px', borderRadius: '12px', display: 'flex', gap: '10px', alignItems: 'center', color: 'var(--text-primary)' }}
        >
          <RefreshCcw size={18} className={isLoading ? 'animate-spin' : ''} style={{ color: 'var(--accent-primary)' }} />
          <span style={{ fontWeight: 600, fontSize: '0.9rem' }}>Refresh</span>
        </button>
      </div>
    </header>
  );
};
