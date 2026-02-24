import { NextResponse } from 'next/server';
import {
  PublicKey,
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
 * POST /api/courses/finalize
 *
 * Finalizes a learner's course enrollment after all lessons are completed.
 * Mints bonus XP to the learner and (if threshold met) creator reward XP.
 * Backend signer co-signs to authorize the finalization.
 *
 * Body: { wallet: string, courseId: string }
 */

const FINALIZE_COURSE_DISCRIMINATOR = Buffer.from(
  createHash('sha256')
    .update('global:finalize_course')
    .digest()
    .subarray(0, 8),
);

/**
 * Extracts the creator PublicKey from a raw Course account buffer.
 *
 * Anchor account layout:
 *   [0..8]   discriminator
 *   [8..12]  courseId string length (u32 LE)
 *   [12..12+len] courseId bytes
 *   [12+len..12+len+32] creator pubkey
 */
function extractCreatorFromCourseData(
  data: Buffer,
  courseId: string,
): PublicKey {
  const DISCRIMINATOR_SIZE = 8;
  const STRING_LEN_SIZE = 4;
  const courseIdLen = Buffer.from(courseId).length;
  const creatorOffset = DISCRIMINATOR_SIZE + STRING_LEN_SIZE + courseIdLen;
  const creatorBytes = data.subarray(creatorOffset, creatorOffset + 32);

  if (creatorBytes.length !== 32) {
    throw new Error('Failed to extract creator from course account data');
  }

  return new PublicKey(creatorBytes);
}

export async function POST(request: Request) {
  const validated = await validateRequest(request);
  if (isErrorResponse(validated)) return validated;

  const { wallet, body } = validated;
  const { courseId } = body as { courseId: string };

  if (!courseId || typeof courseId !== 'string') {
    return NextResponse.json({ error: 'Missing courseId' }, { status: 400 });
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

    // Fetch the course account to extract the creator pubkey
    const courseAccountInfo = await connection.getAccountInfo(course);
    if (!courseAccountInfo || !courseAccountInfo.owner.equals(PROGRAM_ID)) {
      return NextResponse.json(
        { error: 'Course not found' },
        { status: 404 },
      );
    }

    const creator = extractCreatorFromCourseData(
      courseAccountInfo.data as Buffer,
      courseId,
    );

    const learnerXpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      false,
      TOKEN_2022_PROGRAM_ID,
    );
    const creatorXpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      creator,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    // Instruction data: discriminator only (no additional args)
    const data = Buffer.from(FINALIZE_COURSE_DISCRIMINATOR);

    const keys = [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: wallet, isSigner: false, isWritable: false },
      { pubkey: learnerXpAta, isSigner: false, isWritable: true },
      { pubkey: creatorXpAta, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: false, isWritable: false },
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

    return NextResponse.json({ signature, courseId });
  } catch (err: unknown) {
    const anchorError = err as { error?: { errorCode?: { code?: string } } };
    const errorCode = anchorError?.error?.errorCode?.code;

    if (errorCode === 'CourseNotCompleted') {
      return NextResponse.json(
        { error: 'Not all lessons completed' },
        { status: 400 },
      );
    }
    if (errorCode === 'AlreadyFinalized') {
      return NextResponse.json(
        { error: 'Course already finalized' },
        { status: 409 },
      );
    }

    console.error('finalize_course failed:', err);
    return NextResponse.json(
      { error: 'Transaction failed' },
      { status: 500 },
    );
  }
}
