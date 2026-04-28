import { useState, useEffect } from 'react';
import { useBlockchain } from './hooks/useBlockchain';
import { Header } from './components/Header';
import { WalletCard } from './components/WalletCard';
import { ActivityList } from './components/ActivityList';
import { TransactionForm } from './components/TransactionForm';
import { MiningCard } from './components/MiningCard';
import { BlockExplorer } from './components/BlockExplorer';
import { Mempool } from './components/Mempool';
import { BlockModal } from './components/BlockModal';
import { TransactionModal } from './components/TransactionModal';
import { NetworkMap } from './components/NetworkMap';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { Block, Transaction } from './hooks/useBlockchain';

function App() {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [isNetworkModalOpen, setIsNetworkModalOpen] = useState(false);
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
    mineBlock,
    addPeer,
    peers,
    miningReward,
    walletType,
    hasSavedWallet,
    generateSavedWallet,
    generateTemporaryWallet,
    loadSavedWallet
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
        peers={peers}
        onPeersClick={() => setIsNetworkModalOpen(true)}
        addPeer={addPeer}
        isLoading={isLoading} 
      />

      {/* Notifications - Toast Overlays */}
      <div style={{ position: 'fixed', bottom: '20px', right: '20px', zIndex: 1000, width: '350px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {error && (
          <div className="glass-card" style={{ 
            border: '1px solid var(--accent-error)', 
            color: 'var(--accent-error)', 
            background: isDarkMode ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.05)',
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center', 
            padding: '16px', 
            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' 
          }}>
            <AlertCircle size={20} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '2px' }}>Error</div>
              <p style={{ fontSize: '0.8rem', opacity: 0.9 }}>{error}</p>
            </div>
          </div>
        )}
        {success && (
          <div className="glass-card" style={{ 
            border: '1px solid var(--accent-success)', 
            color: 'var(--accent-success)', 
            background: isDarkMode ? 'rgba(16, 185, 129, 0.1)' : 'rgba(16, 185, 129, 0.05)',
            display: 'flex', 
            gap: '12px', 
            alignItems: 'center', 
            padding: '16px', 
            boxShadow: '0 10px 30px -5px rgba(0,0,0,0.3)' 
          }}>
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
          <WalletCard 
            address={walletAddress} 
            balance={balance} 
            walletType={walletType}
            hasSavedWallet={hasSavedWallet}
            generateSavedWallet={generateSavedWallet}
            generateTemporaryWallet={generateTemporaryWallet}
            loadSavedWallet={loadSavedWallet}
          />
          <TransactionForm sendTransaction={sendTransaction} isLoading={isLoading} />
          <MiningCard mineBlock={mineBlock} isMining={isMining} reward={miningReward} />
        </section>

        {/* Column 2: Blockchain Ledger */}
        <section>
          <BlockExplorer blocks={blocks} onBlockClick={setSelectedBlock} />
        </section>

        {/* Column 3: Network Feeds */}
        <section style={{ display: 'flex', flexDirection: 'column', gap: '20px', height: 'calc(100vh - 180px)', minHeight: '600px' }}>
          <Mempool 
            transactions={pendingTransactions} 
            walletAddress={walletAddress}
            onTransactionClick={setSelectedTransaction} 
          />
          <ActivityList blocks={blocks} walletAddress={walletAddress} onTransactionClick={setSelectedTransaction} />
        </section>
      </div>

      <BlockModal block={selectedBlock} onClose={() => setSelectedBlock(null)} />
      <TransactionModal 
        transaction={selectedTransaction} 
        walletAddress={walletAddress}
        onClose={() => setSelectedTransaction(null)} 
      />
      <NetworkMap 
        isOpen={isNetworkModalOpen} 
        onClose={() => setIsNetworkModalOpen(false)} 
        peers={peers} 
        onAddPeer={() => {
          const url = window.prompt('Enter Peer WebSocket URL (e.g., ws://localhost:6001):');
          if (url) addPeer(url);
        }} 
      />
    </div>
  );
}

export default App;
