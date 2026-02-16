import { LessonView } from "@/components/lesson/lesson-view"
import { courses } from "@/lib/mock-data"
import { notFound } from "next/navigation"

export default async function LessonPage({
  params,
}: {
  params: Promise<{ slug: string; id: string }>
}) {
  const { slug, id } = await params
  const course = courses.find((c) => c.slug === slug)
  if (!course) return notFound()

  let currentLesson = null
  let currentModuleIndex = 0
  let currentLessonIndex = 0

  for (let mi = 0; mi < course.modules.length; mi++) {
    for (let li = 0; li < course.modules[mi].lessons.length; li++) {
      if (course.modules[mi].lessons[li].id === id) {
        currentLesson = course.modules[mi].lessons[li]
        currentModuleIndex = mi
        currentLessonIndex = li
      }
    }
  }

  if (!currentLesson) return notFound()

  // Build flat lesson list for prev/next
  const allLessons = course.modules.flatMap((m) => m.lessons)
  const flatIndex = allLessons.findIndex((l) => l.id === id)
  const prevLesson = flatIndex > 0 ? allLessons[flatIndex - 1] : null
  const nextLesson = flatIndex < allLessons.length - 1 ? allLessons[flatIndex + 1] : null

  return (
    <LessonView
      course={course}
      lesson={currentLesson}
      moduleIndex={currentModuleIndex}
      lessonIndex={currentLessonIndex}
      prevLesson={prevLesson}
      nextLesson={nextLesson}
    />
  )
}
