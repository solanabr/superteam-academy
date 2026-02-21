import { PublicKey } from '@solana/web3.js'

export interface User {
  id: string
  email?: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  wallet?: string
  googleId?: string
  githubId?: string
  xp: number
  level: number
  streak: number
  lastActiveDate: string
  joinDate: string
  achievements: number // Bitmap
  skills: string[]
  preferences: UserPreferences
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  language: 'en' | 'pt-BR' | 'es'
  notifications: {
    email: boolean
    push: boolean
    achievements: boolean
    courseUpdates: boolean
  }
  privacy: {
    showProfile: boolean
    showProgress: boolean
    showAchievements: boolean
  }
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  longDescription: string
  thumbnail: string
  banner?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in hours
  xpReward: number
  tags: string[]
  category: string
  language: string
  instructor: {
    name: string
    avatar: string
    bio: string
  }
  modules: Module[]
  totalLessons: number
  totalChallenges: number
  publishedAt: string
  updatedAt: string
  isPublished: boolean
  prerequisites: string[]
  learningOutcomes: string[]
}

export interface Module {
  id: string
  courseId: string
  title: string
  description: string
  order: number
  lessons: Lesson[]
  xpReward: number
  estimatedDuration: number // in minutes
}

export interface Lesson {
  id: string
  moduleId: string
  courseId: string
  title: string
  description: string
  content: string // Markdown content
  order: number
  type: 'lesson' | 'challenge' | 'quiz'
  xpReward: number
  estimatedDuration: number // in minutes
  codeChallenge?: CodeChallenge
  quiz?: Quiz
  resources: Resource[]
}

export interface CodeChallenge {
  id: string
  lessonId: string
  prompt: string
  starterCode: string
  solutionCode: string
  testCases: TestCase[]
  hints: string[]
  language: 'rust' | 'javascript' | 'typescript' | 'python'
}

export interface TestCase {
  id: string
  input: string
  expectedOutput: string
  description: string
  isHidden?: boolean
}

export interface Quiz {
  id: string
  lessonId: string
  questions: QuizQuestion[]
  passingScore: number
}

export interface QuizQuestion {
  id: string
  type: 'multiple-choice' | 'true-false' | 'code-completion'
  question: string
  options: string[]
  correctAnswer: number | string
  explanation: string
}

export interface Resource {
  id: string
  title: string
  type: 'link' | 'file' | 'video'
  url: string
  description?: string
}

export interface Progress {
  userId: string
  courseId: string
  currentModuleId?: string
  currentLessonId?: string
  completedLessons: string[]
  completedChallenges: string[]
  score: number // 0-100
  xpEarned: number
  startedAt: string
  lastAccessedAt: string
  completedAt?: string
  timeSpent: number // in minutes
}

export interface StreakData {
  current: number
  longest: number
  lastActiveDate: string
  weeklyActivity: number[] // 7 numbers representing last 7 days
  monthlyActivity: { [key: string]: number } // date -> activity count
}

export interface Achievement {
  id: number // Bit position (0-255)
  name: string
  description: string
  icon: string
  category: 'progress' | 'streaks' | 'skills' | 'community' | 'special'
  requirement: string
  xpReward: number
  unlockedAt?: string
}

export interface LeaderboardEntry {
  userId: string
  username: string
  displayName: string
  avatar?: string
  xp: number
  level: number
  rank: number
  weeklyXP?: number
  monthlyXP?: number
}

export interface Credential {
  id: string
  userId: string
  courseId: string
  courseName: string
  issuer: string
  issuedAt: string
  certificateUrl?: string
  onChainTxId?: string
  metadata: {
    skills: string[]
    xpEarned: number
    completionTime: number // in days
    finalScore: number
  }
}

export interface ActivityFeedItem {
  id: string
  userId: string
  type: 'lesson_completed' | 'challenge_solved' | 'course_completed' | 'achievement_unlocked' | 'streak_milestone'
  title: string
  description: string
  timestamp: string
  metadata?: {
    courseId?: string
    lessonId?: string
    achievementId?: number
    xpGained?: number
  }
}

// Service Interfaces
export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>
  getXP(userId: string): Promise<number>
  getStreak(userId: string): Promise<StreakData>
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>
  getCredentials(wallet: PublicKey): Promise<Credential[]>
  getUserProgress(userId: string): Promise<Progress[]>
  updateProgress(progress: Partial<Progress>): Promise<void>
}

export interface UserService {
  getUser(id: string): Promise<User | null>
  updateUser(id: string, updates: Partial<User>): Promise<User>
  getUserByWallet(wallet: string): Promise<User | null>
  linkWallet(userId: string, wallet: string): Promise<void>
  unlinkWallet(userId: string): Promise<void>
}

export interface CourseService {
  getCourses(filters?: CourseFilters): Promise<Course[]>
  getCourse(slug: string): Promise<Course | null>
  getCourseById(id: string): Promise<Course | null>
  searchCourses(query: string, filters?: CourseFilters): Promise<Course[]>
}

export interface CourseFilters {
  category?: string
  difficulty?: 'beginner' | 'intermediate' | 'advanced'
  language?: string
  tags?: string[]
  duration?: {
    min?: number
    max?: number
  }
}

export interface AchievementService {
  getUserAchievements(userId: string): Promise<Achievement[]>
  checkAndUnlockAchievements(userId: string, context: AchievementContext): Promise<Achievement[]>
  getAllAchievements(): Promise<Achievement[]>
}

export interface AchievementContext {
  type: 'lesson_completed' | 'course_completed' | 'streak_milestone' | 'challenge_solved'
  data: {
    courseId?: string
    lessonId?: string
    streakCount?: number
    challengeCount?: number
    xpGained?: number
  }
}

// Theme types
export type Theme = 'dark' | 'light' | 'system'

// Component Props
export interface CourseCardProps {
  course: Course
  progress?: Progress
  showProgress?: boolean
  variant?: 'default' | 'compact'
}

export interface LessonNavigationProps {
  course: Course
  currentLesson: Lesson
  progress: Progress
  onLessonSelect: (lesson: Lesson) => void
}

export interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language: string
  readOnly?: boolean
  height?: string
  theme?: 'vs-dark' | 'vs-light'
}

export interface XPBadgeProps {
  xp: number
  variant?: 'default' | 'large' | 'compact'
  showLevel?: boolean
}

export interface ProgressBarProps {
  progress: number
  showPercentage?: boolean
  variant?: 'default' | 'thin' | 'thick'
  color?: 'primary' | 'success' | 'warning' | 'error'
}

// V1 compatibility types
export interface CourseWithMetadata extends Course {
  totalLessons: number
  totalXP: number
  estimatedHours: number
  tags: string[]
  prerequisites: string[]
  track: string
}

export interface Enrollment {
  courseId: string
  learner: string
  completedLessons: number[]
  enrolledAt: string
  completedAt?: string
  progress: number
}

export interface QuizData {
  questions: {
    id: string
    question: string
    options: string[]
    correctAnswer: number
    explanation?: string
  }[]
}