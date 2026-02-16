import "server-only"

import { courses } from "@/lib/mock-data"

export type CatalogCourseMeta = {
  slug: string
  lessonsCount: number
  trackId: number
}

function countLessons(slug: string): number {
  const course = courses.find((item) => item.slug === slug)
  if (!course) return 0
  return course.modules.reduce((acc, module) => acc + module.lessons.length, 0)
}

export function getCatalogCourseMeta(slug: string): CatalogCourseMeta | null {
  const index = courses.findIndex((item) => item.slug === slug)
  if (index < 0) return null
  return {
    slug,
    lessonsCount: countLessons(slug),
    trackId: index + 1,
  }
}
