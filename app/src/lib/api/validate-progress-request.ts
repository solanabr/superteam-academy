import { NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import nacl from "tweetnacl";
import { auth } from "@/lib/auth/config";

const TIMESTAMP_MAX_AGE_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FINGERPRINTS = 10000;

/**
 * Replay Protection for Progress Requests
 *
 * This module uses an in-memory `seenFingerprints` map to prevent duplicate progress submissions.
 * Each fingerprint is a unique combination of learner address, course ID, lesson index, and timestamp.
 *
 * LIMITATION: In serverless environments (Vercel, AWS Lambda), each function invocation gets its own
 * isolated memory space. Replay protection is therefore per-instance only and does NOT prevent replays
 * across separate invocations or cold starts. The 5-minute expiration window provides some protection
 * against rapid replays within a single instance, but cannot defend against:
 * - Replays on a different instance after a cold start
 * - Replays hours or days later from a different region/invocation
 *
 * PRODUCTION RECOMMENDATION: For production-grade replay protection that persists across
 * instances, use a distributed store:
 * - Upstash Redis (https://upstash.com) — globally distributed, sub-millisecond latency
 * - Vercel KV (https://vercel.com/docs/storage/vercel-kv) — native Vercel integration
 * - Firebase Firestore with TTL — GCP-backed, built-in expiration
 *
 * When fingerprints exceed MAX_FINGERPRINTS (10,000), the entire map is cleared to prevent
 * unbounded memory growth in long-running serverless instances.
 */

// Replay protection: track recently seen request fingerprints.
// Key = fingerprint string, value = timestamp when it was first seen.
const seenFingerprints = new Map<string, number>();
let _fingerprintCallCount = 0;

interface ValidatedRequest {
  courseId: string;
  learner: PublicKey;
  lessonIndex?: number;
}

export async function validateProgressRequest(
  request: Request,
  options: { requireLessonIndex: boolean }
): Promise<ValidatedRequest | NextResponse> {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Unauthorized" } },
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid request body" } },
      { status: 400 }
    );
  }

  const {
    learner,
    courseId,
    lessonIndex,
    signature: walletSignature,
    timestamp,
  } = body as Record<string, unknown>;

  if (!learner || typeof learner !== "string") {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid or missing learner address" } },
      { status: 400 }
    );
  }

  if (
    !courseId ||
    typeof courseId !== "string" ||
    courseId.length > 64 ||
    !/^[a-zA-Z0-9-]+$/.test(courseId)
  ) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid or missing courseId" } },
      { status: 400 }
    );
  }

  if (options.requireLessonIndex) {
    if (
      typeof lessonIndex !== "number" ||
      !Number.isInteger(lessonIndex) ||
      lessonIndex < 0 ||
      lessonIndex > 255
    ) {
      return NextResponse.json(
        { error: { code: "INVALID_INPUT", message: "Invalid lessonIndex" } },
        { status: 400 }
      );
    }
  }

  if (!walletSignature || typeof walletSignature !== "string") {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Missing wallet signature" } },
      { status: 400 }
    );
  }

  // Replay protection: validate timestamp
  if (typeof timestamp !== "number") {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Missing or invalid timestamp" } },
      { status: 400 }
    );
  }
  const age = Math.abs(Date.now() - timestamp);
  if (age > TIMESTAMP_MAX_AGE_MS) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Signature expired" } },
      { status: 403 }
    );
  }

  let learnerKey: PublicKey;
  try {
    learnerKey = new PublicKey(learner);
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid learner public key" } },
      { status: 400 }
    );
  }

  // Build the signed message with timestamp for replay protection
  const messageParts = options.requireLessonIndex
    ? `superteam-academy:${courseId}:${lessonIndex}:${timestamp}`
    : `superteam-academy:finalize:${courseId}:${timestamp}`;
  const message = new TextEncoder().encode(messageParts);

  let sigBytes: Uint8Array;
  try {
    sigBytes = Uint8Array.from(Buffer.from(walletSignature, "base64"));
  } catch {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Invalid signature encoding" } },
      { status: 400 }
    );
  }

  let isValid: boolean;
  try {
    isValid = nacl.sign.detached.verify(
      message,
      sigBytes,
      learnerKey.toBytes()
    );
  } catch {
    isValid = false;
  }
  if (!isValid) {
    return NextResponse.json(
      { error: { code: "UNAUTHORIZED", message: "Wallet signature verification failed" } },
      { status: 403 }
    );
  }

  // Replay protection: deduplicate by request fingerprint.
  // Periodic cleanup: evict fingerprints older than 5 minutes every 100 requests.
  if (++_fingerprintCallCount % 100 === 0) {
    const cutoff = Date.now() - TIMESTAMP_MAX_AGE_MS;
    for (const [fp, seenAt] of seenFingerprints) {
      if (seenAt < cutoff) seenFingerprints.delete(fp);
    }
  }

  const fingerprint = `${learner}:${courseId}:${options.requireLessonIndex ? lessonIndex : "finalize"}:${timestamp}`;
  if (seenFingerprints.has(fingerprint)) {
    return NextResponse.json(
      { error: { code: "INVALID_INPUT", message: "Duplicate request" } },
      { status: 409 }
    );
  }

  // Prevent unbounded memory growth: clear map if it exceeds MAX_FINGERPRINTS
  if (seenFingerprints.size > MAX_FINGERPRINTS) {
    seenFingerprints.clear();
  }

  seenFingerprints.set(fingerprint, Date.now());

  return {
    courseId,
    learner: learnerKey,
    ...(options.requireLessonIndex ? { lessonIndex: lessonIndex as number } : {}),
  };
}
