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
