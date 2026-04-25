import { useState, useEffect } from 'react';
import { useBlockchain } from './hooks/useBlockchain';
import { Header } from './components/Header';
import { WalletCard } from './components/WalletCard';
import { ActivityList } from './components/ActivityList';
import { TransactionForm } from './components/TransactionForm';
import { MiningCard } from './components/MiningCard';
import { BlockExplorer } from './components/BlockExplorer';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const {
    walletAddress,
    balance,
    blocks,
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
    <div className="container" style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
      <Header 
        isDarkMode={isDarkMode} 
        setIsDarkMode={setIsDarkMode} 
        fetchData={fetchData} 
        isLoading={isLoading} 
      />

      {/* Notifications */}
      {error && (
        <div className="glass-card" style={{ marginBottom: '20px', border: '1px solid #ef444455', color: '#f87171', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}
      {success && (
        <div className="glass-card" style={{ marginBottom: '20px', border: '1px solid #10b98155', color: '#34d399', display: 'flex', gap: '12px', alignItems: 'center' }}>
          <CheckCircle2 size={20} />
          <p>{success}</p>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '30px' }}>
        {/* Left Column: Wallet & Actions */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
          <WalletCard address={walletAddress} balance={balance} />
          <ActivityList blocks={blocks} walletAddress={walletAddress} />
          <TransactionForm sendTransaction={sendTransaction} isLoading={isLoading} />
          <MiningCard mineBlock={mineBlock} isMining={isMining} />
        </section>

        {/* Right Column: Block Explorer */}
        <BlockExplorer blocks={blocks} />
      </div>
    </div>
  );
}

export default App;
