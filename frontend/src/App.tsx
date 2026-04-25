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
    <div className="container" style={{ maxWidth: '1440px', margin: '0 auto', padding: '20px' }}>
      <Header 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        fetchData={fetchData} 
        isLoading={isLoading} 
      />

      {/* Notifications */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, width: '400px' }}>
        {error && (
          <div className="glass-card" style={{ marginBottom: '10px', border: '1px solid #ef444455', color: '#f87171', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <AlertCircle size={20} />
            <p>{error}</p>
          </div>
        )}
        {success && (
          <div className="glass-card" style={{ border: '1px solid #10b98155', color: '#34d399', display: 'flex', gap: '12px', alignItems: 'center' }}>
            <CheckCircle2 size={20} />
            <p>{success}</p>
          </div>
        )}
      </div>

      <main style={{ display: 'grid', gridTemplateColumns: '320px 1fr 350px', gap: '20px', alignItems: 'start' }}>
        {/* Column 1: Wallet & Actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <WalletCard address={walletAddress} balance={balance} />
          <TransactionForm sendTransaction={sendTransaction} isLoading={isLoading} />
          <MiningCard mineBlock={mineBlock} isMining={isMining} />
        </section>

        {/* Column 2: The Main Chain Explorer */}
        <section>
          <BlockExplorer blocks={blocks} />
        </section>

        {/* Column 3: Feeds (Mempool & Activity) */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Mempool transactions={pendingTransactions} />
          <ActivityList blocks={blocks} walletAddress={walletAddress} />
        </section>
      </main>
    </div>
  );
}

export default App;
