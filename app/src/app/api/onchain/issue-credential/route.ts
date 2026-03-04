import type { IssueCredentialBridgeRequest } from "@/lib/onchain/bridge-types";
import { normalizeBackendBridgeError, submitIssueCredentialTx } from "@/lib/onchain/backend-tx";
import {
  badRequest,
  parseBridgeJson,
  requireAuthenticatedBridgeContext,
  requireBackendSigner,
  requireBridgeCourseId,
} from "@/lib/onchain/server-bridge";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const action = "issue_credential" as const;
  const { ctx, error } = await requireAuthenticatedBridgeContext(action);
  if (error || !ctx) return error;

  const { payload, error: payloadError } =
    await parseBridgeJson<IssueCredentialBridgeRequest>(request, action);
  if (payloadError || !payload) return payloadError;

  const courseIdResult = requireBridgeCourseId(payload.courseId);
  if (courseIdResult.error || courseIdResult.value === undefined) {
    return badRequest(action, courseIdResult.error || "courseId is required.");
  }
  if (!payload.metadataUri || typeof payload.metadataUri !== "string") {
    return badRequest(action, "metadataUri is required.");
  }
  try {
    // Require an absolute URL for metadata location.
    new URL(payload.metadataUri);
  } catch {
    return badRequest(action, "metadataUri must be a valid absolute URL.");
  }

  const coursesCompleted = payload.coursesCompleted ?? 1;
  if (!Number.isInteger(coursesCompleted) || coursesCompleted < 0) {
    return badRequest(action, "coursesCompleted must be a non-negative integer.");
  }

  const totalXp = payload.totalXp ?? 0;
  if (!Number.isInteger(totalXp) || totalXp < 0) {
    return badRequest(action, "totalXp must be a non-negative integer.");
  }

  const credentialName =
    typeof payload.credentialName === "string" && payload.credentialName.trim()
      ? payload.credentialName.trim()
      : `Caminho Credential ${courseIdResult.value}`;

  const { signer, error: signerError } = requireBackendSigner(action);
  if (signerError || !signer) {
    return signerError;
  }

  try {
    const tx = await submitIssueCredentialTx({
      courseId: courseIdResult.value,
      learner: ctx.learnerWallet,
      backendSigner: signer,
      metadataUri: payload.metadataUri,
      credentialName,
      coursesCompleted,
      totalXp,
      trackCollection: payload.trackCollection,
    });

    return NextResponse.json({
      ok: true,
      action,
      code: "TX_SUBMITTED",
      message: "issue_credential transaction submitted on-chain.",
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
