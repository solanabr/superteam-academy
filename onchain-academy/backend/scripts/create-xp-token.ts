// scripts/create-xp-token.ts
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  createInitializeMintInstruction,
  createInitializeNonTransferableMintInstruction,
  getMintLen,
  ExtensionType,
  TOKEN_2022_PROGRAM_ID,
} from '@solana/spl-token';
import fs from 'fs';
import path from 'path';

async function main() {
  console.log('🚀 Creating XP Token (Token-2022 with NonTransferable)...\n');
  
  // Connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  
  // Load your wallet
  const payerKeypair = Keypair.fromSecretKey(
    Buffer.from(
      JSON.parse(
        fs.readFileSync(path.join(process.env.HOME!, '.config/solana/id.json'), 'utf-8')
      )
    )
  );
  
  console.log('Authority Wallet:', payerKeypair.publicKey.toBase58());
  
  // Check balance
  const balance = await connection.getBalance(payerKeypair.publicKey);
  console.log('Balance:', balance / 1e9, 'SOL\n');
  
  if (balance < 0.1 * 1e9) {
    console.error('❌ Not enough SOL. Run: solana airdrop 2');
    process.exit(1);
  }
  
  // Generate new mint keypair
  const mintKeypair = Keypair.generate();
  
  console.log('Creating mint:', mintKeypair.publicKey.toBase58());
  
  // Calculate space needed
  const extensions = [ExtensionType.NonTransferable];
  const mintLen = getMintLen(extensions);
  const lamports = await connection.getMinimumBalanceForRentExemption(mintLen);
  
  console.log('Required lamports:', lamports);
  
  // Build transaction
  const transaction = new Transaction().add(
    // 1. Create account for mint
    SystemProgram.createAccount({
      fromPubkey: payerKeypair.publicKey,
      newAccountPubkey: mintKeypair.publicKey,
      space: mintLen,
      lamports,
      programId: TOKEN_2022_PROGRAM_ID,
    }),
    // 2. Initialize NonTransferable extension
    createInitializeNonTransferableMintInstruction(
      mintKeypair.publicKey,
      TOKEN_2022_PROGRAM_ID
    ),
    // 3. Initialize mint
    createInitializeMintInstruction(
      mintKeypair.publicKey,
      9, // 9 decimals (like SOL)
      payerKeypair.publicKey, // Mint authority = you
      null, // No freeze authority
      TOKEN_2022_PROGRAM_ID
    )
  );
  
  // Send transaction
  console.log('\nSending transaction...');
  const signature = await sendAndConfirmTransaction(
    connection,
    transaction,
    [payerKeypair, mintKeypair],
    { commitment: 'confirmed' }
  );
  
  console.log('\n✅ XP Token Created Successfully!');
  console.log('Signature:', signature);
  console.log('Explorer:', `https://explorer.solana.com/tx/${signature}?cluster=devnet`);
  
  // Save config
  const config = {
    xpMint: mintKeypair.publicKey.toBase58(),
    mintAuthority: payerKeypair.publicKey.toBase58(),
    network: 'devnet',
    programId: TOKEN_2022_PROGRAM_ID.toBase58(),
    decimals: 9,
    createdAt: new Date().toISOString(),
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'xp-token-config.json'),
    JSON.stringify(config, null, 2)
  );
  
  console.log('\n📋 Configuration saved to: scripts/xp-token-config.json');
  console.log('\n🔑 Add to your .env files:');
  console.log(`XP_MINT=${config.xpMint}`);
  console.log(`MINT_AUTHORITY=${config.mintAuthority}`);
}

main().catch((err) => {
  console.error('\n❌ Error:', err);
  process.exit(1);
});
