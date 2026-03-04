import { NextResponse } from "next/server";
import type { ClaimAchievementBridgeRequest } from "@/lib/onchain/bridge-types";
import {
  normalizeBackendBridgeError,
  submitAwardAchievementTx,
} from "@/lib/onchain/backend-tx";
import {
  badRequest,
  parseBridgeJson,
  requireAuthenticatedBridgeContext,
  requireBackendSigner,
} from "@/lib/onchain/server-bridge";

export async function POST(request: Request) {
  const action = "claim_achievement" as const;
  const { ctx, error } = await requireAuthenticatedBridgeContext(action);
  if (error || !ctx) return error;

  const { payload, error: payloadError } =
    await parseBridgeJson<ClaimAchievementBridgeRequest>(request, action);
  if (payloadError || !payload) return payloadError;

  const rawAchievementId = payload.achievementId;
  const parsedAchievementId =
    typeof rawAchievementId === "string"
      ? rawAchievementId.trim()
      : Number.isInteger(rawAchievementId) && Number(rawAchievementId) >= 0
      ? String(rawAchievementId)
      : "";

  if (!parsedAchievementId) {
    return badRequest(
      action,
      "achievementId is required and must be a non-empty string or non-negative integer."
    );
  }
  if (Buffer.byteLength(parsedAchievementId, "utf8") > 32) {
    return badRequest(
      action,
      "achievementId must be 32 bytes or fewer for PDA seed compatibility."
    );
  }

  const { signer, error: signerError } = requireBackendSigner(action);
  if (signerError) {
    return signerError;
  }

  try {
    const submitted = await submitAwardAchievementTx({
      achievementId: parsedAchievementId,
      recipient: ctx.learnerWallet,
      backendSigner: signer!,
    });

    return NextResponse.json(
      {
        ok: true,
        action,
        code: "TX_SUBMITTED",
        message: `${action} submitted to devnet.`,
        signature: submitted.signature,
        accountHints: {
          ...submitted.accountHints,
          achievementId: parsedAchievementId,
        },
      },
      { status: 200 }
    );
  } catch (submitError) {
    const normalized = normalizeBackendBridgeError(submitError);
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
