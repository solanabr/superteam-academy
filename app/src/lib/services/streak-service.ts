import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { streak_events, user_streaks } from "@/lib/db/schema";

function to_utc_date_only(date: Date): Date {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function days_between_utc(a: Date, b: Date): number {
  const day_ms = 24 * 60 * 60 * 1000;
  const a_utc = to_utc_date_only(a).getTime();
  const b_utc = to_utc_date_only(b).getTime();
  return Math.round((b_utc - a_utc) / day_ms);
}

export async function record_streak_event(
  user_id: string,
  event_type: "lesson_complete" | "challenge_complete",
  occurred_at: Date,
): Promise<void> {
  const now = occurred_at;

  const existing = await db
    .select()
    .from(user_streaks)
    .where(eq(user_streaks.user_id, user_id))
    .limit(1);

  const current_utc = to_utc_date_only(now);

  if (existing.length === 0) {
    await db.insert(user_streaks).values({
      user_id,
      current_streak_days: 1,
      longest_streak_days: 1,
      last_activity_at: current_utc,
      updated_at: now,
    });
  } else {
    const streak = existing[0];
    const last = streak.last_activity_at ?? current_utc;
    const delta_days = days_between_utc(last, current_utc);

    let current = streak.current_streak_days;
    if (delta_days === 0) {
      // same day: keep current streak
    } else if (delta_days === 1) {
      current = current + 1;
    } else if (delta_days > 1) {
      current = 1;
    }

    const longest = Math.max(streak.longest_streak_days, current);

    await db
      .update(user_streaks)
      .set({
        current_streak_days: current,
        longest_streak_days: longest,
        last_activity_at: current_utc,
        updated_at: now,
      })
      .where(and(eq(user_streaks.id, streak.id), eq(user_streaks.user_id, user_id)));
  }

  await db.insert(streak_events).values({
    user_id,
    event_type,
    created_at: now,
  });
}

