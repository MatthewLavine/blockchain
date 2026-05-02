import React, { useState } from 'react';
import { Send } from 'lucide-react';

interface TransactionFormProps {
  sendTransaction: (recipient: string, amount: number, fee: number) => Promise<boolean>;
  isLoading: boolean;
  minFee: number;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ sendTransaction, isLoading, minFee }) => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [fee, setFee] = useState(minFee.toString());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const success = await sendTransaction(recipient, parseFloat(amount), parseFloat(fee));
    if (success) {
      setRecipient('');
      setAmount('');
      setFee(minFee.toString());
    }
  };

  return (
    <div className="glass-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          width: '36px', 
          height: '36px', 
          background: 'rgba(168, 85, 247, 0.1)', 
          borderRadius: '10px', 
          color: 'var(--accent-secondary)' 
        }}>
          <Send size={18} />
        </div>
        <h2 style={{ fontSize: '1rem' }}>Send Coins</h2>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <div>
          <input 
            type="text" 
            placeholder="Recipient Address" 
            value={recipient}
            onChange={(e) => setRecipient(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
          />
        </div>
        <div style={{ position: 'relative' }}>
          <input 
            type="number" 
            placeholder="Amount" 
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            step="any"
            style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
          />
          <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>AGC</span>
        </div>
        <div>
          <div style={{ position: 'relative' }}>
            <input
              type="number"
              placeholder="Fee"
              value={fee}
              onChange={(e) => setFee(e.target.value)}
              min={minFee}
              step="any"
              style={{ width: '100%', padding: '10px', borderRadius: '8px', background: 'var(--input-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-primary)', outline: 'none', fontSize: '0.875rem' }}
            />
            <span style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-secondary)', fontSize: '0.75rem' }}>AGC</span>
          </div>
          <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Min fee: {minFee} AGC · Higher fees = faster confirmation
          </div>
        </div>
        <button type="submit" className="btn-primary" disabled={isLoading} style={{ padding: '10px 20px', fontSize: '0.875rem' }}>
          Sign & Send
        </button>
      </form>
    </div>
  );
};
