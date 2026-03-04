import { and, eq, isNull } from "drizzle-orm";
import { require_auth } from "@/lib/api/guard";
import { api_success } from "@/lib/api/response";
import { db } from "@/lib/db";
import { course_enrollments, lesson_progress } from "@/lib/db/schema";
import { get_course_by_slug, get_lessons } from "@/lib/services/course-service";

export async function GET(): Promise<Response> {
  const result = await require_auth();
  if (result.response) return result.response;
  const { session } = result;

  const enrollments = await db
    .select({
      course_slug: course_enrollments.course_slug,
    })
    .from(course_enrollments)
    .where(
      and(
        eq(course_enrollments.user_id, session.sub),
        isNull(course_enrollments.closed_at),
      ),
    );

  const enrollmentsWithProgress = await Promise.all(
    enrollments.map(async (row) => {
      const course = await get_course_by_slug(row.course_slug);
      const lessons = course ? await get_lessons(row.course_slug) : [];
      const total = lessons.length;

      const completedRows = await db
        .select({ lesson_slug: lesson_progress.lesson_slug })
        .from(lesson_progress)
        .where(
          and(
            eq(lesson_progress.user_id, session.sub),
            eq(lesson_progress.course_slug, row.course_slug),
            eq(lesson_progress.completed, true),
          ),
        );
      const completed = completedRows.length;
      const completedSlugs = new Set(completedRows.map((r) => r.lesson_slug));
      const firstIncomplete = lessons.find((l) => !completedSlugs.has(l.slug));

      return {
        course_slug: row.course_slug,
        course_title: course?.title ?? row.course_slug,
        completed,
        total,
        next_lesson_slug: firstIncomplete?.slug ?? null,
      };
    }),
  );

  return api_success(
    { enrollments: enrollmentsWithProgress },
    "Enrollments fetched",
    200,
  );
}
