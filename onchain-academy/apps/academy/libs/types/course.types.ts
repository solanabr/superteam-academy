// ─── Payload CMS DB shapes ─────────────────────────────────────
// Raw types matching collection fields from /collections/*.ts
// Used to properly type API responses from the REST layer.

export interface PayloadCourse {
  id: string | number
  title: string
  slug: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration?: string
  totalLessons?: number
  xpReward: number
  topic?: string
  longDescription?: unknown
  rating?: number
  ratingCount?: number
  enrollmentCount?: number
  language?: string
  lastUpdated?: string
  status: 'draft' | 'published'
  certificate?: boolean
  onChainCredential?: boolean
  instructor?:
    | {
        id: string | number
        name?: string
        username?: string
      }
    | string
    | number
    | null
  thumbnail?:
    | {
        url?: string
        filename?: string
      }
    | string
    | null
  learningOutcomes?: Array<{ outcome: string; id?: string }>
  prerequisites?: Array<{ prerequisite: string; id?: string }>
  createdAt?: string
  updatedAt?: string
}

export interface PayloadModule {
  id: string | number
  title: string
  sortOrder: number
  course: string | number | { id: string | number }
}

export interface PayloadLesson {
  id: string | number
  title: string
  type: 'video' | 'reading' | 'code_challenge' | 'quiz' | 'hybrid'
  duration?: string
  xpReward: number
  sortOrder: number
  onChainLessonIndex?: number
  module:
    | string
    | number
    | { id: string | number; title?: string; course?: unknown }
}

export interface PayloadLessonContent {
  id: string | number
  lesson: string | number | { id: string | number }
  blocks?: unknown[]
  quiz?: unknown
  challenge?: unknown
  hints?: unknown[]
  solution?: string
}

// ─── Payload API response wrapper ──────────────────────────────

export interface PayloadResponse<T> {
  docs: T[]
  totalDocs: number
  limit: number
  page: number
  totalPages: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

// ─── UI-ready adapted shapes ───────────────────────────────────
// These match what CourseCard / CourseSlug / Courses.tsx expect

export interface UICourse {
  id: string
  slug: string
  title: string
  description: string
  /** Normalized to 'Beginner' | 'Intermediate' | 'Advanced' */
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced'
  duration: string
  /** Total lesson count */
  lessons: number
  xp: number
  instructor: { name: string; avatar?: string; verified: boolean }
  topic: string
  enrolled: boolean
  progress: number
  thumbnail?: string
  certificate: boolean
  onChainCredential: boolean
  learningOutcomes: string[]
  prerequisites: string[]
  /** Kept for CourseCard compat — filled separately when needed */
  modules: UIModule[]
  /** Kept for CourseCard compat — filled separately when needed */
  reviews: Array<{ name: string; rating: number; text: string; date: string }>
}

export interface UIModule {
  id: string
  title: string
  lessons: UILesson[]
}

export interface UILesson {
  id: string
  title: string
  type: 'Video' | 'Reading' | 'Code Challenge' | 'Quiz' | 'Hybrid'
  duration: string
  completed: boolean
  active?: boolean
  locked?: boolean
}

// ─── Lesson Content UI Blocks ──────────────────────────────────

export type ContentBlock =
  | { type: 'markdown'; content: string }
  | { type: 'video'; url: string; title?: string }
  | { type: 'callout'; variant: 'info' | 'warning' | 'tip'; content: string }

export interface CodeChallenge {
  prompt: string
  objectives: string[]
  starterCode: string
  language: 'rust' | 'typescript' | 'json'
  testCases: { name: string; expected: string; passed: boolean }[]
  expectedOutput: string
  solutionCode: string
}

export interface QuizQuestion {
  id: string
  type: 'radio' | 'checkbox' | 'code'
  prompt: string
  options?: string[]
  correctIndex?: number
  correctIndices?: number[]
  starterCode?: string
  language?: string
  expected?: string
}

export interface Quiz {
  questions: QuizQuestion[]
}

export interface LessonContent {
  id: string
  courseSlug: string
  moduleId: string
  moduleTitle: string
  title: string
  type: 'video' | 'reading' | 'code_challenge' | 'quiz' | 'hybrid'
  xpReward: number
  completed: boolean
  duration: string
  blocks: ContentBlock[]
  challenge?: CodeChallenge
  quiz?: Quiz
  hints?: string[]
  solution?: string
}

// ─── Adapters ──────────────────────────────────────────────────

const DIFFICULTY_MAP: Record<string, UICourse['difficulty']> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
}

const LESSON_TYPE_MAP: Record<string, UILesson['type']> = {
  video: 'Video',
  reading: 'Reading',
  code_challenge: 'Code Challenge',
  quiz: 'Quiz',
  hybrid: 'Hybrid',
}

export const toCourseCard = (c: PayloadCourse): UICourse => {
  const instructorName =
    c.instructor && typeof c.instructor === 'object' && 'name' in c.instructor
      ? (c.instructor.name ?? 'Superteam Academy')
      : 'Superteam Academy'

  const thumbnailUrl =
    c.thumbnail && typeof c.thumbnail === 'object' && 'url' in c.thumbnail
      ? c.thumbnail.url
      : undefined

  return {
    id: String(c.id),
    slug: c.slug,
    title: c.title,
    description: c.description,
    difficulty: DIFFICULTY_MAP[c.difficulty] ?? 'Beginner',
    duration: c.duration ?? '—',
    lessons: c.totalLessons ?? 0,
    xp: c.xpReward,
    instructor: { name: instructorName, verified: true },
    topic: c.topic ?? 'Core',
    enrolled: false,
    progress: 0,
    thumbnail: thumbnailUrl,
    certificate: c.certificate ?? false,
    onChainCredential: c.onChainCredential ?? false,
    learningOutcomes: (c.learningOutcomes ?? []).map((lo) => lo.outcome),
    prerequisites: (c.prerequisites ?? []).map((p) => p.prerequisite),
    modules: [],
    reviews: [],
  }
}

export const toUILesson = (l: PayloadLesson): UILesson => ({
  id: String(l.id),
  title: l.title,
  type: LESSON_TYPE_MAP[l.type] ?? 'Reading',
  duration: l.duration ?? '—',
  completed: false,
  active: false,
  locked: false,
})

export const toUIModule = (
  m: PayloadModule,
  lessons: PayloadLesson[],
): UIModule => ({
  id: String(m.id),
  title: m.title,
  lessons: lessons.map(toUILesson),
})
