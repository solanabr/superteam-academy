import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getAllCourseLessonCounts } from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

interface CourseCompleteRequest {
  courseId: string;
}

const COURSE_COMPLETION_XP = 500;

export async function POST(request: NextRequest) {
  try {
    // Guard: ensure required Supabase environment variables are set
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      console.error(
        "[courses/complete] Missing required Supabase environment variables"
      );
      return NextResponse.json(
        { error: "Server configuration error" },
        { status: 500 }
      );
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as CourseCompleteRequest;
    const { courseId } = body;

    if (!courseId || typeof courseId !== "string") {
      return NextResponse.json(
        { error: "Missing or invalid courseId" },
        { status: 400 }
      );
    }

    const supabaseAdmin = createAdminClient();

    // 1. Verify user is enrolled in this course
    const { data: enrollment } = await supabaseAdmin
      .from("enrollments")
      .select("id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .single();

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    // 2. Check idempotency — has XP already been awarded for this course?
    const completionReason = `Completed course: ${courseId}`;

    const { data: existingTransaction } = await supabaseAdmin
      .from("xp_transactions")
      .select("id")
      .eq("user_id", user.id)
      .eq("reason", completionReason)
      .maybeSingle();

    if (existingTransaction) {
      return NextResponse.json({
        success: true,
        alreadyAwarded: true,
        xpEarned: 0,
      });
    }

    // 3. Get total lesson count for this course from Sanity
    const courseLessonCounts = await getAllCourseLessonCounts();
    const courseData = courseLessonCounts.find((c) => c._id === courseId);

    if (!courseData || courseData.totalLessons <= 0) {
      return NextResponse.json(
        { error: "Course not found or has no lessons" },
        { status: 404 }
      );
    }

    // 4. Verify user completed ALL lessons in the course
    const { data: completedLessons } = await supabaseAdmin
      .from("user_progress")
      .select("lesson_id")
      .eq("user_id", user.id)
      .eq("course_id", courseId)
      .eq("completed", true);

    const completedCount = completedLessons?.length ?? 0;

    if (completedCount < courseData.totalLessons) {
      return NextResponse.json(
        {
          error: "Course not fully completed",
          completed: completedCount,
          total: courseData.totalLessons,
        },
        { status: 400 }
      );
    }

    // 5. Award XP via SECURITY DEFINER function (service role only)
    const { error: xpError } = await supabaseAdmin.rpc("award_xp", {
      p_user_id: user.id,
      p_amount: COURSE_COMPLETION_XP,
      p_reason: completionReason,
    });

    if (xpError) {
      console.error("[courses/complete] Failed to award XP:", xpError.message);
      return NextResponse.json(
        { error: "Failed to award XP" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      alreadyAwarded: false,
      xpEarned: COURSE_COMPLETION_XP,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.COURSE_COMPLETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/courses/complete" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
