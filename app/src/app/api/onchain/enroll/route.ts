import type { EnrollBridgeRequest } from "@/lib/onchain/bridge-types";
import {
  badRequest,
  buildCourseAccountHints,
  notYetImplemented,
  parseBridgeJson,
  requireAuthenticatedBridgeContext,
  requireBridgeCourseId,
} from "@/lib/onchain/server-bridge";

export async function POST(request: Request) {
  const action = "enroll" as const;
  const { ctx, error } = await requireAuthenticatedBridgeContext(action);
  if (error || !ctx) return error;

  const { payload, error: payloadError } =
    await parseBridgeJson<EnrollBridgeRequest>(request, action);
  if (payloadError || !payload) return payloadError;

  const courseIdResult = requireBridgeCourseId(payload.courseId);
  if (courseIdResult.error || courseIdResult.value === undefined) {
    return badRequest(action, courseIdResult.error || "courseId is required.");
  }

  const accountHints = buildCourseAccountHints(
    ctx.learnerWallet,
    courseIdResult.value
  );

  return notYetImplemented(action, accountHints, "learner");
}
