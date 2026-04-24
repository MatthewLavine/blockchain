import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';

let myCoin = new Blockchain();

console.log('Creating some transactions...');
myCoin.createTransaction(new Transaction('address1', 'address2', 100));
myCoin.createTransaction(new Transaction('address2', 'address1', 50));

console.log('\nStarting the miner...');
// The miner gets the reward sent to 'my-wallet-address'
myCoin.minePendingTransactions('my-wallet-address');

// The miner's balance will be 0 right now, because the reward is put into the PENDING transactions for the next block!
console.log('\nBalance of my-wallet-address is', myCoin.getBalanceOfAddress('my-wallet-address'));

console.log('\nStarting the miner again...');
myCoin.minePendingTransactions('my-wallet-address');

// NOW the miner has their 100 coins from the first block they mined.
console.log('\nBalance of my-wallet-address is', myCoin.getBalanceOfAddress('my-wallet-address'));

// Check balances of other addresses
console.log('\nBalance of address1 is', myCoin.getBalanceOfAddress('address1'));
console.log('Balance of address2 is', myCoin.getBalanceOfAddress('address2'));

// 4. Test Chain Validation
console.log('\nIs blockchain valid?', myCoin.isChainValid());
