import { NextRequest, NextResponse } from "next/server";
import { supabaseRest } from "@/lib/backend/server-supabase";

type ActivityRow = {
  id: string;
  event_type: string;
  course_id: string | null;
  lesson_id: string | null;
  created_at: string;
};

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get("learnerId");
  if (!learnerId) {
    return NextResponse.json([], { status: 400 });
  }
  if (!supabaseRest.hasConfig()) {
    return NextResponse.json([]);
  }

  const rows = await supabaseRest.select<ActivityRow>({
    table: "academy_activity_feed",
    select: "id,event_type,course_id,lesson_id,created_at",
    filters: { learner_id: `eq.${learnerId}` },
    order: "created_at.desc",
    limit: 20,
  });

  return NextResponse.json(
    (rows ?? []).map((row) => ({
      id: row.id,
      eventType: row.event_type,
      courseId: row.course_id ?? undefined,
      lessonId: row.lesson_id ?? undefined,
      createdAt: row.created_at,
    })),
  );
}
