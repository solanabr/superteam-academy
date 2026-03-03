#!/usr/bin/env node

/**
 * Update Program ID in:
 * 1. programs/academy/src/lib.rs - declare_id! macro
 * 2. Anchor.toml - [programs.devnet] section
 */

const fs = require('fs');
const path = require('path');

const WALLETS_DIR = path.join(__dirname, '../wallets');
const PROGRAM_KEYPAIR_PATH = path.join(WALLETS_DIR, 'program-keypair.json');
const LIB_RS_PATH = path.join(__dirname, '../programs/academy/src/lib.rs');
const ANCHOR_TOML_PATH = path.join(__dirname, '../Anchor.toml');

// Read the program keypair
const keypairData = JSON.parse(fs.readFileSync(PROGRAM_KEYPAIR_PATH, 'utf8'));
const { Keypair } = require('@solana/web3.js');
const keypair = Keypair.fromSecretKey(new Uint8Array(keypairData));
const programId = keypair.publicKey.toString();

console.log(`Updating Program ID to: ${programId}\n`);

// Update lib.rs
let libRsContent = fs.readFileSync(LIB_RS_PATH, 'utf8');
const oldDeclareId = /declare_id!\("([^"]+)"\);/;
const newDeclareId = `declare_id!("${programId}");`;
libRsContent = libRsContent.replace(oldDeclareId, newDeclareId);
fs.writeFileSync(LIB_RS_PATH, libRsContent);
console.log(`✓ Updated ${LIB_RS_PATH}`);

// Update Anchor.toml
let anchorTomlContent = fs.readFileSync(ANCHOR_TOML_PATH, 'utf8');

// Update [programs.devnet] section
const devnetProgramRegex = /(\[programs\.devnet\]\s+academy\s+=\s+)"([^"]+)"/;
anchorTomlContent = anchorTomlContent.replace(
  devnetProgramRegex,
  `$1"${programId}"`
);

// If section doesn't exist, add it
if (!anchorTomlContent.includes('[programs.devnet]')) {
  // Add after [programs] or at the end
  if (anchorTomlContent.includes('[programs.')) {
    // Add after existing programs section
    const lastProgramIndex = anchorTomlContent.lastIndexOf('[programs.');
    const endOfLine = anchorTomlContent.indexOf('\n', lastProgramIndex);
    const nextLineEnd = anchorTomlContent.indexOf('\n', endOfLine + 1);
    const insertPos = nextLineEnd;
    anchorTomlContent =
      anchorTomlContent.slice(0, insertPos) +
      `\n\n[programs.devnet]\nacademy = "${programId}"` +
      anchorTomlContent.slice(insertPos);
  } else {
    anchorTomlContent += `\n[programs.devnet]\nacademy = "${programId}"\n`;
  }
}

fs.writeFileSync(ANCHOR_TOML_PATH, anchorTomlContent);
console.log(`✓ Updated ${ANCHOR_TOML_PATH}`);

console.log(`\n✅ Program ID update complete!`);
console.log(`PROGRAM_ID=${programId}`);
