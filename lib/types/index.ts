import { PublicKey } from '@solana/web3.js'

// User & Auth Types
export interface User {
  id: string
  walletAddress?: string
  googleId?: string
  githubId?: string
  email?: string
  username: string
  displayName: string
  avatar?: string
  bio?: string
  socialLinks?: Record<string, string>
  joinDate: Date
  isProfilePublic: boolean
  theme: 'light' | 'dark'
  language: 'en' | 'pt-br' | 'es'
  linkedAccounts: {
    wallet?: string
    google?: string
    github?: string
  }
}

// Course Types
export interface Course {
  id: string
  slug: string
  onchainCourseId?: string
  title: string
  description: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration: number // in minutes
  track: string
  thumbnail?: string
  instructor: {
    name: string
    avatar?: string
  }
  xpReward: number
  modules: Module[]
  enrollmentCount: number
  tags: string[]
  createdAt: Date
  updatedAt: Date
}

export interface Module {
  id: string
  courseId: string
  title: string
  description?: string
  order: number
  lessons: Lesson[]
}

export interface Lesson {
  id: string
  title: string
  description?: string
  type: 'content' | 'challenge'
  content?: string // Markdown
  order: number
  xpReward: number
  challenge?: {
    prompt: string
    starterCode: string
    testCases: Array<{
      input: string
      expectedOutput: string
      description: string
    }>
    solutionCode?: string
    hints: string[]
  }
  videoUrl?: string
}

// Progress & Gamification
export interface Progress {
  userId: string
  courseId: string
  enrolledAt: Date
  completedLessons: number[]
  completionPercentage: number
  lastAccessedLessonId?: string
  completedAt?: Date
}

export interface UserStats {
  userId: string
  totalXp: number
  level: number
  currentStreak: number
  longestStreak: number
  totalLessonsCompleted: number
  totalCoursesCompleted: number
  joinDate: Date
  lessonsCompletedToday?: number
  achievementsUnlocked?: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  category: 'progress' | 'streak' | 'skill' | 'community' | 'special'
  rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  unlockedAt?: Date
}

export interface Credential {
  id: string
  type: 'cNFT' // compressed NFT
  track: string
  level: number
  mintAddress: string
  metadata: {
    name: string
    symbol: string
    uri: string
  }
  issuedAt: Date
  issuedToWallet: string
  verificationUrl: string
}

export interface Streak {
  userId: string
  currentStreak: number
  longestStreak: number
  lastActivityDate: Date
  streakHistory: Record<string, boolean> // YYYY-MM-DD -> true/false
}

export interface LeaderboardEntry {
  rank: number
  userId: string
  username: string
  displayName?: string
  avatar?: string
  wallet?: string
  totalXp: number
  level: number
  currentStreak: number
  coursesCompleted: number
}

// Challenge Result
export interface ChallengeResult {
  passed: boolean
  output: string
  error?: string
  executionTime: number
  testsPassed: number
  totalTests: number
}

// Learning Path
export interface LearningPath {
  id: string
  title: string
  description: string
  courses: string[] // course IDs
  icon: string
  order: number
}

// Enrollment
export interface Enrollment {
  id: string
  userId: string
  courseId: string
  enrolledAt: Date
  completedAt?: Date
  completionPercentage: number
  lastAccessedAt: Date
}

// Review (optional for MVP)
export interface Review {
  id: string
  courseId: string
  userId: string
  rating: number
  comment: string
  createdAt: Date
}

// Utility functions
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100))
}

export function xpForNextLevel(currentLevel: number): number {
  const nextLevel = currentLevel + 1
  return nextLevel * nextLevel * 100
}
