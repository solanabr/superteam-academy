#!/usr/bin/env node

/**
 * Generate three keypairs for deployment:
 * 1. signer.json - Authority/payer keypair
 * 2. program-keypair.json - Program ID keypair
 * 3. xp-mint-keypair.json - XP token mint keypair
 */

const fs = require('fs');
const path = require('path');
const { Keypair } = require('@solana/web3.js');

const walletsDir = path.join(__dirname, '../wallets');

// Ensure wallets directory exists
if (!fs.existsSync(walletsDir)) {
  fs.mkdirSync(walletsDir, { recursive: true });
}

const generateAndSaveKeypair = (filename, displayName) => {
  const keypair = Keypair.generate();
  const secretKeyArray = Array.from(keypair.secretKey);
  const filepath = path.join(walletsDir, filename);
  
  fs.writeFileSync(filepath, JSON.stringify(secretKeyArray), 'utf8');
  
  console.log(`✓ Generated ${displayName}`);
  console.log(`  File: ${filepath}`);
  console.log(`  Public Key: ${keypair.publicKey.toString()}`);
  
  return keypair.publicKey.toString();
};

console.log('Generating keypairs for Solana Academy deployment...\n');

const signerPubkey = generateAndSaveKeypair('signer.json', 'Signer/Authority Keypair');
console.log();

const programPubkey = generateAndSaveKeypair('program-keypair.json', 'Program ID Keypair');
console.log();

const xpMintPubkey = generateAndSaveKeypair('xp-mint-keypair.json', 'XP Mint Keypair');
console.log(`\n${'='.repeat(60)}`);
console.log('Deployment Configuration');
console.log('='.repeat(60));
console.log(`NEXT_PUBLIC_ANCHOR_PROGRAM_ID=${programPubkey}`);
console.log(`NEXT_PUBLIC_XP_TOKEN_MINT=${xpMintPubkey}`);
console.log(`NEXT_PUBLIC_BACKEND_SIGNER=${signerPubkey}`);
console.log('='.repeat(60) + '\n');

console.log('⚠️  IMPORTANT: Keep these files secure and add wallets/ to .gitignore');
console.log('✓ Keypairs generated successfully!');
