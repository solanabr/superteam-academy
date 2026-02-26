import type { MockCourse, MockLesson } from './mock-content'

// Use environment variable to switch between mock and Sanity
const USE_SANITY = process.env.NEXT_PUBLIC_USE_SANITY === 'true'

// Dynamically import the appropriate service
async function getContentService() {
  if (USE_SANITY) {
    const sanityService = await import('./sanity-content')
    return {
      getAllCourses: sanityService.getAllCourses,
      getCourseBySlug: sanityService.getCourseBySlug,
      getLessonById: sanityService.getLessonById,
      getAllLessonsFlat: sanityService.getAllLessonsFlat,
    }
  } else {
    const mockService = await import('./mock-content')
    return {
      getAllCourses: async () => mockService.MOCK_COURSES,
      getCourseBySlug: async (slug: string) => mockService.getCourseBySlug(slug),
      getLessonById: async (courseSlug: string, lessonId: string) =>
        mockService.getLessonById(courseSlug, lessonId),
      getAllLessonsFlat: mockService.getAllLessonsFlat,
    }
  }
}

// Cache the service instance
let serviceCache: Awaited<ReturnType<typeof getContentService>> | null = null

async function getService() {
  if (!serviceCache) {
    serviceCache = await getContentService()
  }
  return serviceCache
}

// Export functions that use the service
export async function getAllCourses(): Promise<MockCourse[]> {
  const service = await getService()
  return service.getAllCourses()
}

export async function getCourseBySlug(slug: string): Promise<MockCourse | undefined> {
  const service = await getService()
  return service.getCourseBySlug(slug)
}

export async function getLessonById(
  courseSlug: string,
  lessonId: string
): Promise<{ course: MockCourse; lesson: MockLesson; moduleTitle: string; lessonIndex: number } | undefined> {
  const service = await getService()
  return service.getLessonById(courseSlug, lessonId)
}

export function getAllLessonsFlat(course: MockCourse): MockLesson[] {
  // This is synchronous and has the same implementation in both services
  return course.modules.flatMap((m) => m.lessons)
}

// Re-export types for convenience
export type { MockCourse, MockModule, MockLesson } from './mock-content'

/** Course id to use for on-chain calls (enroll, complete_lesson, etc.). Use onChainCourseId when set, else course.id. */
export function getCourseIdForProgram(course: { id: string; onChainCourseId?: string }): string {
  return course.onChainCourseId ?? course.id
}

/** On-chain course account shape (we only need lesson count for capping). Fetched account may be typed loosely. */
export type OnChainCourse = { lesson_count?: number }

/**
 * Effective lesson count for display and on-chain: when the course is linked to an on-chain
 * course (onChainCourseId), cap to the chain's lesson_count so we never show or complete
 * lessons that would cause "Lesson index out of bounds".
 */
export function getEffectiveLessonCount(
  course: MockCourse,
  onChainCourse: OnChainCourse | null | undefined
): number {
  const contentCount = course.modules.reduce((sum, m) => sum + m.lessons.length, 0)
  if (course.onChainCourseId && onChainCourse != null && typeof onChainCourse.lesson_count === 'number') {
    return Math.min(contentCount, onChainCourse.lesson_count)
  }
  return contentCount
}

/** First N lessons from content, capped by on-chain lesson_count when present. */
export function getEffectiveLessons(
  course: MockCourse,
  onChainCourse: OnChainCourse | null | undefined
): MockLesson[] {
  const all = getAllLessonsFlat(course)
  const cap = getEffectiveLessonCount(course, onChainCourse)
  return all.slice(0, cap)
}

/** Content course that maps to this on-chain course id (onChainCourseId or id). */
export async function getContentCourseByOnChainId(onChainCourseId: string): Promise<MockCourse | undefined> {
  const all = await getAllCourses()
  return all.find((c) => getCourseIdForProgram(c) === onChainCourseId)
}
