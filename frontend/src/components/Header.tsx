import React from 'react';
import { RefreshCcw, Sun, Moon } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  setIsDarkMode: (val: boolean) => void;
  fetchData: (silent?: boolean) => void;
  isLoading: boolean;
}

export const Header: React.FC<HeaderProps> = ({ isDarkMode, setIsDarkMode, fetchData, isLoading }) => {
  return (
    <header style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '20px' }}>
      <div style={{ minWidth: '300px' }}>
        <h1 className="gradient-text" style={{ fontSize: '2.2rem', fontWeight: 700, lineHeight: 1.2 }}>Antigravity Chain</h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Secure, Transparent, Decentralized.</p>
      </div>
      <div style={{ display: 'flex', gap: '12px' }}>
        <button
          onClick={() => setIsDarkMode(!isDarkMode)}
          className="glass-card"
          style={{ padding: '12px', borderRadius: '12px', display: 'flex', alignItems: 'center' }}
          title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
        >
          {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
        </button>
        <button
          onClick={() => fetchData(false)}
          className="glass-card"
          style={{ padding: '12px', borderRadius: '12px', display: 'flex', gap: '8px', alignItems: 'center' }}
        >
          <RefreshCcw size={20} className={isLoading ? 'animate-spin' : ''} />
          <span>Refresh</span>
        </button>
      </div>
    </header>
  );
};
