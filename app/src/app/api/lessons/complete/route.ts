import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/lessons/complete
 *
 * Backend-signed lesson completion stub.
 * In production: validates session/wallet, calls complete_lesson with backend keypair.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as { courseId?: string; lessonIndex?: number };
    const { courseId, lessonIndex } = body;

    if (!courseId || lessonIndex === undefined) {
      return NextResponse.json(
        { error: "Missing courseId or lessonIndex" },
        { status: 400 }
      );
    }

    // TODO: Verify user session / wallet signature
    // TODO: Load backend keypair from environment
    // TODO: Build and submit complete_lesson transaction
    // TODO: Return real transaction signature

    // Stub response — returns a mock signature for frontend development
    const mockSignature = `mock_${courseId}_lesson${lessonIndex}_${Date.now()}`;

    return NextResponse.json({
      success: true,
      signature: mockSignature,
      message: "Lesson completion stub — backend signing not yet implemented",
    });
  } catch (err) {
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
