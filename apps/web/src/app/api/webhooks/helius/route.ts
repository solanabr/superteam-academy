import { NextRequest, NextResponse } from "next/server";
import {
  decodeEventsFromTransaction,
  normalizeEventData,
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

const WEBHOOK_SECRET = process.env.HELIUS_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  // 1. Validate auth header
  const authHeader = req.headers.get("authorization");
  if (!WEBHOOK_SECRET || authHeader !== `Bearer ${WEBHOOK_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // 2. Parse body
  let transactions: HeliusWebhookPayload;
  try {
    transactions = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (!Array.isArray(transactions)) {
    return NextResponse.json({ error: "Expected array" }, { status: 400 });
  }

  // 3. Process each transaction
  for (const tx of transactions) {
    const { events, signature } = decodeEventsFromTransaction(tx);

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
            // Admin events (CourseCreated, ConfigUpdated, etc.) -- log only
            console.log(`[webhook] ${event.name}: sig=${signature}`);
        }
      } catch (err) {
        console.error(`[webhook] Error handling ${event.name}:`, err);
        // Don't return 500 -- process remaining events.
        // Individual failures are handled by the queue in each handler.
      }
    }
  }

  // Return 200 to acknowledge receipt (prevents Helius retry)
  return NextResponse.json({ received: true });
}
