import { NextResponse } from 'next/server';
import {
  TransactionMessage,
  VersionedTransaction,
} from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import {
  getBackendSigner,
  getServerConnection,
} from '@/lib/solana/server/signer';
import { checkRateLimit } from '@/lib/solana/server/rate-limit';
import {
  validateRequest,
  isErrorResponse,
} from '@/lib/solana/server/validate';
import { configPda, coursePda, enrollmentPda } from '@/lib/solana/pda';
import {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
} from '@/lib/solana/constants';
import { createHash } from 'crypto';

/**
 * POST /api/lessons/complete
 *
 * Marks a lesson as completed for an enrolled learner. The backend signer
 * co-signs the transaction to prevent client-side cheating. XP is minted
 * to the learner's Token-2022 ATA on success.
 *
 * Body: { wallet: string, courseId: string, lessonIndex: number }
 */

const COMPLETE_LESSON_DISCRIMINATOR = Buffer.from(
  createHash('sha256')
    .update('global:complete_lesson')
    .digest()
    .subarray(0, 8),
);

export async function POST(request: Request) {
  const validated = await validateRequest(request);
  if (isErrorResponse(validated)) return validated;

  const { wallet, body } = validated;
  const { courseId, lessonIndex } = body as {
    courseId: string;
    lessonIndex: number;
  };

  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
  }
  if (
    typeof lessonIndex !== 'number' ||
    !Number.isInteger(lessonIndex) ||
    lessonIndex < 0 ||
    lessonIndex > 255
  ) {
    return NextResponse.json(
      { error: 'Invalid lessonIndex' },
      { status: 400 },
    );
  }

  const rateCheck = checkRateLimit(wallet.toBase58());
  if (!rateCheck.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: rateCheck.retryAfter },
      { status: 429 },
    );
  }

  try {
    const connection = getServerConnection();
    const backendSigner = getBackendSigner();
    const [config] = configPda();
    const [course] = coursePda(courseId);
    const [enrollment] = enrollmentPda(courseId, wallet);
    const learnerXpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    // Build instruction data: discriminator + lessonIndex (u16 LE)
    const data = Buffer.alloc(COMPLETE_LESSON_DISCRIMINATOR.length + 2);
    COMPLETE_LESSON_DISCRIMINATOR.copy(data);
    data.writeUInt16LE(lessonIndex, COMPLETE_LESSON_DISCRIMINATOR.length);

    const keys = [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: wallet, isSigner: false, isWritable: false },
      { pubkey: learnerXpAta, isSigner: false, isWritable: true },
      { pubkey: XP_MINT, isSigner: false, isWritable: true },
      {
        pubkey: backendSigner.publicKey,
        isSigner: true,
        isWritable: true,
      },
      {
        pubkey: TOKEN_2022_PROGRAM_ID,
        isSigner: false,
        isWritable: false,
      },
    ];

    const instruction = { keys, programId: PROGRAM_ID, data };
    const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();

    const messageV0 = new TransactionMessage({
      payerKey: backendSigner.publicKey,
      recentBlockhash: blockhash,
      instructions: [instruction],
    }).compileToV0Message();

    const tx = new VersionedTransaction(messageV0);
    tx.sign([backendSigner]);

    const signature = await connection.sendRawTransaction(tx.serialize());
    await connection.confirmTransaction({ signature, blockhash, lastValidBlockHeight }, 'confirmed');

    return NextResponse.json({ signature, lessonIndex, courseId });
  } catch (err: unknown) {
    const anchorError = err as { error?: { errorCode?: { code?: string } } };
    const errorCode = anchorError?.error?.errorCode?.code;

    if (errorCode === 'LessonAlreadyCompleted') {
      return NextResponse.json(
        { error: 'Lesson already completed' },
        { status: 409 },
      );
    }
    if (errorCode === 'LessonOutOfBounds') {
      return NextResponse.json(
        { error: 'Invalid lesson index' },
        { status: 400 },
      );
    }

    console.error('complete_lesson failed:', err);
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 },
    );
  }
}
