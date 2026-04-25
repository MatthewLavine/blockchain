import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface TransactionFormProps {
  sendTransaction: (recipient: string, amount: number) => Promise<boolean>;
  isLoading: boolean;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ sendTransaction, isLoading }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendTransaction(recipient, parseFloat(amount));
    if (success) {
      setRecipient('');
      setAmount('');
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px' }}>
        <div style={{ padding: '10px', background: 'rgba(168, 85, 247, 0.1)', borderRadius: '10px', color: 'var(--accent-secondary)' }}>
          <Send size={24} />
        </div>
        <h2 style={{ fontSize: '1.25rem' }}>Send Coins</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <input 
            type="text" 
            placeholder="Recipient Address" 
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            type="number" 
            placeholder="Amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            style={{ width: '100%', padding: '12px', borderRadius: '10px', background: 'rgba(0,0,0,0.2)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none' }}
          />
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)' }}>AGC</span>
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading}>
          Sign & Send Transaction
        </button>
      </form>
    </div>
  );
};
