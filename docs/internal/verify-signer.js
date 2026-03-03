const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load .env.local
const envPath = path.resolve(__dirname, 'backend/.env.local');
const envConfig = dotenv.parse(fs.readFileSync(envPath));

const signerSecret = envConfig.BACKEND_SIGNER_SECRET_KEY;

if (!signerSecret) {
  console.log('❌ BACKEND_SIGNER_SECRET_KEY not found in .env.local');
  process.exit(1);
}

try {
  const secretArray = JSON.parse(signerSecret);
  const { Keypair } = require('@solana/web3.js');
  const keypair = Keypair.fromSecretKey(new Uint8Array(secretArray));
  console.log('\n✅ Backend Signer Configured Successfully!\n');
  console.log('📍 Public Key (Backend Signer Address):');
  console.log(keypair.publicKey.toString());
  console.log('\n✨ Transaction signing is enabled and ready to use\n');
  process.exit(0);
} catch (error) {
  console.log('\n❌ Error parsing secret key:', error.message);
  process.exit(1);
}
