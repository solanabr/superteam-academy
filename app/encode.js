const fs = require('fs');
const bs58 = require('bs58');

const keypairPath = '../wallets/signer.json';  // или другой файл
const keypair = JSON.parse(fs.readFileSync(keypairPath, 'utf8'));
const encoded = bs58.default.encode(Uint8Array.from(keypair));

console.log(encoded);