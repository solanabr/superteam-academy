import { sanityClient } from '@/lib/sanity/client'
import type { MockCourse, MockModule, MockLesson } from './mock-content'

// Sanity query types
interface SanityCourse {
  _id: string
  id: string
  onChainCourseId?: string
  slug: { current: string }
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  lessonCount: number
  xpPerLesson: number
  duration: string
  tags?: string[]
  image?: any
  modules: SanityModule[]
  published?: boolean
}

interface SanityModule {
  title: string
  lessons: SanityLesson[]
}

interface SanityLesson {
  id: string
  title: string
  type: 'content' | 'challenge'
  duration: string
  content: string
  challengeCode?: string
  challengeTests?: string
}

// GROQ queries
const COURSE_QUERY = `*[_type == "course" && published == true] | order(_createdAt desc) {
  _id,
  id,
  onChainCourseId,
  slug,
  title,
  description,
  difficulty,
  lessonCount,
  xpPerLesson,
  duration,
  tags,
  image,
  modules[] {
    title,
    lessons[] {
      id,
      title,
      type,
      duration,
      content,
      challengeCode,
      challengeTests
    }
  }
}`

const COURSE_BY_SLUG_QUERY = `*[_type == "course" && slug.current == $slug && published == true][0] {
  _id,
  id,
  onChainCourseId,
  slug,
  title,
  description,
  difficulty,
  lessonCount,
  xpPerLesson,
  duration,
  tags,
  image,
  modules[] {
    title,
    lessons[] {
      id,
      title,
      type,
      duration,
      content,
      challengeCode,
      challengeTests
    }
  }
}`

// Transform Sanity data to app format
function transformCourse(sanityCourse: SanityCourse): MockCourse {
  return {
    id: sanityCourse.id,
    onChainCourseId: sanityCourse.onChainCourseId ?? undefined,
    slug: sanityCourse.slug.current,
    title: sanityCourse.title,
    description: sanityCourse.description,
    difficulty: sanityCourse.difficulty,
    lessonCount: sanityCourse.lessonCount,
    xpPerLesson: sanityCourse.xpPerLesson,
    duration: sanityCourse.duration,
    tags: sanityCourse.tags || [],
    modules: sanityCourse.modules.map(transformModule),
  }
}

function transformModule(sanityModule: SanityModule): MockModule {
  return {
    title: sanityModule.title,
    lessons: sanityModule.lessons.map(transformLesson),
  }
}

function transformLesson(sanityLesson: SanityLesson): MockLesson {
  return {
    id: sanityLesson.id,
    title: sanityLesson.title,
    type: sanityLesson.type,
    duration: sanityLesson.duration,
    content: sanityLesson.content,
    challengeCode: sanityLesson.challengeCode,
    challengeTests: sanityLesson.challengeTests,
  }
}

// Public API (matches mock-content.ts interface)
export async function getAllCourses(): Promise<MockCourse[]> {
  try {
    const courses = await sanityClient.fetch<SanityCourse[]>(COURSE_QUERY)
    return courses.map(transformCourse)
  } catch (error) {
    console.error('Error fetching courses from Sanity:', error)
    return []
  }
}

export async function getCourseBySlug(slug: string): Promise<MockCourse | undefined> {
  try {
    const course = await sanityClient.fetch<SanityCourse | null>(COURSE_BY_SLUG_QUERY, { slug })
    return course ? transformCourse(course) : undefined
  } catch (error) {
    console.error('Error fetching course from Sanity:', error)
    return undefined
  }
}

export async function getLessonById(
  courseSlug: string,
  lessonId: string
): Promise<{ course: MockCourse; lesson: MockLesson; moduleTitle: string; lessonIndex: number } | undefined> {
  try {
    const course = await getCourseBySlug(courseSlug)
    if (!course) return undefined

    let idx = 0
    for (const mod of course.modules) {
      for (const lesson of mod.lessons) {
        if (lesson.id === lessonId) {
          return { course, lesson, moduleTitle: mod.title, lessonIndex: idx }
        }
        idx++
      }
    }
    return undefined
  } catch (error) {
    console.error('Error fetching lesson from Sanity:', error)
    return undefined
  }
}

export function getAllLessonsFlat(course: MockCourse): MockLesson[] {
  return course.modules.flatMap((m) => m.lessons)
}
