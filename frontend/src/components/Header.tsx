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
