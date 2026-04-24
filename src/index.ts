import { Blockchain } from './Blockchain';
import { Block } from './Block';

// 1. Initialize a new cryptocurrency
let myCoin = new Blockchain();

// 2. Add some new blocks (transactions)
console.log('Mining block 1...');
myCoin.addBlock(new Block(Date.now(), { amount: 4 }));

console.log('Mining block 2...');
myCoin.addBlock(new Block(Date.now(), { amount: 10 }));

// 3. Print the whole blockchain to the console
console.log(JSON.stringify(myCoin, null, 2));

// 4. Test Chain Validation
console.log('Is blockchain valid?', myCoin.isChainValid());

// Let's try to tamper with the chain!
console.log('Tampering with block 1 data...');
myCoin.chain[1].data = { amount: 100 }; // Changing the amount from 4 to 100
console.log('Is blockchain valid?', myCoin.isChainValid());

// Even if we try to recalculate the hash for the tampered block...
// myCoin.chain[1].hash = myCoin.chain[1].calculateHash();
// console.log('Is blockchain valid?', myCoin.isChainValid()); // It would still be false because block 2's previousHash wouldn't match!
