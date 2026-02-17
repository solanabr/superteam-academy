import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  finalizeCourse as onChainFinalizeCourse,
  getConnection,
  isOnChainProgramLive,
  PROGRAM_ID,
} from "@/lib/solana/academy-program";
import { fetchEnrollment, fetchCourse } from "@/lib/solana/academy-reads";
import { isAllLessonsComplete } from "@/lib/solana/bitmap";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ courseId: string }> }
) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { courseId } = await params;
    const supabaseAdmin = createAdminClient();

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        { error: "Wallet not connected" },
        { status: 400 }
      );
    }

    if (!(await isOnChainProgramLive())) {
      return NextResponse.json(
        { error: "On-chain program not available" },
        { status: 503 }
      );
    }

    const walletPubkey = new PublicKey(profile.wallet_address);
    const connection = getConnection();

    // Verify enrollment exists and all lessons are complete
    const enrollment = await fetchEnrollment(
      courseId,
      walletPubkey,
      connection,
      PROGRAM_ID
    );

    if (!enrollment) {
      return NextResponse.json(
        { error: "Not enrolled in this course" },
        { status: 403 }
      );
    }

    if (enrollment.completedAt) {
      return NextResponse.json(
        { error: "Course already finalized" },
        { status: 400 }
      );
    }

    const course = await fetchCourse(courseId, connection, PROGRAM_ID);
    if (!course) {
      return NextResponse.json(
        { error: "Course not found on-chain" },
        { status: 404 }
      );
    }

    if (
      !isAllLessonsComplete(
        enrollment.lessonFlags as (bigint | number)[],
        course.lessonCount as number
      )
    ) {
      return NextResponse.json(
        { error: "Not all lessons completed" },
        { status: 400 }
      );
    }

    // Call on-chain finalizeCourse
    const signature = await onChainFinalizeCourse(courseId, walletPubkey);

    // Supabase mirror: update enrollment
    await supabaseAdmin
      .from("enrollments")
      .update({ completed_at: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("course_id", courseId);

    return NextResponse.json({
      success: true,
      signature,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.COURSE_FINALIZE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/courses/[courseId]/finalize" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
