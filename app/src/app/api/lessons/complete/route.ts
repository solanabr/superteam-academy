import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/lessons/complete
 *
 * Backend-signed stub for complete_lesson instruction.
 * In production, this endpoint:
 * 1. Validates the learner completed the lesson content (quiz passed, code tests passed)
 * 2. Builds the complete_lesson transaction with the backend signer
 * 3. Signs with the backend keypair
 * 4. Submits to Solana and returns the signature
 *
 * Request body:
 *   { courseId: string, lessonIndex: number, learnerWallet: string }
 *
 * Response:
 *   { signature: string, xpEarned: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, lessonIndex, learnerWallet } = body;

    if (!courseId || lessonIndex === undefined || !learnerWallet) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, lessonIndex, learnerWallet" },
        { status: 400 }
      );
    }

    // Stub: simulate backend-signed transaction
    const stubSignature = `stub_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return NextResponse.json({
      signature: stubSignature,
      xpEarned: 100,
      lessonIndex,
      courseId,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
