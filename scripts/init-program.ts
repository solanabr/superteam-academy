/**
 * Initialize the Academy program on devnet
 * 
 * Usage: npx ts-node --esm scripts/init-program.ts
 */
import { Connection, Keypair, PublicKey, Transaction, sendAndConfirmTransaction } from '@solana/web3.js';
import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new PublicKey('2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

async function main() {
  // Load signer keypair
  const signerPath = path.resolve(__dirname, '../wallets/signer.json');
  const signerSecret = JSON.parse(fs.readFileSync(signerPath, 'utf-8'));
  const signer = Keypair.fromSecretKey(Uint8Array.from(signerSecret));
  console.log('Authority:', signer.publicKey.toBase58());

  // Load IDL
  const idlPath = path.resolve(__dirname, '../target/idl/academy.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

  // Connection (devnet)
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');
  const balance = await connection.getBalance(signer.publicKey);
  console.log('Balance:', balance / 1e9, 'SOL');

  // Create provider
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: signer.publicKey,
      signAllTransactions: async (txs) => {
        for (const tx of txs) {
          if ('sign' in tx) {
            tx.sign(signer);
          }
        }
        return txs;
      },
      signTransaction: async (tx) => {
        if ('sign' in tx) {
          tx.sign(signer);
        }
        return tx;
      },
    },
    { commitment: 'confirmed' }
  );

  // Normalize IDL for Anchor 0.30+
  const normalizedIdl = { ...idl, address: PROGRAM_ID.toBase58() };
  const program = new Program(normalizedIdl as Idl, provider);

  // Generate a new XP mint keypair (the program creates the mint via init)
  const xpMint = Keypair.generate();
  console.log('XP Mint (new):', xpMint.publicKey.toBase58());

  // Derive config PDA
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);
  console.log('Config PDA:', configPda.toBase58());

  // Derive minter role PDA
  const [minterPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('minter'), signer.publicKey.toBuffer()],
    PROGRAM_ID
  );
  console.log('Minter PDA:', minterPda.toBase58());

  // Check if config already initialized
  const configInfo = await connection.getAccountInfo(configPda);
  if (configInfo) {
    console.log('Program already initialized! Config account exists.');
    return;
  }

  console.log('\nInitializing program...');
  try {
    // Build the instruction
    const ix = await (program.methods as any)
      .initialize()
      .accountsPartial({
        config: configPda,
        xpMint: xpMint.publicKey,
        authority: signer.publicKey,
        backendMinterRole: minterPda,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .instruction();

    // Build and sign transaction manually
    const tx = new Transaction().add(ix);
    tx.feePayer = signer.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    
    // Sign with both keypairs
    tx.sign(signer, xpMint);
    
    const txSig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({
      signature: txSig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    console.log('✅ Program initialized!');
    console.log('Transaction:', txSig);
    console.log('\n--- IMPORTANT: Update your .env.local ---');
    console.log(`NEXT_PUBLIC_XP_MINT=${xpMint.publicKey.toBase58()}`);
    
    // Save the new XP mint keypair
    const mintKeypairPath = path.resolve(__dirname, '../wallets/xp-mint-keypair-devnet.json');
    fs.writeFileSync(mintKeypairPath, JSON.stringify(Array.from(xpMint.secretKey)));
    console.log(`XP mint keypair saved to: ${mintKeypairPath}`);
  } catch (error) {
    console.error('Failed to initialize:', error);
    throw error;
  }
}

main().catch(console.error);
