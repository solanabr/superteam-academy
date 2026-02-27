/**
 * Course Finalization API Route
 * Backend-signed transaction for finalizing courses and awarding completion bonus
 *
 * POST /api/courses/finalize
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
import { fetchEnrollment, fetchCourse } from '@/lib/solana/program-client';
import { auth } from '@/lib/auth';

// Instruction discriminator for finalize_course
const FINALIZE_COURSE_DISCRIMINATOR = Buffer.from([0x23, 0x8a, 0x1c, 0x4f, 0x9b, 0x72, 0xe3, 0x01]);

interface FinalizeCourseRequest {
  courseId: string;
  learnerWallet: string;
}

interface FinalizeCourseResponse {
  success: boolean;
  signature?: string;
  completionBonus?: number;
  totalXpAwarded?: number;
  error?: string;
}

export async function POST(req: NextRequest): Promise<NextResponse<FinalizeCourseResponse>> {
  try {
    // Check authentication
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Parse request
    const body: FinalizeCourseRequest = await req.json();
    const { courseId, learnerWallet } = body;

    if (!courseId || !learnerWallet) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const learner = new PublicKey(learnerWallet);

    // Fetch course and enrollment
    const [course, enrollment] = await Promise.all([
      fetchCourse(courseId),
      fetchEnrollment(courseId, learner),
    ]);

    if (!course) {
      return NextResponse.json({ success: false, error: 'Course not found' }, { status: 404 });
    }

    if (!enrollment) {
      return NextResponse.json(
        { success: false, error: 'Not enrolled in this course' },
        { status: 400 }
      );
    }

    if (enrollment.isCompleted) {
      return NextResponse.json(
        { success: false, error: 'Course already finalized' },
        { status: 400 }
      );
    }

    // Check all lessons completed
    if (enrollment.completedLessons < enrollment.totalLessons) {
      return NextResponse.json(
        {
          success: false,
          error: `Not all lessons completed (${enrollment.completedLessons}/${enrollment.totalLessons})`,
        },
        { status: 400 }
      );
    }

    // Get backend signer
    const backendSignerSecret = process.env.BACKEND_SIGNER_SECRET_KEY;
    if (!backendSignerSecret) {
      return NextResponse.json(
        { success: false, error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const endpoint = RPC_ENDPOINTS[NETWORK as keyof typeof RPC_ENDPOINTS];
    const connection = new Connection(endpoint, 'confirmed');
    const backendSigner = Keypair.fromSecretKey(Buffer.from(JSON.parse(backendSignerSecret)));

    // Derive PDAs
    const [configPda] = deriveConfigPda();
    const [coursePda] = deriveCoursePda(courseId);
    const [enrollmentPda] = deriveEnrollmentPda(courseId, learner);
    const learnerXpAta = deriveXpTokenAccount(learner, XP_MINT);
    const creatorXpAta = deriveXpTokenAccount(course.creator, XP_MINT);

    // Create finalize_course instruction
    const instruction = new TransactionInstruction({
      keys: [
        { pubkey: configPda, isSigner: false, isWritable: false },
        { pubkey: coursePda, isSigner: false, isWritable: true },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: learner, isSigner: false, isWritable: false },
        { pubkey: learnerXpAta, isSigner: false, isWritable: true },
        { pubkey: creatorXpAta, isSigner: false, isWritable: true },
        { pubkey: course.creator, isSigner: false, isWritable: false },
        { pubkey: XP_MINT, isSigner: false, isWritable: true },
        { pubkey: backendSigner.publicKey, isSigner: true, isWritable: false },
        { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
      ],
      programId: PROGRAM_ID,
      data: FINALIZE_COURSE_DISCRIMINATOR,
    });

    // Build and send transaction
    const transaction = new Transaction().add(instruction);
    const { blockhash } = await connection.getLatestBlockhash();
    transaction.recentBlockhash = blockhash;
    transaction.feePayer = backendSigner.publicKey;

    const signature = await sendAndConfirmTransaction(connection, transaction, [backendSigner], {
      commitment: 'confirmed',
    });

    // Calculate rewards
    const totalLessonXp = course.xpPerLesson * course.lessonCount;
    const completionBonus = Math.floor(totalLessonXp / 2);
    const totalXpAwarded = totalLessonXp + completionBonus;

    console.log(
      `Course finalized: course=${courseId}, learner=${learnerWallet}, xp=${totalXpAwarded}, sig=${signature}`
    );

    return NextResponse.json({
      success: true,
      signature,
      completionBonus,
      totalXpAwarded,
    });
  } catch (error) {
    console.error('Error finalizing course:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';

    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
