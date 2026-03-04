/**
 * Create a test course on devnet
 * 
 * Usage: npx ts-node --esm scripts/create-test-course.ts
 */
import { Connection, Keypair, PublicKey, Transaction } from '@solana/web3.js';
import { AnchorProvider, Program, type Idl } from '@coral-xyz/anchor';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PROGRAM_ID = new PublicKey('2JEFfbRwBqZB3nf5JkTGsievs43CDuGettfzBWzf94Mw');

async function main() {
  // Load signer keypair
  const signerPath = path.resolve(__dirname, '../wallets/signer.json');
  const signerSecret = JSON.parse(fs.readFileSync(signerPath, 'utf-8'));
  const signer = Keypair.fromSecretKey(Uint8Array.from(signerSecret));
  console.log('Authority:', signer.publicKey.toBase58());

  // Load IDL
  const idlPath = path.resolve(__dirname, '../target/idl/academy.json');
  const idl = JSON.parse(fs.readFileSync(idlPath, 'utf-8'));

  // Connection
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Create provider
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: signer.publicKey,
      signAllTransactions: async (txs) => txs,
      signTransaction: async (tx) => tx,
    },
    { commitment: 'confirmed' }
  );

  const normalizedIdl = { ...idl, address: PROGRAM_ID.toBase58() };
  const program = new Program(normalizedIdl as Idl, provider);

  // Config PDA
  const [configPda] = PublicKey.findProgramAddressSync([Buffer.from('config')], PROGRAM_ID);

  // Test course params
  const courseId = 'solana-basics-101';
  const [coursePda] = PublicKey.findProgramAddressSync(
    [Buffer.from('course'), Buffer.from(courseId)],
    PROGRAM_ID
  );
  console.log('Course PDA:', coursePda.toBase58());

  // Check if course already exists
  const courseInfo = await connection.getAccountInfo(coursePda);
  if (courseInfo) {
    console.log('Course already exists!');
    return;
  }

  const params = {
    courseId: courseId,
    creator: signer.publicKey,
    contentTxId: new Array(32).fill(0), // placeholder
    lessonCount: 5,
    difficulty: 1, // beginner
    xpPerLesson: 100,
    trackId: 1,
    trackLevel: 1,
    prerequisite: null,
    creatorRewardXp: 50,
    minCompletionsForReward: 10,
  };

  console.log('\nCreating course:', courseId);
  try {
    const ix = await (program.methods as any)
      .createCourse(params)
      .accountsPartial({
        course: coursePda,
        config: configPda,
        authority: signer.publicKey,
        systemProgram: new PublicKey('11111111111111111111111111111111'),
      })
      .instruction();

    const tx = new Transaction().add(ix);
    tx.feePayer = signer.publicKey;
    const latestBlockhash = await connection.getLatestBlockhash();
    tx.recentBlockhash = latestBlockhash.blockhash;
    tx.sign(signer);

    const txSig = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({
      signature: txSig,
      blockhash: latestBlockhash.blockhash,
      lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
    });

    console.log('✅ Course created!');
    console.log('Transaction:', txSig);
    console.log('Course PDA:', coursePda.toBase58());
    console.log('Course ID:', courseId);
  } catch (error) {
    console.error('Failed to create course:', error);
    throw error;
  }
}

main().catch(console.error);
