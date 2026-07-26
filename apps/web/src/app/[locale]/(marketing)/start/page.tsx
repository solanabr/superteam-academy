import type { Metadata } from "next";
import { getAllQuests, getCourseById } from "@/lib/content/queries";
import {
  SEGMENT_ENTRY_COURSE,
  type LearnerSegment,
} from "@/lib/courses/learner-segment";
import { dailyGoalOptionsFromQuests } from "@/lib/onboarding/intake";
import { StartIntakeClient, type SegmentRoute } from "./start-client";

export const metadata: Metadata = {
  title: "Get started — Superteam Academy",
  description:
    "Answer a few taps and we'll point you at the right first lesson on Superteam Academy.",
};

// Content bundle + entry-course resolution are build-time constants; ISR keeps
// the resolved routes fresh if the bundle changes without a per-request cost.
export const revalidate = 300;

/**
 * Resolves each segment's entry course (SEGMENT_ENTRY_COURSE) into a concrete
 * destination href: the entry course's first lesson when it can be derived,
 * else the course page (the course-detail CTA points at the right lesson).
 * Runs server-side so the client never imports the content bundle.
 */
async function resolveSegmentRoutes(
  locale: string
): Promise<Record<LearnerSegment, SegmentRoute>> {
  const segments: LearnerSegment[] = [1, 2, 3];
  const entries = await Promise.all(
    segments.map(async (segment) => {
      const courseId = SEGMENT_ENTRY_COURSE[segment];
      const course = await getCourseById(courseId);
      const slug = course?.slug ?? null;
      const firstLessonSlug =
        course?.modules?.find((m) => (m.lessons?.length ?? 0) > 0)?.lessons?.[0]
          ?.slug ?? null;
      const href =
        slug && firstLessonSlug
          ? `/${locale}/courses/${slug}/lessons/${firstLessonSlug}`
          : slug
            ? `/${locale}/courses/${slug}`
            : `/${locale}/courses`;
      return [segment, { courseId, href }] as const;
    })
  );
  return Object.fromEntries(entries) as Record<LearnerSegment, SegmentRoute>;
}

export default async function StartPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [routes, questData] = await Promise.all([
    resolveSegmentRoutes(locale),
    getAllQuests(),
  ]);
  const dailyGoalOptions = dailyGoalOptionsFromQuests(questData.quests);

  return (
    <StartIntakeClient
      routes={routes}
      dailyGoalOptions={dailyGoalOptions}
      browseAllHref={`/${locale}/courses`}
    />
  );
}
