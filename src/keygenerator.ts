import { ec as EC } from 'elliptic';

// You can use any elliptic curve you want, but secp256k1 is the one Bitcoin uses
const ec = new EC('secp256k1');

// Generate a new key pair and convert them to hex-strings
const key = ec.genKeyPair();
const publicKey = key.getPublic('hex');
const privateKey = key.getPrivate('hex');

console.log('--- New Wallet Generated ---');
console.log('Private key (KEEP THIS SECRET):', privateKey);
console.log('Public key (YOUR WALLET ADDRESS):', publicKey);
