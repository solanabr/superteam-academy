import { NextRequest, NextResponse } from "next/server";
import { ensureUser } from "@/lib/backend/server-utils";
import { supabaseRest } from "@/lib/backend/server-supabase";
import { mockCourses } from "@/domain/mock-data";

type CompletionRow = {
  learner_id: string;
  course_id: string;
  lesson_id: string;
  completed_at: string;
};

type UserRow = {
  learner_id: string;
  wallet_address: string | null;
};

function summarize(rows: CompletionRow[], courseId: string, totalLessons: number) {
  // Deduplicate lessons (legacy rows can exist under wallet learner_id and auth learner_id).
  const latestByLesson = new Map<string, CompletionRow>();
  rows.forEach((row) => {
    const existing = latestByLesson.get(row.lesson_id);
    if (!existing || new Date(row.completed_at).getTime() >= new Date(existing.completed_at).getTime()) {
      latestByLesson.set(row.lesson_id, row);
    }
  });

  const dedupedRows = [...latestByLesson.values()].sort((a, b) => a.completed_at.localeCompare(b.completed_at));
  const completedLessonIds = dedupedRows.map((row) => row.lesson_id);
  const percentComplete = Math.min(100, Math.round((completedLessonIds.length / Math.max(totalLessons, 1)) * 100));
  const updatedAt =
    dedupedRows.map((row) => row.completed_at).sort().at(-1) ??
    new Date().toISOString();

  return {
    courseId,
    completedLessonIds,
    percentComplete,
    updatedAt,
  };
}

async function resolveLearnerAliases(learnerId: string): Promise<string[]> {
  const aliases = new Set<string>([learnerId]);
  const userRows = await supabaseRest.select<UserRow>({
    table: "academy_users",
    select: "learner_id,wallet_address",
    filters: { learner_id: `eq.${learnerId}` },
    limit: 1,
  });
  const walletAddress = userRows?.[0]?.wallet_address?.trim();
  if (walletAddress) aliases.add(walletAddress);
  return [...aliases];
}

async function fetchCompletions(courseId: string, learnerAliases: string[]) {
  if (learnerAliases.length <= 1) {
    return supabaseRest.select<CompletionRow>({
      table: "academy_lesson_completions",
      select: "learner_id,course_id,lesson_id,completed_at",
      filters: {
        learner_id: `eq.${learnerAliases[0]}`,
        course_id: `eq.${courseId}`,
      },
      order: "completed_at.asc",
    });
  }

  const orFilter = learnerAliases.map((id) => `learner_id.eq.${id}`).join(",");
  return supabaseRest.select<CompletionRow>({
    table: "academy_lesson_completions",
    select: "learner_id,course_id,lesson_id,completed_at",
    filters: {
      or: `(${orFilter})`,
      course_id: `eq.${courseId}`,
    },
    order: "completed_at.asc",
  });
}

export async function GET(request: NextRequest) {
  const learnerId = request.nextUrl.searchParams.get("learnerId");
  const courseId = request.nextUrl.searchParams.get("courseId");
  if (!learnerId || !courseId) {
    return NextResponse.json(null, { status: 400 });
  }
  if (!supabaseRest.hasConfig()) {
    return NextResponse.json(null);
  }

  const learnerAliases = await resolveLearnerAliases(learnerId);
  const rows = await fetchCompletions(courseId, learnerAliases);

  if (!rows || rows.length === 0) {
    return NextResponse.json(null);
  }

  const totalLessons = Math.max(1, mockCourses.find((course) => course.id === courseId)?.lessons.length ?? rows.length);
  const summary = summarize(rows, courseId, totalLessons);
  return NextResponse.json(summary);
}

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    learnerId?: string;
    courseId?: string;
    lessonId?: string;
    totalLessons?: number;
    completionSignature?: string;
    completionNftId?: string;
  };
  if (!body.learnerId || !body.courseId || !body.lessonId) {
    return NextResponse.json({ error: "learnerId, courseId and lessonId are required" }, { status: 400 });
  }

  if (!supabaseRest.hasConfig()) {
    return NextResponse.json({
      courseId: body.courseId,
      completedLessonIds: [body.lessonId],
      percentComplete: Math.round((1 / Math.max(body.totalLessons ?? 1, 1)) * 100),
      updatedAt: new Date().toISOString(),
    });
  }

  await ensureUser(body.learnerId);
  await supabaseRest.upsert(
    "academy_lesson_completions",
    {
      learner_id: body.learnerId,
      course_id: body.courseId,
      lesson_id: body.lessonId,
      completed_at: new Date().toISOString(),
    },
    "learner_id,course_id,lesson_id",
  );

  await supabaseRest.upsert(
    "academy_streak_days",
    {
      learner_id: body.learnerId,
      activity_day: new Date().toISOString().slice(0, 10),
    },
    "learner_id,activity_day",
  );

  await supabaseRest.insert("academy_activity_feed", {
    learner_id: body.learnerId,
    event_type: "lesson_completed",
    course_id: body.courseId,
    lesson_id: body.lessonId,
    payload: {
      completionSignature: body.completionSignature ?? null,
      completionNftId: body.completionNftId ?? null,
      network: "devnet",
    },
  });

  const learnerAliases = await resolveLearnerAliases(body.learnerId);
  const rows = await fetchCompletions(body.courseId, learnerAliases);

  const summary = summarize(rows ?? [], body.courseId, Math.max(body.totalLessons ?? 1, 1));
  return NextResponse.json(summary);
}
