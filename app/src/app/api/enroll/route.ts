import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { updateStreak } from "@/lib/streak";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

export async function POST(request: NextRequest) {
  try {
    const { userId, courseId, totalLessons } = await request.json();

    if (!userId || !courseId) {
      return NextResponse.json(
        { error: "Missing userId or courseId" },
        { status: 400 },
      );
    }

    const { data, error } = await supabase
      .from("course_progress")
      .upsert(
        {
          user_id: userId,
          course_id: courseId,
          completed_lessons: [],
          total_lessons: totalLessons ?? 0,
          is_completed: false,
          is_finalized: false,
          xp_earned: 0,
          enrolled_at: new Date().toISOString(),
        },
        { onConflict: "user_id,course_id", ignoreDuplicates: true },
      )
      .select()
      .single();

    if (error) {
      // If conflict (already enrolled), fetch existing
      if (error.code === "23505" || error.message.includes("duplicate")) {
        const { data: existing } = await supabase
          .from("course_progress")
          .select("*")
          .eq("user_id", userId)
          .eq("course_id", courseId)
          .single();

        return NextResponse.json({ enrolled: true, data: existing });
      }
      throw error;
    }

    await updateStreak(supabase, userId);

    return NextResponse.json({ enrolled: true, data });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Enroll API error:", message);
    return NextResponse.json(
      { error: "Failed to enroll", details: message },
      { status: 500 },
    );
  }
}
