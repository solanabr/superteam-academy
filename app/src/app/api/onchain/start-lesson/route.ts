import { NextResponse } from "next/server";
import type { StartLessonBridgeRequest } from "@/lib/onchain/bridge-types";
import {
  badRequest,
  buildCourseAccountHints,
  parseBridgeJson,
  requireAuthenticatedBridgeContext,
  requireBridgeCourseId,
  requireBridgeNumber,
} from "@/lib/onchain/server-bridge";

export async function POST(request: Request) {
  const action = "start_lesson" as const;
  const { ctx, error } = await requireAuthenticatedBridgeContext(action);
  if (error || !ctx) return error;

  const { payload, error: payloadError } =
    await parseBridgeJson<StartLessonBridgeRequest>(request, action);
  if (payloadError || !payload) return payloadError;

  const courseIdResult = requireBridgeCourseId(payload.courseId);
  if (courseIdResult.error || courseIdResult.value === undefined) {
    return badRequest(action, courseIdResult.error || "courseId is required.");
  }

  const lessonIndexResult = requireBridgeNumber(payload.lessonIndex, "lessonIndex");
  if (lessonIndexResult.error || lessonIndexResult.value === undefined) {
    return badRequest(
      action,
      lessonIndexResult.error || "lessonIndex is required."
    );
  }

  const accountHints = {
    ...buildCourseAccountHints(ctx.learnerWallet, courseIdResult.value),
    lessonIndex: String(lessonIndexResult.value),
  };

  return NextResponse.json(
    {
      ok: true,
      action,
      code: "OFFCHAIN_ONLY_ACKNOWLEDGED",
      message:
        "start_lesson acknowledged. The current on-chain program does not expose a start_lesson instruction, so this action is tracked off-chain.",
      accountHints,
    },
    { status: 200 }
  );
}
