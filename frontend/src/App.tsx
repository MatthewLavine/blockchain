import { useState, useEffect } from 'react';
import { useBlockchain } from './hooks/useBlockchain';
import { Header } from './components/Header';
import { WalletCard } from './components/WalletCard';
import { ActivityList } from './components/ActivityList';
import { TransactionForm } from './components/TransactionForm';
import { MiningCard } from './components/MiningCard';
import { BlockExplorer } from './components/BlockExplorer';
import { Mempool } from './components/Mempool';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    walletAddress,
    balance,
    blocks,
    pendingTransactions,
    isLoading,
    isMining,
    error,
    success,
    fetchData,
    sendTransaction,
    mineBlock
  } = useBlockchain();

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', isDarkMode ? 'dark' : 'light');
  }, [isDarkMode]);

  return (
    <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', padding: '20px', boxSizing: 'border-box' }}>
      <Header 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        fetchData={fetchData} 
        isLoading={isLoading} 
      />

      {/* Notifications - Fixed corner overlay */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, width: '350px' }}>
        {error && (
          <div className="glass-card" style={{ marginBottom: '10px', border: '1px solid #ef444455', color: '#f87171', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
            <AlertCircle size={18} />
            <p style={{ fontSize: '0.8125rem' }}>{error}</p>
          </div>
        )}
        {success && (
          <div className="glass-card" style={{ border: '1px solid #10b98155', color: '#34d399', display: 'flex', gap: '12px', alignItems: 'center', padding: '12px' }}>
            <CheckCircle2 size={18} />
            <p style={{ fontSize: '0.8125rem' }}>{success}</p>
          </div>
        )}
      </div>

      <main style={{ 
        display: 'grid', 
        gridTemplateColumns: '300px 1fr 320px', 
        gap: '20px', 
        flex: 1, 
        minHeight: 0 // Crucial for flex nested scrolling
      }}>
        {/* Column 1: Control Center */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          <div style={{ flexShrink: 0 }}>
            <WalletCard address={walletAddress} balance={balance} />
          </div>
          <div style={{ flex: 1, minHeight: 0, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <TransactionForm sendTransaction={sendTransaction} isLoading={isLoading} />
            <MiningCard mineBlock={mineBlock} isMining={isMining} />
          </div>
        </section>

        {/* Column 2: Ledger Explorer */}
        <section style={{ display: 'flex', flexDirection: 'column', minHeight: 0 }}>
          <BlockExplorer blocks={blocks} />
        </section>

        {/* Column 3: Activity Feed */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', minHeight: 0 }}>
          <div style={{ flex: '0 1 auto', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <Mempool transactions={pendingTransactions} />
          </div>
          <div style={{ flex: '1 1 0%', minHeight: 0, display: 'flex', flexDirection: 'column' }}>
            <ActivityList blocks={blocks} walletAddress={walletAddress} />
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
