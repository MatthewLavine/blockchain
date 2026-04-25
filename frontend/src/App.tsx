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
    <div className="container" style={{ maxWidth: '1600px', margin: '0 auto', padding: '40px 20px' }}>
      <Header 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        fetchData={fetchData} 
        isLoading={isLoading} 
      />

      {/* Notifications - Toast Overlays */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, width: '350px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {error && (
          <div className="glass-card" style={{ border: '1px solid #ef444455', color: '#f87171', display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)' }}>
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>Error</div>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="glass-card" style={{ border: '1px solid #10b98155', color: '#34d399', display: 'flex', gap: '12px', alignItems: 'center', padding: '16px', boxShadow: '0 10px 30px -5px rgba(0,0,0,0.5)' }}>
            <CheckCircle2 size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>Success</div>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>{success}</p>
            </div>
          </div>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 350px', gap: '20px', alignItems: 'start' }}>
        {/* Column 1: My Wallet & Actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <WalletCard address={walletAddress} balance={balance} />
          <TransactionForm sendTransaction={sendTransaction} isLoading={isLoading} />
          <MiningCard mineBlock={mineBlock} isMining={isMining} />
        </section>

        {/* Column 2: Blockchain Ledger */}
        <section>
          <BlockExplorer blocks={blocks} />
        </section>

        {/* Column 3: Network Feeds */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
          <Mempool transactions={pendingTransactions} />
          <ActivityList blocks={blocks} walletAddress={walletAddress} />
        </section>
      </div>
    </div>
  );
}

export default App;
