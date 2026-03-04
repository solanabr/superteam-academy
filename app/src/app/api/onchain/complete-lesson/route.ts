import type { CompleteLessonBridgeRequest } from "@/lib/onchain/bridge-types";
import { normalizeBackendBridgeError, submitCompleteLessonTx } from "@/lib/onchain/backend-tx";
import {
  badRequest,
  parseBridgeJson,
  requireAuthenticatedBridgeContext,
  requireBackendSigner,
  requireBridgeCourseId,
  requireBridgeNumber,
} from "@/lib/onchain/server-bridge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  // Keep aligned with frontend/local service number-safe bitmap handling.
  const MAX_LESSON_BITMAP_INDEX = 52;
  const action = "complete_lesson" as const;
  const { ctx, error } = await requireAuthenticatedBridgeContext(action);
  if (error || !ctx) return error;

  const { payload, error: payloadError } =
    await parseBridgeJson<CompleteLessonBridgeRequest>(request, action);
  if (payloadError || !payload) return payloadError;

  const courseIdResult = requireBridgeCourseId(payload.courseId);
  if (courseIdResult.error || courseIdResult.value === undefined) {
    return badRequest(action, courseIdResult.error || "courseId is required.");
  }

  const lessonIndexResult = requireBridgeNumber(
    payload.lessonIndex,
    "lessonIndex"
  );
  if (lessonIndexResult.error || lessonIndexResult.value === undefined) {
    return badRequest(
      action,
      lessonIndexResult.error || "lessonIndex is required."
    );
  }
  if (lessonIndexResult.value > MAX_LESSON_BITMAP_INDEX) {
    return badRequest(
      action,
      `lessonIndex must be <= ${MAX_LESSON_BITMAP_INDEX}.`
    );
  }

  if (payload.xpAmount !== undefined) {
    const xpAmountResult = requireBridgeNumber(payload.xpAmount, "xpAmount");
    if (xpAmountResult.error || xpAmountResult.value === undefined) {
      return badRequest(action, xpAmountResult.error || "xpAmount is invalid.");
    }
  }

  const { signer, error: signerError } = requireBackendSigner(action);
  if (signerError || !signer) {
    return signerError;
  }

  try {
    const tx = await submitCompleteLessonTx({
      courseId: courseIdResult.value,
      learner: ctx.learnerWallet,
      lessonIndex: lessonIndexResult.value,
      backendSigner: signer,
    });

    return NextResponse.json({
      ok: true,
      action,
      code: "TX_SUBMITTED",
      message: "complete_lesson transaction submitted on-chain.",
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
