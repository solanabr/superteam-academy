import { NextRequest } from "next/server";
import { eq } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_error, api_success } from "@/lib/api/response";
import { lesson_complete_body_schema } from "@/lib/validators/lesson";
import { db } from "@/lib/db";
import { lesson_progress, wallets } from "@/lib/db/schema";
import { get_enrollment_status } from "@/lib/services/blockchain-service";
import { record_streak_event } from "@/lib/services/streak-service";
import { check_rate_limit } from "@/lib/security/rate-limit";

export async function POST(request: NextRequest): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const rate_limit = await check_rate_limit({
    key: `lesson_complete:${session.sub}`,
    window_ms: 5 * 60 * 1000,
    max: 50,
  });

  if (!rate_limit.allowed) {
    return api_error("Too many requests", 429);
  }

  const body = await request.json();
  const parsed = lesson_complete_body_schema.safeParse(body);
  if (!parsed.success) return api_error("Invalid body", 400);

  const { course_slug, lesson_slug } = parsed.data;

  // Require linked wallet for lesson completion (enrollment is on-chain)
  const [wallet] = await db
    .select()
    .from(wallets)
    .where(eq(wallets.user_id, session.sub))
    .limit(1);

  if (!wallet) {
    return api_error("Wallet not linked", 400);
  }

  // Verify on-chain enrollment before allowing completion
  const enrolled = await get_enrollment_status(wallet.public_key, course_slug);
  if (!enrolled) {
    return api_error("Not enrolled in course", 403);
  }

  const now = new Date();

  // Upsert lesson progress for this user / course / lesson
  await db
    .insert(lesson_progress)
    .values({
      user_id: session.sub,
      course_slug,
      lesson_slug,
      completed: true,
      completed_at: now,
      updated_at: now,
    })
    .onConflictDoUpdate({
      target: [lesson_progress.user_id, lesson_progress.course_slug, lesson_progress.lesson_slug],
      set: {
        completed: true,
        completed_at: now,
        updated_at: now,
      },
    });

  await record_streak_event(session.sub, "lesson_complete", now);
  // TODO (later steps): on-chain complete_lesson + XP snapshot + transaction logging

  return api_success({ completed: true }, "Lesson marked complete", 200);
}
