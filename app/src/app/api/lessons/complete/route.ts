/**
 * Lesson Completion API Route
 * Backend-signed transaction for completing lessons and awarding XP
 *
 * POST /api/lessons/complete
 *
 * The backend validates quiz/content completion off-chain, then signs
 * the complete_lesson transaction as the backend_signer.
 */
import { NextRequest, NextResponse } from 'next/server';
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import {
  PROGRAM_ID,
  XP_MINT,
  TOKEN_2022_PROGRAM_ID,
  RPC_ENDPOINTS,
  NETWORK,
} from '@/lib/solana/program-config';
import {
  deriveConfigPda,
  deriveCoursePda,
  deriveEnrollmentPda,
  deriveXpTokenAccount,
} from '@/lib/solana/pda';
import { fetchEnrollment, isLessonCompleted } from '@/lib/solana/program-client';
import { auth } from '@/lib/auth';

// Instruction discriminator for complete_lesson
const COMPLETE_LESSON_DISCRIMINATOR = Buffer.from([0x17, 0x35, 0x8a, 0x9e, 0xd2, 0x01, 0x88, 0x5f]);

interface CompleteLessonRequest {
  courseId: string;
  lessonIndex: number;
  learnerWallet: string;
  // Validation proof (could be quiz answers hash, completion token, etc.)
  validationProof?: string;
}

interface CompleteLessonResponse {
  success: boolean;
  signature?: string;
  xpAwarded?: number;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<CompleteLessonResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: CompleteLessonRequest = await req.json();
    const { courseId, lessonIndex, learnerWallet, validationProof } = body;

    // Validate inputs
    if (!courseId || lessonIndex === undefined || !learnerWallet) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const learner = new PublicKey(learnerWallet);

    // Check enrollment exists and lesson not already completed
    const enrollment = await fetchEnrollment(courseId, learner);
    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    if (enrollment.isCompleted) {
      return NextResponse.json(
        { success: false, error: 'Course already completed' },
        { status: 400 }
      );
    }

    if (isLessonCompleted(enrollment.lessonFlags, lessonIndex)) {
      return NextResponse.json(
        { success: false, error: 'Lesson already completed' },
        { status: 400 }
      );
    }

    // TODO: Validate completion proof (quiz answers, time spent, etc.)
    // This is where anti-cheat logic would go
    if (validationProof) {
      // Validate proof...
    }

    // Get backend signer from environment
    const backendSignerSecret = process.env.BACKEND_SIGNER_SECRET_KEY;
    if (!backendSignerSecret) {
      console.error('BACKEND_SIGNER_SECRET_KEY not configured');
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    // Create connection
    const endpoint = RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS];
    const connection = new Connection(endpoint, 'confirmed');

    // Parse backend signer keypair
    const backendSigner = Keypair.fromSecretKey(Buffer.from(JSON.parse(backendSignerSecret)));

    // Derive PDAs
    const [configPda] = deriveConfigPda();
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
    const learnerXpAta = deriveXpTokenAccount(learner, XP_MINT);

    // Create complete_lesson instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: coursePda, isSigner: false, isWritable: false },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: learner, isSigner: false, isWritable: false },
        { pubkey: learnerXpAta, isSigner: false, isWritable: true },
        { pubkey: XP_MINT, isSigner: false, isWritable: true },
        { pubkey: backendSigner.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: Buffer.concat([
        COMPLETE_LESSON_DISCRIMINATOR,
        Buffer.from([lessonIndex]), // u8 lesson_index
      ]),
    });

    // Build and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = backendSigner.publicKey;

    // Sign and send
    const signature = await sendAndConfirmTransaction(connection, transaction, [backendSigner], {
      commitment: 'confirmed',
    });

    // Log completion for analytics
    console.log(
      `Lesson completed: course=${courseId}, lesson=${lessonIndex}, learner=${learnerWallet}, sig=${signature}`
    );

    return NextResponse.json({
      success: true,
      signature,
      xpAwarded: 100, // This would come from course.xp_per_lesson
    });
  } catch (error) {
    console.error('Error completing lesson:', error);

    // Parse Anchor error if applicable
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
