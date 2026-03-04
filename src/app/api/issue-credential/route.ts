import { NextRequest, NextResponse } from "next/server";
import type { ActionProof } from "@/lib/action-proof";
import {
  requireSameOrigin,
  verifyWalletActionProof,
} from "@/lib/server/request-security";

interface IssueCredentialRequest {
  learner: string;
  courseId: string;
  proof?: ActionProof;
}

/**
 * POST /api/issue-credential
 *
 * Stub mode: generates a deterministic local credential ID.
 *   No TX built. Idempotent.
 *
 * On-chain mode (future): validate enrollment.completedAt set,
 *   build issue_credential() or upgrade_credential() TX, return asset pubkey.
 *   See docs/FUTURE_ONCHAIN_WIRING.md for wiring points.
 */
export async function POST(
  req: NextRequest,
): Promise<NextResponse> {
  const sameOriginError = requireSameOrigin(req);
  if (sameOriginError) return sameOriginError;

  let body: Partial<IssueCredentialRequest>;
  try {
    body = (await req.json()) as Partial<IssueCredentialRequest>;
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
    action: "issue_credential",
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
    // Deterministic stub ID — same wallet + course always gets the same ID
    const stubId = `stub-${courseId}-${learner.slice(0, 8)}`;
    return NextResponse.json({
      mode: "stub",
      credentialId: stubId,
      txSignature: null,
      explorerUrl: null,
    });
  }

  // ── On-chain path (future) ─────────────────────────────────────────────────
  // TODO: wire when backend signer is available
  // 1. Parse BACKEND_SIGNER_KEYPAIR → Keypair
  // 2. getEnrollmentPda(courseId, learner) → fetchNullable
  // 3. if !enrollment → 404
  // 4. if !enrollment.completedAt → 400 NOT_FINALIZED
  // 5. if enrollment.credentialAsset → 409 with existing pubkey (idempotent)
  // 6. Generate credential Keypair
  // 7. Fetch XP balance + count courses for attributes
  // 8. Build metadata URI (Arweave placeholder for devnet)
  // 9. Build issue_credential() or upgrade_credential() TX
  // 10. Return { mode: "onchain", credentialId, txSignature, explorerUrl }
  // See docs/INTEGRATION.md §issue_credential for instruction spec

  return NextResponse.json({
    mode: "stub",
    credentialId: `stub-${courseId}-${learner.slice(0, 8)}`,
    txSignature: null,
    explorerUrl: null,
  });
}
