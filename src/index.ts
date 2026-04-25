import { Blockchain } from './Blockchain';
import { Transaction } from './Transaction';
import { ec as EC } from 'elliptic';

const ec = new EC('secp256k1');

// 1. Generate a Wallet (Public/Private Key Pair)
const myKey = ec.genKeyPair();
const myWalletAddress = myKey.getPublic('hex'); // The public key is our address

// 2. Initialize the blockchain
let myCoin = new Blockchain();

console.log('--- Securing Transactions ---');

// 3. Create a transaction
// Note: We don't actually have any coins yet, but we will send them anyway for the test!
const tx1 = new Transaction(myWalletAddress, 'some-other-public-key', 10);

// 4. SIGN the transaction with our private key
tx1.signTransaction(myKey);
console.log('Transaction signed successfully!');

// 5. Add it to the blockchain (this will internally check if the signature is valid)
myCoin.createTransaction(tx1);

console.log('\nStarting the miner...');
myCoin.minePendingTransactions(myWalletAddress); // We get the mining reward!

console.log('\nBalance of my wallet is', myCoin.getBalanceOfAddress(myWalletAddress));
console.log('Is blockchain valid?', myCoin.isChainValid());

console.log('\n--- Tampering Test ---');
// Let's try to tamper with our transaction AFTER it was signed and added to a block!
myCoin.chain[1].transactions[0].amount = 1000;

// The chain validation should catch this because the signature no longer matches the data!
console.log('Tampered with transaction amount. Is blockchain valid?', myCoin.isChainValid());
