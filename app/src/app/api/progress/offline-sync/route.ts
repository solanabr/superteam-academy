import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// POST /api/progress/offline-sync — sync a lesson completed while offline
export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, lessonIndex, completedAt } = await request.json();

    if (!userId || !courseId || lessonIndex == null) {
      return NextResponse.json(
        { error: "Missing userId, courseId, or lessonIndex" },
        { status: 400 },
      );
    }

    const { data: current } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!current) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 400 },
      );
    }

    const completed: number[] = current.completed_lessons ?? [];
    if (completed.includes(lessonIndex)) {
      return NextResponse.json({ synced: true, alreadyCompleted: true });
    }

    const updatedLessons = [...completed, lessonIndex];
    const total = current.total_lessons || 0;
    const isCompleted = total > 0 && updatedLessons.length >= total;

    const { error } = await supabase
      .from("course_progress")
      .update({
        completed_lessons: updatedLessons,
        xp_earned: (current.xp_earned ?? 0) + (current.xp_per_lesson ?? 10),
        is_completed: isCompleted,
        completed_at: isCompleted
          ? new Date(completedAt || Date.now()).toISOString()
          : null,
      })
      .eq("user_id", userId)
      .eq("course_id", courseId);

    if (error) throw error;
    return NextResponse.json({ synced: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to sync offline progress", details: message },
      { status: 500 },
    );
  }
}
