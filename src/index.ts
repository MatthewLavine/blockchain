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
