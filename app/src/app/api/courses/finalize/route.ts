import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/courses/finalize
 *
 * Backend-signed stub for finalize_course instruction.
 * In production:
 * 1. Verifies all lessons are completed via enrollment bitmap
 * 2. Builds finalize_course tx with backend signer
 * 3. Awards 50% bonus XP to learner + creator reward if threshold met
 *
 * Request body:
 *   { courseId: string, learnerWallet: string }
 *
 * Response:
 *   { signature: string, bonusXp: number, totalXp: number }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, learnerWallet } = body;

    if (!courseId || !learnerWallet) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, learnerWallet" },
        { status: 400 }
      );
    }

    const stubSignature = `stub_finalize_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;

    return NextResponse.json({
      signature: stubSignature,
      bonusXp: 500,
      totalXp: 1500,
      courseId,
    });
  } catch {
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
