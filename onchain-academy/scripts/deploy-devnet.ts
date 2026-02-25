import * as anchor from '@coral-xyz/anchor';
import { Program } from '@coral-xyz/anchor';
import { Keypair, PublicKey, SystemProgram, Connection } from '@solana/web3.js';
import * as fs from 'fs';
import * as path from 'path';

const IDL = JSON.parse(
  fs.readFileSync(path.join(__dirname, '../target/idl/onchain_academy.json'), 'utf8')
);

const PROGRAM_ID = new PublicKey('3Yr5EZrq8t4fMunuHUZoN9Q6cn4Sf6p3AFAdvWEMaxKU');
const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');

// Load authority keypair
const authorityKeypair = Keypair.fromSecretKey(
  Uint8Array.from(
    JSON.parse(fs.readFileSync(path.join(__dirname, '../wallets/signer.json'), 'utf8'))
  )
);

console.log('Authority:', authorityKeypair.publicKey.toBase58());

async function main() {
  const connection = new Connection('https://api.devnet.solana.com', 'confirmed');

  // Airdrop SOL to authority if needed
  const balance = await connection.getBalance(authorityKeypair.publicKey);
  console.log('Authority balance:', balance / 1e9, 'SOL');

  if (balance < 1e9) {
    console.log('Requesting airdrop...');
    const sig = await connection.requestAirdrop(authorityKeypair.publicKey, 2e9);
    await connection.confirmTransaction(sig, 'confirmed');
    console.log('Airdrop confirmed');
  }

  // Set up provider
  const wallet = new anchor.Wallet(authorityKeypair);
  const provider = new anchor.AnchorProvider(connection, wallet, {
    commitment: 'confirmed',
    preflightCommitment: 'confirmed',
  });
  anchor.setProvider(provider);

  const program = new Program(IDL, provider);

  // Derive Config PDA
  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from('config')],
    PROGRAM_ID
  );

  // Check if already initialized
  const configAccount = await connection.getAccountInfo(configPda);

  if (!configAccount) {
    console.log('\n=== Initializing program ===');

    // Generate XP mint keypair
    const xpMint = Keypair.generate();
    console.log('XP Mint:', xpMint.publicKey.toBase58());

    // Derive backend minter role PDA
    const [backendMinterPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('minter'), authorityKeypair.publicKey.toBytes()],
      PROGRAM_ID
    );

    const tx = await program.methods
      .initialize()
      .accounts({
        config: configPda,
        xpMint: xpMint.publicKey,
        authority: authorityKeypair.publicKey,
        backendMinterRole: backendMinterPda,
        systemProgram: SystemProgram.programId,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([authorityKeypair, xpMint])
      .rpc();

    console.log('Initialize tx:', tx);
  } else {
    console.log('Program already initialized, config PDA exists');
  }

  // Create courses
  const courses = [
    {
      courseId: 'solana-101',
      lessonCount: 12,
      difficulty: 1,
      xpPerLesson: 42, // 500 total / 12 lessons ≈ 42
      trackId: 1,
      trackLevel: 1,
      creatorRewardXp: 100,
      minCompletionsForReward: 10,
    },
    {
      courseId: 'anchor-framework',
      lessonCount: 20,
      difficulty: 2,
      xpPerLesson: 60, // 1200 total / 20 = 60
      trackId: 2,
      trackLevel: 1,
      creatorRewardXp: 200,
      minCompletionsForReward: 5,
    },
    {
      courseId: 'defi-solana',
      lessonCount: 28,
      difficulty: 3,
      xpPerLesson: 72, // 2000 total / 28 ≈ 72
      trackId: 3,
      trackLevel: 1,
      creatorRewardXp: 300,
      minCompletionsForReward: 3,
    },
    {
      courseId: 'nft-solana',
      lessonCount: 16,
      difficulty: 2,
      xpPerLesson: 63, // 1000 total / 16 ≈ 63
      trackId: 4,
      trackLevel: 1,
      creatorRewardXp: 150,
      minCompletionsForReward: 5,
    },
  ];

  for (const course of courses) {
    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from('course'), Buffer.from(course.courseId)],
      PROGRAM_ID
    );

    // Check if course already exists
    const courseAccount = await connection.getAccountInfo(coursePda);
    if (courseAccount) {
      console.log(`Course "${course.courseId}" already exists, skipping`);
      continue;
    }

    console.log(`\nCreating course: ${course.courseId}`);

    const params = {
      courseId: course.courseId,
      creator: authorityKeypair.publicKey,
      contentTxId: Array(32).fill(0) as number[], // placeholder
      lessonCount: course.lessonCount,
      difficulty: course.difficulty,
      xpPerLesson: course.xpPerLesson,
      trackId: course.trackId,
      trackLevel: course.trackLevel,
      prerequisite: null,
      creatorRewardXp: course.creatorRewardXp,
      minCompletionsForReward: course.minCompletionsForReward,
    };

    try {
      const tx = await program.methods
        .createCourse(params)
        .accounts({
          course: coursePda,
          config: configPda,
          authority: authorityKeypair.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .signers([authorityKeypair])
        .rpc();

      console.log(`  Created: ${tx}`);
    } catch (e: unknown) {
      console.error(`  Failed to create ${course.courseId}:`, (e as Error).message);
    }
  }

  console.log('\n=== Deployment complete ===');
  console.log('Program ID:', PROGRAM_ID.toBase58());
  console.log('Authority:', authorityKeypair.publicKey.toBase58());
  console.log('Config PDA:', configPda.toBase58());

  // Print course PDAs
  for (const course of courses) {
    const [pda] = PublicKey.findProgramAddressSync(
      [Buffer.from('course'), Buffer.from(course.courseId)],
      PROGRAM_ID
    );
    console.log(`Course "${course.courseId}":`, pda.toBase58());
  }
}

main().catch(console.error);
