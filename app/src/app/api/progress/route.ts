import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

// GET /api/progress?userId=...&courseId=... (single) or ?userId=... (all)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const courseId = searchParams.get("courseId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (courseId) {
      const { data } = await supabase
        .from("course_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("course_id", courseId)
        .single();

      return NextResponse.json({ progress: data });
    }

    const { data } = await supabase
      .from("course_progress")
      .select("*")
      .eq("user_id", userId)
      .order("enrolled_at", { ascending: false });

    return NextResponse.json({ progressList: data ?? [] });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to fetch progress", details: message },
      { status: 500 },
    );
  }
}

// POST /api/progress — complete a lesson or update progress
export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, lessonIndex, xp } = await request.json();

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
      return NextResponse.json({ progress: current, alreadyCompleted: true });
    }

    const updatedLessons = [...completed, lessonIndex];
    const total = current.total_lessons || 0;
    const isCompleted = total > 0 && updatedLessons.length >= total;

    const { data, error } = await supabase
      .from("course_progress")
      .update({
        completed_lessons: updatedLessons,
        xp_earned: (current.xp_earned ?? 0) + (xp ?? 0),
        is_completed: isCompleted,
        completed_at: isCompleted ? new Date().toISOString() : null,
      })
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .select()
      .single();

    if (error) throw error;
    return NextResponse.json({ progress: data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Failed to update progress", details: message },
      { status: 500 },
    );
  }
}
