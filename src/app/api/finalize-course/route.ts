import { NextRequest, NextResponse } from "next/server";
import type { ActionProof } from "@/lib/action-proof";
import {
  requireSameOrigin,
  verifyWalletActionProof,
} from "@/lib/server/request-security";

interface FinalizeCourseRequest {
  learner: string;
  courseId: string;
  proof?: ActionProof;
}

/**
 * POST /api/finalize-course
 *
 * Stub mode: validates request shape, returns bonus XP preview.
 *   No TX built — learner calls this to signal "I want to finalize".
 *   Idempotent: repeat calls return success.
 *
 * On-chain mode (future): validate enrollment.completedAt is null,
 *   all lessons complete, build finalize_course() TX, return signature.
 *   See docs/FUTURE_ONCHAIN_WIRING.md for wiring points.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  const sameOriginError = requireSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  let body: Partial<FinalizeCourseRequest>;
  try {
    body = (await req.json()) as Partial<FinalizeCourseRequest>;
  } catch {
    return NextResponse.json(
      { mode: "stub", error: "Invalid request body" },
      { status: 400 },
    );
  }

  const { learner, courseId } = body;
  if (!learner || !courseId) {
    return NextResponse.json(
      { mode: "stub", error: "Missing learner or courseId" },
      { status: 400 },
    );
  }

  const proofValid = verifyWalletActionProof({
    proof: body.proof,
    action: "finalize_course",
    learner,
    courseId,
  });
  if (!proofValid) {
    return NextResponse.json(
      { mode: "stub", error: "UNAUTHORIZED_ACTION" },
      { status: 401 },
    );
  }

  const signerEnv = process.env.BACKEND_SIGNER_KEYPAIR;
  const isStub = !signerEnv || signerEnv === "YOUR_KEYPAIR_HERE";

  if (isStub) {
    // Stub: return a preview bonus XP (50% of typical lesson XP × 3 lessons)
    // Real value would come from the on-chain course account
    return NextResponse.json({ mode: "stub", bonusXp: 15, txSignature: null });
  }

  // ── On-chain path (future) ─────────────────────────────────────────────────
  // TODO: wire when backend signer is available
  // 1. Parse BACKEND_SIGNER_KEYPAIR → Keypair
  // 2. getEnrollmentPda(courseId, learner) → fetchNullable
  // 3. if !enrollment → 404
  // 4. if enrollment.completedAt !== null → 409 ALREADY_FINALIZED
  // 5. Check bitmap popcount === course.lessonCount
  // 6. Ensure creator XP ATA exists
  // 7. Build + sign finalize_course() TX via raw instruction
  // 8. Return { mode: "onchain", bonusXp, txSignature }
  // See docs/INTEGRATION.md §finalize_course for instruction spec

  return NextResponse.json({ mode: "stub", bonusXp: 15, txSignature: null });
}
