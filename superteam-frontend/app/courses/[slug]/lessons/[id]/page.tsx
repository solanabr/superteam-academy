import { LessonView } from "@/components/lesson/lesson-view";
import { requireAuthenticatedUser } from "@/lib/server/auth-adapter";
import { getCourseProgressSnapshot } from "@/lib/server/academy-progress-adapter";
import { getCourse } from "@/lib/server/admin-store";
import { notFound } from "next/navigation";

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

  if (!snapshot) {
    const course = getCourse(slug);
    if (!course) return notFound();
    snapshot = {
      course: { ...course, progress: 0 },
      enrolledOnChain: false,
      completedLessons: 0,
      enrollmentPda: "",
    };
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
