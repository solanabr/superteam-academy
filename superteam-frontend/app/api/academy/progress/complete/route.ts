import { PublicKey } from "@solana/web3.js";
import { NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/server/auth-adapter";
import {
  completeLessonOnChain,
  fetchEnrollment,
  fetchLearnerProfile,
  finalizeCourseOnChain,
} from "@/lib/server/academy-program";
import { getCatalogCourseMeta } from "@/lib/server/academy-course-catalog";
import {
  recordLessonComplete,
  recordCourseFinalized,
} from "@/lib/server/activity-store";
import { courses } from "@/lib/course-catalog";

type CompleteLessonBody = {
  slug?: string;
  lessonId?: string;
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

  const enrollmentBefore = await fetchEnrollment(userPk, slug);
  if (!enrollmentBefore) {
    return NextResponse.json(
      { error: "Enrollment is missing. Enroll in the course first." },
      { status: 400 },
    );
  }

  const completeTxSignature = await completeLessonOnChain(userPk, slug);
  const enrollmentAfter = await fetchEnrollment(userPk, slug);
  const lessonsCompleted = Number(enrollmentAfter?.lessonsCompleted ?? 0);

  const courseTitle = courses.find((c) => c.slug === slug)?.title ?? slug;
  recordLessonComplete(
    user.walletAddress,
    courseTitle,
    body.lessonId ?? undefined,
  );

  let finalized = false;
  let finalizeTxSignature: string | null = null;
  if (lessonsCompleted >= meta.lessonsCount) {
    try {
      finalizeTxSignature = await finalizeCourseOnChain(userPk, slug);
      finalized = true;
      recordCourseFinalized(user.walletAddress, courseTitle);
    } catch {
      // Keep lesson completion success even if finalize preconditions fail in race situations.
    }
  }

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
    },
    { status: 200 },
  );
}
