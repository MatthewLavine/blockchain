import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

// 1. Generate Wallets
const myKey = ec.genKeyPair();
const myWalletAddress = myKey.getPublic('hex');

const targetAddress = 'some-other-public-key';

// 2. Initialize the blockchain
let myCoin = new Blockchain();

console.log('--- Polishing Core Logic Test ---');

// 3. Try to send money we don't have (Should Fail!)
try {
  console.log('\nAttempting to send 10 coins with 0 balance...');
  const txFail = new Transaction(myWalletAddress, targetAddress, 10);
  txFail.signTransaction(myKey);
  myCoin.createTransaction(txFail);
} catch (error: any) {
  console.log('Caught Error:', error.message);
}

// 4. Mine a block to get some money
console.log('\nStarting the miner to earn rewards...');
myCoin.minePendingTransactions(myWalletAddress); // Block 1 mined (Reward is waiting in pending)
myCoin.minePendingTransactions(myWalletAddress); // Block 2 mined (Reward from Block 1 is now in our wallet)

console.log('\nBalance of my wallet is', myCoin.getBalanceOfAddress(myWalletAddress));

// 5. Now we can successfully send money
console.log('\nAttempting to send 10 coins now that we have money...');
const txSuccess = new Transaction(myWalletAddress, targetAddress, 10);
txSuccess.signTransaction(myKey);
myCoin.createTransaction(txSuccess);
console.log('Transaction added to pending pool!');

// 6. Test Halving (Mine a few more blocks to hit block 5)
console.log('\nMining to block 5 to test halving...');
myCoin.minePendingTransactions(myWalletAddress); // Block 3
myCoin.minePendingTransactions(myWalletAddress); // Block 4
myCoin.minePendingTransactions(myWalletAddress); // Block 5 (Halving happens here for the NEXT reward)

console.log('Current mining reward is:', myCoin.miningReward);
