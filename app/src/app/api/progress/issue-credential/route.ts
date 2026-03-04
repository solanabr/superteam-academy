import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { auth } from "@/lib/auth/config";
import { issueCredential } from "@/lib/services/BackendSignerService";
import { fetchCourse, fetchEnrollment } from "@/lib/solana/queries";
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
      courseId,
      learner,
      trackCollection: trackCollectionStr,
      credentialName,
      metadataUri,
      coursesCompleted,
      totalXp,
      signature: walletSignature,
      timestamp,
    } = body as Record<string, unknown>;

    if (
      !courseId ||
      typeof courseId !== "string" ||
      courseId.length > 64 ||
      !/^[a-zA-Z0-9-]+$/.test(courseId)
    ) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing courseId");
    }

    if (!learner || typeof learner !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing learner address");
    }

    if (!trackCollectionStr || typeof trackCollectionStr !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing trackCollection");
    }

    if (!credentialName || typeof credentialName !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing credentialName");
    }

    if (!metadataUri || typeof metadataUri !== "string") {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing metadataUri");
    }

    if (typeof coursesCompleted !== "number" || !Number.isInteger(coursesCompleted) || coursesCompleted < 1) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing coursesCompleted");
    }

    if (typeof totalXp !== "number" || !Number.isInteger(totalXp) || totalXp < 0) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid or missing totalXp");
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

    let trackCollectionKey: PublicKey;
    try {
      trackCollectionKey = new PublicKey(trackCollectionStr);
    } catch {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Invalid trackCollection public key");
    }

    const messageParts = `superteam-academy:issue-credential:${courseId}:${timestamp}`;
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

    if (!checkRateLimit(`issue-credential:${learner}`, 5, 60_000)) {
      throw new ApiError(ApiErrorCode.RATE_LIMITED, "Too many requests");
    }

    // Replay protection
    if (++_fingerprintCallCount % 100 === 0) {
      const cutoff = Date.now() - TIMESTAMP_MAX_AGE_MS;
      for (const [fp, seenAt] of seenFingerprints) {
        if (seenAt < cutoff) seenFingerprints.delete(fp);
      }
    }

    const fingerprint = `${learner}:issue-credential:${courseId}:${timestamp}`;
    if (seenFingerprints.has(fingerprint)) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Duplicate request");
    }
    if (seenFingerprints.size > MAX_FINGERPRINTS) {
      seenFingerprints.clear();
    }
    seenFingerprints.set(fingerprint, Date.now());

    // Verify course is finalized: enrollment must have completedAt set
    const [course, enrollment] = await Promise.all([
      fetchCourse(courseId),
      fetchEnrollment(courseId, learnerKey),
    ]);

    if (!course) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, "Course not found");
    }

    if (!enrollment) {
      throw new ApiError(ApiErrorCode.NOT_FOUND, "Enrollment not found");
    }

    if (!enrollment.completedAt) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Course not yet finalized");
    }

    if (enrollment.credentialAsset) {
      throw new ApiError(ApiErrorCode.INVALID_INPUT, "Credential already issued for this enrollment");
    }

    const result = await issueCredential(
      learnerKey,
      courseId,
      trackCollectionKey,
      credentialName,
      metadataUri,
      coursesCompleted,
      BigInt(Math.round(totalXp))
    );

    return NextResponse.json(
      { success: true, signature: result.signature, credentialAsset: result.credentialAsset },
      { headers: { "Cache-Control": NO_STORE } }
    );
  } catch (err: unknown) {
    const error = handleApiError(err);
    if (
      error.code === ApiErrorCode.INTERNAL_ERROR ||
      error.code === ApiErrorCode.TRANSACTION_FAILED ||
      error.code === ApiErrorCode.ON_CHAIN_ERROR
    ) {
      logger.error("issue-credential error:", err);
    }
    return apiErrorResponse(error);
  }
}
