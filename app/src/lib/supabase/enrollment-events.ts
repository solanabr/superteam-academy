import { getSupabaseAdmin } from "./server";

interface EnrollmentEvent {
  eventType: "enroll" | "complete_lesson" | "finalize_course";
  wallet: string;
  courseId: string;
  lessonIndex?: number;
  signature?: string;
}

/** Log an enrollment event to Supabase. Non-critical — never throws. */
export async function logEnrollmentEvent(event: EnrollmentEvent): Promise<void> {
  try {
    const db = getSupabaseAdmin();
    await db.from("enrollment_events").insert({
      event_type: event.eventType,
      wallet: event.wallet,
      course_id: event.courseId,
      lesson_index: event.lessonIndex ?? null,
      signature: event.signature ?? null,
    });
  } catch {
    // Non-critical logging — never block the main operation
  }
}

/** Get enrollment event counts by day for the last N days. */
export async function getEnrollmentsByDay(
  days = 30,
): Promise<{ date: string; count: number }[]> {
  try {
    const db = getSupabaseAdmin();
    const since = new Date();
    since.setDate(since.getDate() - days);

    const { data, error } = await db
      .from("enrollment_events")
      .select("created_at")
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true });

    if (error || !data) return [];

    // Aggregate by date
    const counts = new Map<string, number>();
    for (const row of data) {
      const date = row.created_at.slice(0, 10);
      counts.set(date, (counts.get(date) ?? 0) + 1);
    }

    // Zero-fill missing days
    const result: { date: string; count: number }[] = [];
    const now = new Date();
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().slice(0, 10);
      result.push({ date: dateStr, count: counts.get(dateStr) ?? 0 });
    }

    return result;
  } catch {
    return [];
  }
}
