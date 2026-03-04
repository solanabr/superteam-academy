import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { auth } from "@/lib/auth/config";
import { awardAchievement } from "@/lib/services/BackendSignerService";
import { fetchConfig } from "@/lib/solana/queries";
import { XP_MINT } from "@/lib/solana/constants";
import { checkRateLimit } from "@/lib/rate-limit";
import { ApiError, ApiErrorCode, apiErrorResponse, handleApiError } from "@/lib/api/errors";
import logger from "@/lib/logger";

const NO_STORE = "no-store";
const TIMESTAMP_MAX_AGE_MS = 5 * 60 * 1000;
const MAX_FINGERPRINTS = 10000;

const seenFingerprints = new Map<string, number>();
let _fingerprintCallCount = 0;

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) {
      throw new ApiError(ApiErrorCode.UNAUTHORIZED, "Unauthorized");
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid request body");
    }

    const {
      achievementId,
      learner,
      signature: walletSignature,
      timestamp,
    } = body as Record<string, unknown>;

    if (!achievementId || typeof achievementId !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing achievementId");
    }

    if (!learner || typeof learner !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing learner address");
    }

    if (!walletSignature || typeof walletSignature !== "string") {
      throw new ApiError(ApiErrorCode.SIGNATURE_INVALID, "Missing wallet signature");
    }

    if (typeof timestamp !== "number") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Missing or invalid timestamp");
    }

    const age = Math.abs(Date.now() - timestamp);
    if (age > TIMESTAMP_MAX_AGE_MS) {
      throw new ApiError(ApiErrorCode.SIGNATURE_INVALID, "Signature expired");
    }

    let learnerKey: PublicKey;
    try {
      learnerKey = new PublicKey(learner);
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid learner public key");
    }

    const messageParts = `superteam-academy:achievement:${achievementId}:${timestamp}`;
    const message = new TextEncoder().encode(messageParts);

    let sigBytes: Uint8Array;
    try {
      sigBytes = Uint8Array.from(Buffer.from(walletSignature, "base64"));
    } catch {
      throw new ApiError(ApiErrorCode.SIGNATURE_INVALID, "Invalid signature encoding");
    }

    let isValid: boolean;
    try {
      isValid = nacl.sign.detached.verify(message, sigBytes, learnerKey.toBytes());
    } catch {
      isValid = false;
    }
    if (!isValid) {
      throw new ApiError(ApiErrorCode.SIGNATURE_INVALID, "Wallet signature verification failed");
    }

    if (!checkRateLimit(`claim-achievement:${learner}`, 5, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    // Replay protection
    if (++_fingerprintCallCount % 100 === 0) {
      const cutoff = Date.now() - TIMESTAMP_MAX_AGE_MS;
      for (const [fp, seenAt] of seenFingerprints) {
        if (seenAt < cutoff) seenFingerprints.delete(fp);
      }
    }

    const fingerprint = `${learner}:achievement:${achievementId}:${timestamp}`;
    if (seenFingerprints.has(fingerprint)) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Duplicate request");
    }
    if (seenFingerprints.size > MAX_FINGERPRINTS) {
      seenFingerprints.clear();
    }
    seenFingerprints.set(fingerprint, Date.now());

    let xpMint = XP_MINT;
    if (!xpMint) {
      const config = await fetchConfig();
      if (!config) {
        throw new ApiError(ApiErrorCode.ON_CHAIN_ERROR, "Config not found");
      }
      xpMint = config.xpMint;
    }

    const sig = await awardAchievement(achievementId, learnerKey, xpMint);

    return NextResponse.json(
      { success: true, signature: sig },
      { headers: { "Cache-Control": NO_STORE } }
    );
  } catch (err: unknown) {
    const error = handleApiError(err);
    if (
      error.code === ApiErrorCode.INTERNAL_ERROR ||
      error.code === ApiErrorCode.TRANSACTION_FAILED ||
      error.code === ApiErrorCode.ON_CHAIN_ERROR
    ) {
      logger.error("claim-achievement error:", err);
    }
    return apiErrorResponse(error);
  }
}
