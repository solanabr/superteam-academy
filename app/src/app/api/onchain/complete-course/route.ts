import type { FinalizeCourseBridgeRequest } from "@/lib/onchain/bridge-types";
import { normalizeBackendBridgeError, submitCompleteCourseTx } from "@/lib/onchain/backend-tx";
import {
  badRequest,
  parseBridgeJson,
  requireAuthenticatedBridgeContext,
  requireBackendSigner,
  requireBridgeCourseId,
} from "@/lib/onchain/server-bridge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const action = "complete_course" as const;
  const { ctx, error } = await requireAuthenticatedBridgeContext(action);
  if (error || !ctx) return error;

  const { payload, error: payloadError } =
    await parseBridgeJson<FinalizeCourseBridgeRequest>(request, action);
  if (payloadError || !payload) return payloadError;

  const courseIdResult = requireBridgeCourseId(payload.courseId);
  if (courseIdResult.error || courseIdResult.value === undefined) {
    return badRequest(action, courseIdResult.error || "courseId is required.");
  }

  const { signer, error: signerError } = requireBackendSigner(action);
  if (signerError || !signer) {
    return signerError;
  }

  try {
    const tx = await submitCompleteCourseTx({
      courseId: courseIdResult.value,
      learner: ctx.learnerWallet,
      backendSigner: signer,
    });

    return NextResponse.json({
      ok: true,
      action,
      code: "TX_SUBMITTED",
      message: "complete_course transaction submitted on-chain.",
      signature: tx.signature,
      accountHints: tx.accountHints,
    });
  } catch (error) {
    const normalized = normalizeBackendBridgeError(error);
    return NextResponse.json(
      {
        ok: false,
        action,
        code: normalized.code,
        message: normalized.message,
      },
      { status: normalized.status }
    );
  }
}
