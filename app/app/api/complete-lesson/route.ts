import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
} from '@solana/web3.js';
import { AnchorProvider, Program, Wallet } from '@coral-xyz/anchor';
import IDL from '@/lib/idl/onchain_academy.json';
import {
  PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
  getConfigPDA,
  getCoursePDA,
  getEnrollmentPDA,
} from '@/lib/solana-program';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, lessonIndex, learner: learnerStr } = body;

    if (!courseId || lessonIndex === undefined || !learnerStr) {
      return NextResponse.json(
        { error: 'Missing required fields: courseId, lessonIndex, learner' },
        { status: 400 }
      );
    }

    // Load backend signer from environment
    const signerSecret = process.env.BACKEND_SIGNER_SECRET;
    if (!signerSecret) {
      return NextResponse.json(
        { error: 'Backend signer not configured' },
        { status: 500 }
      );
    }

    const backendSigner = Keypair.fromSecretKey(
      Uint8Array.from(JSON.parse(signerSecret))
    );

    const learner = new PublicKey(learnerStr);
    const connection = new Connection(
      process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.devnet.solana.com',
      'confirmed'
    );

    const provider = new AnchorProvider(
      connection,
      new Wallet(backendSigner),
      { commitment: 'confirmed' }
    );

    const program = new Program(IDL as never, provider);
    const configPDA = getConfigPDA();
    const coursePDA = getCoursePDA(courseId);
    const enrollmentPDA = getEnrollmentPDA(courseId, learner);

    // Fetch config to get XP mint
    const configAccount = await connection.getAccountInfo(configPDA);
    if (!configAccount) {
      return NextResponse.json(
        { error: 'Program not initialized' },
        { status: 500 }
      );
    }

    // Decode XP mint from config (offset 72-104 after 8-byte discriminator)
    const xpMint = new PublicKey(configAccount.data.slice(72, 104));

    // Derive learner's Token-2022 ATA
    const [learnerAta] = PublicKey.findProgramAddressSync(
      [learner.toBytes(), TOKEN_2022_PROGRAM_ID.toBytes(), xpMint.toBytes()],
      ASSOCIATED_TOKEN_PROGRAM_ID
    );

    const signature = await (program.methods as never as {
      completeLesson: (idx: number) => {
        accounts: (a: Record<string, PublicKey>) => {
          signers: (s: Keypair[]) => { rpc: () => Promise<string> };
        };
      };
    })
      .completeLesson(lessonIndex)
      .accounts({
        config: configPDA,
        course: coursePDA,
        enrollment: enrollmentPDA,
        learner,
        learnerTokenAccount: learnerAta,
        xpMint,
        backendSigner: backendSigner.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([backendSigner])
      .rpc();

    return NextResponse.json({ signature, explorer: `https://explorer.solana.com/tx/${signature}?cluster=devnet` });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
