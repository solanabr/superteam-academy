import { NextRequest, NextResponse } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getCourseById } from "@/lib/sanity/queries";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  isOnChainProgramLive,
  completeLesson as onChainCompleteLesson,
  getConnection,
  PROGRAM_ID,
} from "@/lib/solana/academy-program";
import { fetchEnrollment } from "@/lib/solana/academy-reads";
import { isLessonComplete } from "@/lib/solana/bitmap";

interface LessonCompleteRequest {
  lessonId: string;
  courseId: string;
}

/**
 * Derive the 0-based lesson index within a course from Sanity content order.
 * Modules and lessons are flattened in order; the index matches the on-chain bitmap position.
 */
async function deriveLessonIndex(
  courseId: string,
  lessonId: string
): Promise<number> {
  const course = await getCourseById(courseId);
  if (!course) throw new Error(`Course not found: ${courseId}`);
  const allLessons = (course.modules ?? []).flatMap(
    (m: { lessons?: { _id: string }[] }) => m.lessons ?? []
  );
  const index = allLessons.findIndex((l) => l._id === lessonId);
  if (index === -1) throw new Error(`Lesson not found in course: ${lessonId}`);
  return index;
}

/**
 * Mark a lesson as complete on-chain. Supabase writes (XP, progress,
 * achievements, credentials) are handled by the Helius webhook handler.
 */
export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
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

    const body = (await request.json()) as LessonCompleteRequest;
    const { lessonId, courseId } = body;

    if (!lessonId || !courseId) {
      return NextResponse.json(
        { error: "Missing lessonId or courseId" },
        { status: 400 }
      );
    }

    if (
      typeof lessonId !== "string" ||
      lessonId.length > 100 ||
      typeof courseId !== "string" ||
      courseId.length > 100
    ) {
      return NextResponse.json({ error: "Invalid input" }, { status: 400 });
    }

    // Look up user's wallet — required for on-chain operations
    const supabaseAdmin = createAdminClient();
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("wallet_address")
      .eq("id", user.id)
      .single();

    if (!profile?.wallet_address) {
      return NextResponse.json(
        {
          error: "Wallet not connected. Link your wallet to earn on-chain XP.",
        },
        { status: 400 }
      );
    }

    const programLive = await isOnChainProgramLive();
    if (!programLive) {
      return NextResponse.json(
        { error: "On-chain program not available" },
        { status: 503 }
      );
    }

    const walletPubkey = new PublicKey(profile.wallet_address);
    const connection = getConnection();

    // Verify on-chain enrollment exists
    const onChainEnrollment = await fetchEnrollment(
      courseId,
      walletPubkey,
      connection,
      PROGRAM_ID
    );

    if (!onChainEnrollment) {
      return NextResponse.json(
        {
          error: "On-chain enrollment not found. Please re-enroll the course.",
        },
        { status: 403 }
      );
    }

    // Derive lesson index from Sanity content order
    const lessonIndex = await deriveLessonIndex(courseId, lessonId);

    // Idempotency: skip on-chain TX if lesson already completed in bitmap
    const alreadyOnChain = isLessonComplete(
      onChainEnrollment.lesson_flags as (bigint | number)[],
      lessonIndex
    );

    if (alreadyOnChain) {
      return NextResponse.json({
        success: true,
        alreadyCompleted: true,
        signature: null,
      });
    }

    // Execute on-chain completeLesson — webhook handles all Supabase writes
    const signature = await onChainCompleteLesson(
      courseId,
      walletPubkey,
      lessonIndex
    );

    return NextResponse.json({ success: true, signature });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.LESSON_COMPLETE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/lessons/complete" },
    });
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
