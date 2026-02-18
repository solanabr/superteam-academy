import type { Metadata } from "next";
import { LessonView } from "@/components/lesson/lesson-view";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getCourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import { courseService } from "@/lib/cms/course-service";
import { notFound, redirect } from "next/navigation";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}): Promise<Metadata> {
  const { slug, id } = await params;
  const course = await courseService.getCourseBySlug(slug);
  if (!course) return {};
  const lesson = course.modules
    .flatMap((m) => m.lessons)
    .find((l) => l.id === id);
  return {
    title: lesson ? `${lesson.title} — ${course.title}` : course.title,
  };
}

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>;
}) {
  const user = await requireAuthenticatedUser();
  const { slug, id } = await params;
  let snapshot;
  try {
    snapshot = await getCourseProgressSnapshot(user.walletAddress, slug);
  } catch {
    snapshot = null;
  }

  // If the cached snapshot says not enrolled, the cache may be stale
  // (enrollment was just created client-side). Retry with a fresh RPC call.
  if (!snapshot?.enrolledOnChain) {
    try {
      snapshot = await getCourseProgressSnapshot(user.walletAddress, slug, {
        forceRefresh: true,
      });
    } catch {
      snapshot = null;
    }
  }

  if (!snapshot?.enrolledOnChain) {
    redirect(`/courses/${slug}`);
  }
  const course = snapshot.course;

  let currentLesson = null;
  let currentModuleIndex = 0;
  let currentLessonIndex = 0;

  for (let mi = 0; mi < course.modules.length; mi++) {
    for (let li = 0; li < course.modules[mi].lessons.length; li++) {
      if (course.modules[mi].lessons[li].id === id) {
        currentLesson = course.modules[mi].lessons[li];
        currentModuleIndex = mi;
        currentLessonIndex = li;
      }
    }
  }

  if (!currentLesson) return notFound();

  // Build flat lesson list for prev/next
  const allLessons = course.modules.flatMap((m) => m.lessons);
  const flatIndex = allLessons.findIndex((l) => l.id === id);
  const prevLesson = flatIndex > 0 ? allLessons[flatIndex - 1] : null;
  const nextLesson =
    flatIndex < allLessons.length - 1 ? allLessons[flatIndex + 1] : null;

  return (
    <LessonView
      course={course}
      lesson={currentLesson}
      moduleIndex={currentModuleIndex}
      lessonIndex={currentLessonIndex}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
      enrolledOnChain={snapshot.enrolledOnChain}
    />
  );
}
