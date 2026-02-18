import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  completeLessonOnChain,
  fetchEnrollment,
  fetchLearnerProfile,
  finalizeCourseOnChain,
  invalidateEnrollmentCache,
} from "@/lib/server/academy-program";
import {
  getCatalogCourseMeta,
  getXpRewards,
} from "@/lib/server/academy-course-catalog";
import {
  recordLessonComplete,
  recordCourseFinalized,
  computeBonusXp,
  getCurrentStreak,
} from "@/lib/server/activity-store";
import { getCourse } from "@/lib/server/admin-store";

type CompleteLessonBody = {
  slug?: string;
  lessonId?: string;
  lessonType?: "video" | "reading" | "challenge";
};

export async function POST(request: Request) {
  const user = await getAuthenticatedUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => ({}))) as CompleteLessonBody;
  const slug = body.slug?.trim();
  if (!slug) {
    return NextResponse.json(
      { error: "Course slug is required." },
      { status: 400 },
    );
  }

  const meta = getCatalogCourseMeta(slug);
  if (!meta) {
    return NextResponse.json(
      { error: "Unknown course slug." },
      { status: 404 },
    );
  }

  const userPk = new PublicKey(user.walletAddress);
  const learner = await fetchLearnerProfile(userPk);
  if (!learner) {
    return NextResponse.json(
      { error: "Learner profile is missing. Initialize learner first." },
      { status: 400 },
    );
  }

  let enrollmentBefore = await fetchEnrollment(userPk, slug);
  if (!enrollmentBefore) {
    // Retry once with fresh RPC — cache may hold a stale null
    invalidateEnrollmentCache(userPk, slug);
    enrollmentBefore = await fetchEnrollment(userPk, slug);
  }
  if (!enrollmentBefore) {
    return NextResponse.json(
      { error: "Enrollment is missing. Enroll in the course first." },
      { status: 400 },
    );
  }

  const completeTxSignature = await completeLessonOnChain(userPk, slug);
  invalidateEnrollmentCache(userPk, slug);
  const enrollmentAfter = await fetchEnrollment(userPk, slug);
  const lessonsCompleted = Number(enrollmentAfter?.lessonsCompleted ?? 0);

  // Calculate XP based on course difficulty and lesson type
  const rewards = getXpRewards(meta.difficulty);
  const isChallenge = body.lessonType === "challenge";
  const lessonXp = isChallenge ? rewards.challenge : rewards.lesson;

  // Compute daily bonuses (streak + first-of-day)
  const currentStreak = await getCurrentStreak(user.walletAddress);
  const bonuses = computeBonusXp(user.walletAddress, currentStreak);

  const courseTitle = getCourse(slug)?.title ?? slug;
  recordLessonComplete(
    user.walletAddress,
    courseTitle,
    lessonXp,
    body.lessonId ?? undefined,
  );

  let finalized = false;
  let finalizeTxSignature: string | null = null;
  let courseCompletionXp = 0;
  if (lessonsCompleted >= meta.lessonsCount) {
    try {
      finalizeTxSignature = await finalizeCourseOnChain(userPk, slug);
      finalized = true;
      courseCompletionXp = rewards.courseComplete;
      recordCourseFinalized(
        user.walletAddress,
        courseTitle,
        courseCompletionXp,
      );
    } catch {
      // Keep lesson completion success even if finalize preconditions fail in race situations.
    }
  }

  const totalXp = lessonXp + courseCompletionXp + bonuses.totalBonus;

  return NextResponse.json(
    {
      ok: true,
      slug,
      lessonId: body.lessonId ?? null,
      lessonsCompleted,
      lessonsTotal: meta.lessonsCount,
      finalized,
      completeTxSignature,
      finalizeTxSignature,
      xp: {
        lesson: lessonXp,
        courseCompletion: courseCompletionXp,
        streakBonus: bonuses.streakBonus,
        firstOfDayBonus: bonuses.firstOfDayBonus,
        total: totalXp,
      },
    },
    { status: 200 },
  );
}
