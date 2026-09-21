import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import {
  decodeEventsFromTransaction,
  normalizeEventData,
  UNDECODABLE_CODE,
} from "@/lib/helius/event-decoder";
import {
  handleEnrolled,
  handleEnrollmentClosed,
  handleLessonCompleted,
  handleCourseFinalized,
  handleCredentialIssued,
  handleAchievementAwarded,
  handleXpRewarded,
} from "@/lib/helius/event-handlers";
import type { HeliusWebhookPayload } from "@/lib/helius/types";
import type {
  EnrolledEvent,
  EnrollmentClosedEvent,
  LessonCompletedEvent,
  CourseFinalizedEvent,
  CredentialIssuedEvent,
  AchievementAwardedEvent,
  XpRewardedEvent,
} from "@/lib/helius/types";
import { serverEnv } from "@/lib/env.server";
import { logEvent } from "@/lib/logging";

const WEBHOOK_SECRET = serverEnv.HELIUS_WEBHOOK_SECRET;
const MAX_BODY_SIZE = 1 * 1024 * 1024; // 1 MB

function verifyBearerToken(header: string | null, secret: string): boolean {
  if (!header?.startsWith("Bearer ")) return false;
  const token = header.slice(7);
  const tokenBuf = Buffer.from(token);
  const secretBuf = Buffer.from(secret);
  if (tokenBuf.length !== secretBuf.length) return false;
  return crypto.timingSafeEqual(tokenBuf, secretBuf);
}

export async function POST(req: NextRequest) {
  // 1. Validate auth header (timing-safe comparison)
  if (
    !WEBHOOK_SECRET ||
    !verifyBearerToken(req.headers.get("authorization"), WEBHOOK_SECRET)
  ) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Enforce body size limit
  const contentLength = Number(req.headers.get("content-length") ?? 0);
  if (contentLength > MAX_BODY_SIZE) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }

  // 3. Parse body
  let transactions: HeliusWebhookPayload;
  try {
    transactions = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(transactions)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 });
  }

  // 4. Process each transaction
  let undecodable = 0;

  for (const tx of transactions) {
    const {
      events,
      signature,
      undecodable: skipped,
    } = decodeEventsFromTransaction(tx);

    // An entry with no usable transaction is skipped, not fatal. Before #1252
    // the decoder read `tx.transaction.signatures[0]` unguarded and threw
    // (Sentry SA-2), which abandoned every REMAINING entry in the same POST
    // and 500'd — so Helius retried a payload that can never decode.
    if (skipped) {
      undecodable++;
      continue;
    }

    for (const event of events) {
      const data: unknown = normalizeEventData(event.data);
      try {
        switch (event.name) {
          case "Enrolled":
            await handleEnrolled(data as EnrolledEvent, signature);
            break;
          case "EnrollmentClosed":
            await handleEnrollmentClosed(
              data as EnrollmentClosedEvent,
              signature
            );
            break;
          case "LessonCompleted":
            await handleLessonCompleted(
              data as LessonCompletedEvent,
              signature
            );
            break;
          case "CourseFinalized":
            await handleCourseFinalized(
              data as CourseFinalizedEvent,
              signature
            );
            break;
          case "CredentialIssued":
            await handleCredentialIssued(
              data as CredentialIssuedEvent,
              signature
            );
            break;
          case "CredentialUpgraded":
            // No DB handler needed — on-chain state is source of truth
            break;
          case "AchievementAwarded":
            await handleAchievementAwarded(
              data as AchievementAwardedEvent,
              signature
            );
            break;
          case "XpRewarded":
            await handleXpRewarded(data as XpRewardedEvent, signature);
            break;
          default:
            // Admin events (CourseCreated, ConfigUpdated, etc.) -- no-op
            break;
        }
      } catch (err) {
        console.error(`[webhook] Error handling ${event.name}:`, err);
        // Don't return 500 -- process remaining events.
        // Individual failures are handled by the queue in each handler.
      }
    }
  }

  if (undecodable > 0) {
    logEvent({
      event: UNDECODABLE_CODE,
      context: { undecodable, total: transactions.length },
    });
  }

  // Always 200: a retry cannot make an undecodable entry decodable, and the
  // decodable entries in the same batch have already been processed.
  return NextResponse.json({
    received: true,
    processed: transactions.length - undecodable,
    undecodable,
  });
}
