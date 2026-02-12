// Core domain types
export interface User {
  id: string
  wallet_address: string
  email?: string
  username?: string
  avatar_url?: string
  bio?: string
  created_at: string
  updated_at: string
}

export interface UserProfile extends User {
  xp: number
  level: number
  streak: number
  rank?: number
  badges: Badge[]
  completedCourses: number
  enrolledCourses: number
}

export interface Course {
  id: string
  slug: string
  title: string
  description: string
  thumbnail_url?: string
  difficulty: 'beginner' | 'intermediate' | 'advanced'
  duration_minutes: number
  xp_reward: number
  category: string
  instructor_id: string
  instructor?: Instructor
  published: boolean
  order: number
  created_at: string
  updated_at: string
}

export interface CourseWithProgress extends Course {
  progress: number
  isEnrolled: boolean
  completedLessons: number
  totalLessons: number
}

export interface Module {
  id: string
  course_id: string
  title: string
  description: string
  order: number
  lessons?: Lesson[]
}

export interface Lesson {
  id: string
  module_id: string
  title: string
  description: string
  content: string
  lesson_type: 'video' | 'reading' | 'coding' | 'quiz'
  duration_minutes: number
  xp_reward: number
  order: number
  video_url?: string
  starter_code?: string
  solution_code?: string
  quiz_questions?: QuizQuestion[]
}

export interface QuizQuestion {
  id: string
  question: string
  options: string[]
  correct_answer: number
  explanation?: string
}

export interface LessonProgress {
  id: string
  user_id: string
  lesson_id: string
  completed: boolean
  score?: number
  time_spent_seconds: number
  completed_at?: string
  created_at: string
  updated_at: string
}

export interface Enrollment {
  id: string
  user_id: string
  course_id: string
  enrolled_at: string
  completed_at?: string
  progress: number
}

export interface Badge {
  id: string
  name: string
  description: string
  icon_url: string
  criteria: string
  xp_value: number
  rarity: 'common' | 'rare' | 'epic' | 'legendary'
}

export interface UserBadge {
  id: string
  user_id: string
  badge_id: string
  badge?: Badge
  earned_at: string
  transaction_signature?: string
}

export interface Credential {
  id: string
  user_id: string
  course_id: string
  course?: Course
  nft_mint_address?: string
  issued_at: string
  metadata_uri?: string
}

export interface Instructor {
  id: string
  name: string
  avatar_url?: string
  bio?: string
  twitter?: string
  github?: string
}

export interface LeaderboardEntry {
  rank: number
  user: UserProfile
  xp: number
  level: number
  badges_count: number
  courses_completed: number
}

export interface Achievement {
  id: string
  title: string
  description: string
  icon: string
  progress: number
  total: number
  completed: boolean
}

// Forum/Community types
export interface ForumPost {
  id: string
  title: string
  content: string
  author_id: string
  author?: User
  course_id?: string
  category: string
  upvotes: number
  replies_count: number
  created_at: string
  updated_at: string
}

export interface ForumReply {
  id: string
  post_id: string
  content: string
  author_id: string
  author?: User
  upvotes: number
  created_at: string
  updated_at: string
}

// Analytics types for admin dashboard
export interface PlatformStats {
  total_users: number
  total_courses: number
  total_enrollments: number
  total_completions: number
  active_users_7d: number
  active_users_30d: number
  avg_completion_rate: number
}

export interface CourseAnalytics {
  course_id: string
  enrollments: number
  completions: number
  completion_rate: number
  avg_time_to_complete_hours: number
  avg_score: number
  dropout_points: { lesson_id: string; dropouts: number }[]
}
