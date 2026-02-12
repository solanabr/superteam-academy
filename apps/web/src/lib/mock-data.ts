export type Difficulty = 'beginner' | 'intermediate' | 'advanced';
export type LessonType = 'text' | 'video' | 'challenge' | 'quiz';
export type UserRole = 'student' | 'professor' | 'admin';
export type CourseStatus = 'draft' | 'published' | 'archived' | 'pending';

export interface Lesson {
  id: string;
  title: string;
  type: LessonType;
  duration: number;
  completed: boolean;
  content?: string;
  videoUrl?: string;
  challenge?: ChallengeData;
  quiz?: QuizData;
}

export interface ChallengeData {
  description: string;
  starterCode: string;
  language: 'typescript' | 'rust' | 'json';
  testCases: TestCase[];
  hints: string[];
  solution: string;
  xpReward: number;
}

export interface TestCase {
  id: string;
  name: string;
  input: string;
  expectedOutput: string;
  passed?: boolean;
}

export interface QuizData {
  questions: QuizQuestion[];
  passingScore: number;
  xpReward: number;
}

export interface QuizQuestion {
  id: string;
  question: string;
  type: 'multiple-choice' | 'true-false';
  options: string[];
  correctAnswer: number;
  explanation: string;
}

export interface DiscussionComment {
  id: string;
  lessonId: string;
  author: {
    name: string;
    avatar: string;
    isProfessor: boolean;
  };
  content: string;
  timestamp: string;
  upvotes: number;
  replies: DiscussionReply[];
}

export interface DiscussionReply {
  id: string;
  author: {
    name: string;
    avatar: string;
    isProfessor: boolean;
  };
  content: string;
  timestamp: string;
  upvotes: number;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  lessons: Lesson[];
}

export interface Course {
  slug: string;
  title: string;
  description: string;
  longDescription: string;
  thumbnail: string;
  difficulty: Difficulty;
  duration: number;
  lessonCount: number;
  moduleCount: number;
  xp: number;
  enrolled: boolean;
  progress: number;
  tags: string[];
  instructor: {
    name: string;
    avatar: string;
    bio: string;
  };
  whatYoullLearn: string[];
  prerequisites: string[];
  modules: Module[];
  rating: number;
  studentCount: number;
  status?: CourseStatus;
  featured?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface LearningPath {
  id: string;
  title: string;
  description: string;
  icon: string;
  courseCount: number;
  estimatedHours: number;
  courses: string[];
}

export interface Testimonial {
  name: string;
  role: string;
  avatar: string;
  quote: string;
}

// ===== Etapa 4: Gamification, Profile & Panels =====

export interface UserProfile {
  id: string;
  username: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  role: UserRole;
  joinDate: string;
  socialLinks: {
    github?: string;
    twitter?: string;
  };
  totalXP: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  streakFreezeAvailable: boolean;
  skills: SkillData;
  earnedBadgeIds: string[];
  completedCourseIds: string[];
  enrolledCourseIds: string[];
  isProfilePublic: boolean;
  lastActive: string;
}

export interface SkillData {
  rust: number;
  anchor: number;
  frontend: number;
  security: number;
  defi: number;
  tooling: number;
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'milestone' | 'skill' | 'special' | 'streak';
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

export interface StreakDay {
  date: string;
  count: number;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  totalXP: number;
  level: number;
  currentStreak: number;
  badgeCount: number;
  weeklyXP: number;
  monthlyXP: number;
}

export interface ActivityFeedItem {
  id: string;
  userId: string;
  username: string;
  type: 'lesson_completed' | 'xp_earned' | 'badge_earned' | 'course_enrolled' | 'course_completed' | 'streak_milestone';
  description: string;
  timestamp: string;
  xp?: number;
  badgeId?: string;
  courseSlug?: string;
  lessonId?: string;
}

export interface StudentEnrollment {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  enrollmentDate: string;
  progressPercent: number;
  lessonsCompleted: number;
  quizAvgScore: number;
  lastActive: string;
}

export interface OnChainCredential {
  id: string;
  track: string;
  level: string;
  mintAddress: string;
  imageUrl: string;
  issuedAt: string;
  verified: boolean;
}

// ===== Helper functions =====

export function calculateLevel(totalXP: number): number {
  return Math.floor(Math.sqrt(totalXP / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpProgressInLevel(totalXP: number): { current: number; required: number; percent: number } {
  const level = calculateLevel(totalXP);
  const currentLevelXP = xpForLevel(level);
  const nextLevelXP = xpForLevel(level + 1);
  const current = totalXP - currentLevelXP;
  const required = nextLevelXP - currentLevelXP;
  const percent = required > 0 ? Math.round((current / required) * 100) : 100;
  return { current, required, percent };
}

export function getRankTitle(level: number): string {
  if (level >= 20) return 'Grandmaster';
  if (level >= 15) return 'Master';
  if (level >= 10) return 'Expert';
  if (level >= 7) return 'Advanced';
  if (level >= 4) return 'Intermediate';
  if (level >= 2) return 'Beginner';
  return 'Newcomer';
}

// ===== Badges =====

export const badges: Badge[] = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', icon: '👣', category: 'milestone', rarity: 'common' },
  { id: 'course-completer', name: 'Course Completer', description: 'Complete an entire course', icon: '🎓', category: 'milestone', rarity: 'rare' },
  { id: 'speed-runner', name: 'Speed Runner', description: 'Complete 5 lessons in one day', icon: '⚡', category: 'special', rarity: 'rare' },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', icon: '🔥', category: 'streak', rarity: 'common' },
  { id: 'monthly-master', name: 'Monthly Master', description: 'Maintain a 30-day streak', icon: '🏆', category: 'streak', rarity: 'epic' },
  { id: 'rust-rookie', name: 'Rust Rookie', description: 'Complete a Rust challenge', icon: '🦀', category: 'skill', rarity: 'common' },
  { id: 'anchor-expert', name: 'Anchor Expert', description: 'Complete all Anchor lessons', icon: '⚓', category: 'skill', rarity: 'epic' },
  { id: 'early-adopter', name: 'Early Adopter', description: 'Join during the first month', icon: '🌟', category: 'special', rarity: 'legendary' },
  { id: 'bug-hunter', name: 'Bug Hunter', description: 'Find a bug in a challenge', icon: '🐛', category: 'special', rarity: 'epic' },
  { id: 'perfect-score', name: 'Perfect Score', description: 'Score 100% on a quiz', icon: '💯', category: 'milestone', rarity: 'rare' },
  { id: 'defi-degen', name: 'DeFi Degen', description: 'Complete the DeFi course', icon: '💰', category: 'skill', rarity: 'epic' },
  { id: 'security-sentinel', name: 'Security Sentinel', description: 'Complete the Security course', icon: '🛡️', category: 'skill', rarity: 'epic' },
  { id: 'full-stack-hero', name: 'Full Stack Hero', description: 'Complete the Full Stack course', icon: '🚀', category: 'skill', rarity: 'legendary' },
  { id: 'xp-collector', name: 'XP Collector', description: 'Earn 1,000 XP', icon: '💎', category: 'milestone', rarity: 'common' },
  { id: 'xp-hoarder', name: 'XP Hoarder', description: 'Earn 10,000 XP', icon: '👑', category: 'milestone', rarity: 'legendary' },
  { id: 'social-butterfly', name: 'Social Butterfly', description: 'Post 10 discussion comments', icon: '🦋', category: 'special', rarity: 'rare' },
  { id: 'helping-hand', name: 'Helping Hand', description: 'Get 50 upvotes on comments', icon: '🤝', category: 'special', rarity: 'rare' },
  { id: 'night-owl', name: 'Night Owl', description: 'Complete a lesson after midnight', icon: '🦉', category: 'special', rarity: 'common' },
  { id: 'streak-freeze', name: 'Ice Shield', description: 'Use a streak freeze', icon: '🧊', category: 'streak', rarity: 'common' },
  { id: 'century', name: 'Century', description: 'Maintain a 100-day streak', icon: '💫', category: 'streak', rarity: 'legendary' },
];

// ===== User Profiles =====

export const userProfiles: UserProfile[] = [
  {
    id: 'u-1',
    username: 'carlos-silva',
    displayName: 'Carlos Silva',
    email: 'carlos@example.com',
    avatar: '/avatars/carlos.png',
    bio: 'Solana developer passionate about DeFi. Building the future of finance on-chain.',
    role: 'student',
    joinDate: '2024-01-10T00:00:00Z',
    socialLinks: { github: 'carlossilva', twitter: 'carlos_sol' },
    totalXP: 8750,
    level: 9,
    currentStreak: 23,
    longestStreak: 45,
    streakFreezeAvailable: true,
    skills: { rust: 75, anchor: 60, frontend: 85, security: 40, defi: 70, tooling: 55 },
    earnedBadgeIds: ['first-steps', 'course-completer', 'week-warrior', 'monthly-master', 'rust-rookie', 'perfect-score', 'xp-collector', 'night-owl', 'social-butterfly'],
    completedCourseIds: ['solana-fundamentals'],
    enrolledCourseIds: ['solana-fundamentals', 'defi-on-solana', 'anchor-program-development'],
    isProfilePublic: true,
    lastActive: '2024-02-10T14:30:00Z',
  },
  {
    id: 'u-2',
    username: 'marina-alves',
    displayName: 'Marina Alves',
    email: 'marina@example.com',
    avatar: '/avatars/marina.png',
    bio: 'Security researcher and Rust enthusiast. Previously EVM, now full Solana.',
    role: 'student',
    joinDate: '2024-01-15T00:00:00Z',
    socialLinks: { github: 'marinaalves', twitter: 'marina_web3' },
    totalXP: 12400,
    level: 11,
    currentStreak: 47,
    longestStreak: 47,
    streakFreezeAvailable: false,
    skills: { rust: 90, anchor: 80, frontend: 50, security: 85, defi: 60, tooling: 70 },
    earnedBadgeIds: ['first-steps', 'course-completer', 'week-warrior', 'monthly-master', 'rust-rookie', 'anchor-expert', 'perfect-score', 'xp-collector', 'xp-hoarder', 'bug-hunter', 'early-adopter'],
    completedCourseIds: ['solana-fundamentals', 'anchor-program-development'],
    enrolledCourseIds: ['solana-fundamentals', 'anchor-program-development', 'security-auditing'],
    isProfilePublic: true,
    lastActive: '2024-02-11T09:00:00Z',
  },
  {
    id: 'u-3',
    username: 'roberto-nunes',
    displayName: 'Roberto Nunes',
    email: 'roberto@example.com',
    avatar: '/avatars/roberto.png',
    bio: 'Full stack dev diving into Web3. Love building things that work.',
    role: 'student',
    joinDate: '2024-02-01T00:00:00Z',
    socialLinks: { github: 'robertonunes' },
    totalXP: 2100,
    level: 4,
    currentStreak: 5,
    longestStreak: 12,
    streakFreezeAvailable: true,
    skills: { rust: 30, anchor: 15, frontend: 90, security: 10, defi: 20, tooling: 40 },
    earnedBadgeIds: ['first-steps', 'week-warrior', 'night-owl'],
    completedCourseIds: [],
    enrolledCourseIds: ['solana-fundamentals', 'full-stack-solana-dapp'],
    isProfilePublic: true,
    lastActive: '2024-02-09T22:15:00Z',
  },
  {
    id: 'u-4',
    username: 'fernanda-lima',
    displayName: 'Fernanda Lima',
    email: 'fernanda@example.com',
    avatar: '/avatars/fernanda.png',
    bio: 'Learning Solana one lesson at a time. Goal: build a DeFi protocol.',
    role: 'student',
    joinDate: '2024-01-20T00:00:00Z',
    socialLinks: { twitter: 'ferlima_sol' },
    totalXP: 5300,
    level: 7,
    currentStreak: 15,
    longestStreak: 30,
    streakFreezeAvailable: true,
    skills: { rust: 55, anchor: 45, frontend: 65, security: 25, defi: 50, tooling: 35 },
    earnedBadgeIds: ['first-steps', 'course-completer', 'week-warrior', 'rust-rookie', 'xp-collector', 'perfect-score', 'speed-runner'],
    completedCourseIds: ['solana-fundamentals'],
    enrolledCourseIds: ['solana-fundamentals', 'defi-on-solana'],
    isProfilePublic: false,
    lastActive: '2024-02-10T18:45:00Z',
  },
  {
    id: 'u-prof-1',
    username: 'ana-santos',
    displayName: 'Ana Santos',
    email: 'ana@superteam.com',
    avatar: '/avatars/ana.png',
    bio: 'Solana core contributor and educator with 5+ years in blockchain development.',
    role: 'professor',
    joinDate: '2023-12-01T00:00:00Z',
    socialLinks: { github: 'anasantos', twitter: 'ana_solana' },
    totalXP: 25000,
    level: 15,
    currentStreak: 90,
    longestStreak: 120,
    streakFreezeAvailable: true,
    skills: { rust: 95, anchor: 90, frontend: 70, security: 80, defi: 75, tooling: 95 },
    earnedBadgeIds: ['first-steps', 'course-completer', 'week-warrior', 'monthly-master', 'century', 'rust-rookie', 'anchor-expert', 'early-adopter', 'xp-collector', 'xp-hoarder'],
    completedCourseIds: [],
    enrolledCourseIds: [],
    isProfilePublic: true,
    lastActive: '2024-02-11T10:00:00Z',
  },
  {
    id: 'u-prof-2',
    username: 'lucas-oliveira',
    displayName: 'Lucas Oliveira',
    email: 'lucas@superteam.com',
    avatar: '/avatars/lucas.png',
    bio: 'Full-stack Solana developer. Built 10+ programs in production with Anchor.',
    role: 'professor',
    joinDate: '2023-12-15T00:00:00Z',
    socialLinks: { github: 'lucasoliveira', twitter: 'lucas_anchor' },
    totalXP: 18000,
    level: 13,
    currentStreak: 60,
    longestStreak: 60,
    streakFreezeAvailable: false,
    skills: { rust: 85, anchor: 95, frontend: 80, security: 65, defi: 70, tooling: 85 },
    earnedBadgeIds: ['first-steps', 'course-completer', 'week-warrior', 'monthly-master', 'rust-rookie', 'anchor-expert', 'early-adopter', 'xp-collector', 'xp-hoarder'],
    completedCourseIds: [],
    enrolledCourseIds: [],
    isProfilePublic: true,
    lastActive: '2024-02-11T08:30:00Z',
  },
  {
    id: 'u-admin-1',
    username: 'admin',
    displayName: 'Superteam Admin',
    email: 'admin@superteam.com',
    avatar: '/avatars/admin.png',
    bio: 'Platform administrator for Superteam Academy.',
    role: 'admin',
    joinDate: '2023-11-01T00:00:00Z',
    socialLinks: { github: 'superteam-br', twitter: 'superteambr' },
    totalXP: 0,
    level: 0,
    currentStreak: 0,
    longestStreak: 0,
    streakFreezeAvailable: false,
    skills: { rust: 0, anchor: 0, frontend: 0, security: 0, defi: 0, tooling: 0 },
    earnedBadgeIds: ['early-adopter'],
    completedCourseIds: [],
    enrolledCourseIds: [],
    isProfilePublic: true,
    lastActive: '2024-02-11T12:00:00Z',
  },
];

// ===== Streak Data (last ~12 weeks for carlos-silva) =====

function generateStreakData(): StreakDay[] {
  const days: StreakDay[] = [];
  const now = new Date('2024-02-11');
  for (let i = 84; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0] ?? '';
    // Simulate activity: more recent = more active
    let count = 0;
    if (i < 23) {
      count = Math.floor(Math.random() * 5) + 1; // active streak
    } else if (i < 40) {
      count = Math.random() > 0.3 ? Math.floor(Math.random() * 3) + 1 : 0;
    } else {
      count = Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0;
    }
    days.push({ date: dateStr, count });
  }
  return days;
}

export const streakData: StreakDay[] = generateStreakData();

// ===== Leaderboard Entries =====

export const leaderboardEntries: LeaderboardEntry[] = [
  { userId: 'u-2', username: 'marina-alves', displayName: 'Marina Alves', avatar: '/avatars/marina.png', totalXP: 12400, level: 11, currentStreak: 47, badgeCount: 11, weeklyXP: 850, monthlyXP: 3200 },
  { userId: 'u-1', username: 'carlos-silva', displayName: 'Carlos Silva', avatar: '/avatars/carlos.png', totalXP: 8750, level: 9, currentStreak: 23, badgeCount: 9, weeklyXP: 620, monthlyXP: 2400 },
  { userId: 'u-4', username: 'fernanda-lima', displayName: 'Fernanda Lima', avatar: '/avatars/fernanda.png', totalXP: 5300, level: 7, currentStreak: 15, badgeCount: 7, weeklyXP: 480, monthlyXP: 1800 },
  { userId: 'u-3', username: 'roberto-nunes', displayName: 'Roberto Nunes', avatar: '/avatars/roberto.png', totalXP: 2100, level: 4, currentStreak: 5, badgeCount: 3, weeklyXP: 350, monthlyXP: 1100 },
  { userId: 'lb-5', username: 'pedro-almeida', displayName: 'Pedro Almeida', avatar: '/avatars/pedro.png', totalXP: 9800, level: 9, currentStreak: 30, badgeCount: 10, weeklyXP: 700, monthlyXP: 2800 },
  { userId: 'lb-6', username: 'juliana-ferreira', displayName: 'Juliana Ferreira', avatar: '/avatars/juliana.png', totalXP: 7600, level: 8, currentStreak: 18, badgeCount: 8, weeklyXP: 550, monthlyXP: 2100 },
  { userId: 'lb-7', username: 'diego-martins', displayName: 'Diego Martins', avatar: '/avatars/diego.png', totalXP: 6900, level: 8, currentStreak: 12, badgeCount: 7, weeklyXP: 500, monthlyXP: 1900 },
  { userId: 'lb-8', username: 'isabela-rocha', displayName: 'Isabela Rocha', avatar: '/avatars/isabela.png', totalXP: 6200, level: 7, currentStreak: 20, badgeCount: 6, weeklyXP: 450, monthlyXP: 1700 },
  { userId: 'lb-9', username: 'rafael-mendes', displayName: 'Rafael Mendes', avatar: '/avatars/rafael.png', totalXP: 5800, level: 7, currentStreak: 10, badgeCount: 6, weeklyXP: 400, monthlyXP: 1500 },
  { userId: 'lb-10', username: 'camila-santos', displayName: 'Camila Santos', avatar: '/avatars/camila.png', totalXP: 5100, level: 7, currentStreak: 8, badgeCount: 5, weeklyXP: 380, monthlyXP: 1400 },
  { userId: 'lb-11', username: 'thiago-costa', displayName: 'Thiago Costa', avatar: '/avatars/thiago.png', totalXP: 4800, level: 6, currentStreak: 14, badgeCount: 5, weeklyXP: 360, monthlyXP: 1300 },
  { userId: 'lb-12', username: 'larissa-oliveira', displayName: 'Larissa Oliveira', avatar: '/avatars/larissa.png', totalXP: 4500, level: 6, currentStreak: 6, badgeCount: 4, weeklyXP: 340, monthlyXP: 1200 },
  { userId: 'lb-13', username: 'gabriel-souza', displayName: 'Gabriel Souza', avatar: '/avatars/gabriel.png', totalXP: 4200, level: 6, currentStreak: 9, badgeCount: 4, weeklyXP: 320, monthlyXP: 1100 },
  { userId: 'lb-14', username: 'amanda-pereira', displayName: 'Amanda Pereira', avatar: '/avatars/amanda.png', totalXP: 3900, level: 6, currentStreak: 3, badgeCount: 4, weeklyXP: 300, monthlyXP: 1000 },
  { userId: 'lb-15', username: 'bruno-rodrigues', displayName: 'Bruno Rodrigues', avatar: '/avatars/bruno.png', totalXP: 3600, level: 5, currentStreak: 11, badgeCount: 3, weeklyXP: 280, monthlyXP: 950 },
  { userId: 'lb-16', username: 'patricia-moreira', displayName: 'Patricia Moreira', avatar: '/avatars/patricia.png', totalXP: 3300, level: 5, currentStreak: 7, badgeCount: 3, weeklyXP: 260, monthlyXP: 900 },
  { userId: 'lb-17', username: 'lucas-ferreira', displayName: 'Lucas Ferreira Jr.', avatar: '/avatars/lucasjr.png', totalXP: 3000, level: 5, currentStreak: 4, badgeCount: 3, weeklyXP: 240, monthlyXP: 850 },
  { userId: 'lb-18', username: 'daniela-lima', displayName: 'Daniela Lima', avatar: '/avatars/daniela.png', totalXP: 2700, level: 5, currentStreak: 2, badgeCount: 2, weeklyXP: 220, monthlyXP: 800 },
  { userId: 'lb-19', username: 'marcos-silva', displayName: 'Marcos Silva', avatar: '/avatars/marcos.png', totalXP: 2400, level: 4, currentStreak: 1, badgeCount: 2, weeklyXP: 200, monthlyXP: 750 },
  { userId: 'lb-20', username: 'carolina-alves', displayName: 'Carolina Alves', avatar: '/avatars/carolina.png', totalXP: 2200, level: 4, currentStreak: 0, badgeCount: 2, weeklyXP: 180, monthlyXP: 700 },
  { userId: 'lb-21', username: 'ricardo-santos', displayName: 'Ricardo Santos', avatar: '/avatars/ricardo.png', totalXP: 1900, level: 4, currentStreak: 3, badgeCount: 2, weeklyXP: 160, monthlyXP: 650 },
  { userId: 'lb-22', username: 'julia-costa', displayName: 'Julia Costa', avatar: '/avatars/julia.png', totalXP: 1500, level: 3, currentStreak: 0, badgeCount: 1, weeklyXP: 140, monthlyXP: 600 },
  { userId: 'lb-23', username: 'andre-nascimento', displayName: 'André Nascimento', avatar: '/avatars/andre.png', totalXP: 1200, level: 3, currentStreak: 2, badgeCount: 1, weeklyXP: 120, monthlyXP: 550 },
  { userId: 'lb-24', username: 'beatriz-rocha', displayName: 'Beatriz Rocha', avatar: '/avatars/beatriz.png', totalXP: 900, level: 3, currentStreak: 0, badgeCount: 1, weeklyXP: 100, monthlyXP: 400 },
];

// ===== Activity Feed =====

export const activityFeed: ActivityFeedItem[] = [
  { id: 'af-1', userId: 'u-1', username: 'carlos-silva', type: 'lesson_completed', description: 'Completed "Read Account Data"', timestamp: '2024-02-10T14:30:00Z', xp: 150, lessonId: 'l-2-3' },
  { id: 'af-2', userId: 'u-1', username: 'carlos-silva', type: 'xp_earned', description: 'Earned 150 XP', timestamp: '2024-02-10T14:30:00Z', xp: 150 },
  { id: 'af-3', userId: 'u-2', username: 'marina-alves', type: 'badge_earned', description: 'Earned "Monthly Master" badge', timestamp: '2024-02-10T09:00:00Z', badgeId: 'monthly-master' },
  { id: 'af-4', userId: 'u-1', username: 'carlos-silva', type: 'lesson_completed', description: 'Completed "Account Model Explained"', timestamp: '2024-02-09T16:00:00Z', xp: 50, lessonId: 'l-2-1' },
  { id: 'af-5', userId: 'u-3', username: 'roberto-nunes', type: 'course_enrolled', description: 'Enrolled in "Full Stack Solana dApp"', timestamp: '2024-02-09T11:00:00Z', courseSlug: 'full-stack-solana-dapp' },
  { id: 'af-6', userId: 'u-4', username: 'fernanda-lima', type: 'streak_milestone', description: 'Reached a 15-day streak!', timestamp: '2024-02-08T20:00:00Z' },
  { id: 'af-7', userId: 'u-1', username: 'carlos-silva', type: 'badge_earned', description: 'Earned "Social Butterfly" badge', timestamp: '2024-02-08T15:00:00Z', badgeId: 'social-butterfly' },
  { id: 'af-8', userId: 'u-2', username: 'marina-alves', type: 'course_completed', description: 'Completed "Anchor Program Development"', timestamp: '2024-02-07T12:00:00Z', courseSlug: 'anchor-program-development', xp: 3600 },
  { id: 'af-9', userId: 'u-4', username: 'fernanda-lima', type: 'lesson_completed', description: 'Completed "DeFi on Solana Overview"', timestamp: '2024-02-07T10:00:00Z', xp: 50, lessonId: 'd-1-1' },
  { id: 'af-10', userId: 'u-3', username: 'roberto-nunes', type: 'xp_earned', description: 'Earned 100 XP', timestamp: '2024-02-06T21:00:00Z', xp: 100 },
];

// ===== Student Enrollment Data =====

export const studentEnrollments: Record<string, StudentEnrollment[]> = {
  'solana-fundamentals': [
    { userId: 'u-1', username: 'carlos-silva', displayName: 'Carlos Silva', avatar: '/avatars/carlos.png', enrollmentDate: '2024-01-12T00:00:00Z', progressPercent: 45, lessonsCompleted: 11, quizAvgScore: 88, lastActive: '2024-02-10T14:30:00Z' },
    { userId: 'u-2', username: 'marina-alves', displayName: 'Marina Alves', avatar: '/avatars/marina.png', enrollmentDate: '2024-01-16T00:00:00Z', progressPercent: 100, lessonsCompleted: 24, quizAvgScore: 95, lastActive: '2024-02-05T10:00:00Z' },
    { userId: 'u-3', username: 'roberto-nunes', displayName: 'Roberto Nunes', avatar: '/avatars/roberto.png', enrollmentDate: '2024-02-02T00:00:00Z', progressPercent: 20, lessonsCompleted: 5, quizAvgScore: 72, lastActive: '2024-02-09T22:15:00Z' },
    { userId: 'u-4', username: 'fernanda-lima', displayName: 'Fernanda Lima', avatar: '/avatars/fernanda.png', enrollmentDate: '2024-01-22T00:00:00Z', progressPercent: 100, lessonsCompleted: 24, quizAvgScore: 90, lastActive: '2024-02-06T15:00:00Z' },
  ],
  'anchor-program-development': [
    { userId: 'u-1', username: 'carlos-silva', displayName: 'Carlos Silva', avatar: '/avatars/carlos.png', enrollmentDate: '2024-02-01T00:00:00Z', progressPercent: 15, lessonsCompleted: 4, quizAvgScore: 80, lastActive: '2024-02-10T14:30:00Z' },
    { userId: 'u-2', username: 'marina-alves', displayName: 'Marina Alves', avatar: '/avatars/marina.png', enrollmentDate: '2024-01-20T00:00:00Z', progressPercent: 100, lessonsCompleted: 30, quizAvgScore: 97, lastActive: '2024-02-07T12:00:00Z' },
  ],
  'defi-on-solana': [
    { userId: 'u-1', username: 'carlos-silva', displayName: 'Carlos Silva', avatar: '/avatars/carlos.png', enrollmentDate: '2024-02-05T00:00:00Z', progressPercent: 12, lessonsCompleted: 3, quizAvgScore: 75, lastActive: '2024-02-10T14:30:00Z' },
    { userId: 'u-4', username: 'fernanda-lima', displayName: 'Fernanda Lima', avatar: '/avatars/fernanda.png', enrollmentDate: '2024-02-03T00:00:00Z', progressPercent: 8, lessonsCompleted: 2, quizAvgScore: 85, lastActive: '2024-02-10T18:45:00Z' },
  ],
};

// ===== On-Chain Credentials (mock) =====

export const onChainCredentials: OnChainCredential[] = [
  { id: 'cred-1', track: 'Solana Fundamentals', level: 'Complete', mintAddress: '7nYk...3xPq', imageUrl: '/credentials/solana-fundamentals.png', issuedAt: '2024-02-01T00:00:00Z', verified: true },
  { id: 'cred-2', track: 'Anchor Development', level: 'Advanced', mintAddress: '9mBc...7yRw', imageUrl: '/credentials/anchor-advanced.png', issuedAt: '2024-02-07T00:00:00Z', verified: true },
];

// ===== Etapa 5: Certificates, Notifications, Settings =====

export type NotificationType = 'enrollment' | 'completion' | 'achievement' | 'streak_warning' | 'new_course' | 'comment_reply';

export interface CertificateData {
  id: string;
  courseName: string;
  courseSlug: string;
  recipientName: string;
  recipientWallet: string;
  completionDate: string;
  credentialLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  mintAddress: string;
  metadataUri: string;
  treeAddress: string;
  verified: boolean;
  tokenStandard: string;
  attributes: {
    track: string;
    level: string;
    xpEarned: number;
    completionDate: string;
  };
}

export interface MockNotification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  actionUrl?: string;
  icon: string;
}

export interface UserSettings {
  userId: string;
  profile: {
    name: string;
    bio: string;
    avatarUrl: string;
    github: string;
    twitter: string;
    website: string;
  };
  account: {
    walletAddress: string;
    googleEmail: string;
    githubUsername: string;
    notificationEmail: string;
  };
  preferences: {
    language: 'pt-BR' | 'en' | 'es';
    theme: 'dark' | 'light';
    emailNewCourses: boolean;
    emailStreakReminders: boolean;
    emailWeeklyDigest: boolean;
  };
  privacy: {
    profilePublic: boolean;
  };
}

export const certificates: CertificateData[] = [
  {
    id: 'cert-001',
    courseName: 'Solana Fundamentals',
    courseSlug: 'solana-fundamentals',
    recipientName: 'Carlos Silva',
    recipientWallet: '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9',
    completionDate: '2024-02-01T00:00:00Z',
    credentialLevel: 'beginner',
    mintAddress: '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9',
    metadataUri: 'https://arweave.net/abc123-solana-fundamentals',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: true,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'Solana Fundamentals', level: 'Beginner', xpEarned: 2400, completionDate: '2024-02-01' },
  },
  {
    id: 'cert-002',
    courseName: 'Anchor Program Development',
    courseSlug: 'anchor-program-development',
    recipientName: 'Marina Alves',
    recipientWallet: '9mBcR4kLpN7tYxD6wQsA2vF8eGh3jUiM5oKnZr7yRwX',
    completionDate: '2024-02-07T00:00:00Z',
    credentialLevel: 'intermediate',
    mintAddress: '9mBcR4kLpN7tYxD6wQsA2vF8eGh3jUiM5oKnZr7yRwX',
    metadataUri: 'https://arweave.net/def456-anchor-development',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: true,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'Anchor Development', level: 'Intermediate', xpEarned: 3600, completionDate: '2024-02-07' },
  },
  {
    id: 'cert-003',
    courseName: 'Solana Fundamentals',
    courseSlug: 'solana-fundamentals',
    recipientName: 'Fernanda Lima',
    recipientWallet: '4xPqR8sNvT2kLmW7yBcD6eF3gHjU9iOaZ5nMrK1wQxY',
    completionDate: '2024-02-06T00:00:00Z',
    credentialLevel: 'beginner',
    mintAddress: '4xPqR8sNvT2kLmW7yBcD6eF3gHjU9iOaZ5nMrK1wQxY',
    metadataUri: 'https://arweave.net/ghi789-solana-fundamentals-2',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: true,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'Solana Fundamentals', level: 'Beginner', xpEarned: 2400, completionDate: '2024-02-06' },
  },
  {
    id: 'cert-004',
    courseName: 'Anchor Program Development',
    courseSlug: 'anchor-program-development',
    recipientName: 'Carlos Silva',
    recipientWallet: '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9',
    completionDate: '2024-02-10T00:00:00Z',
    credentialLevel: 'intermediate',
    mintAddress: '2bMnXt8LqY5sK7wR3vFp6dEcG9hJuA4iOzNrQ1xWyTm',
    metadataUri: 'https://arweave.net/jkl012-anchor-development-2',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: true,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'Anchor Development', level: 'Intermediate', xpEarned: 3600, completionDate: '2024-02-10' },
  },
  {
    id: 'cert-005',
    courseName: 'DeFi on Solana',
    courseSlug: 'defi-on-solana',
    recipientName: 'Marina Alves',
    recipientWallet: '9mBcR4kLpN7tYxD6wQsA2vF8eGh3jUiM5oKnZr7yRwX',
    completionDate: '2024-02-09T00:00:00Z',
    credentialLevel: 'advanced',
    mintAddress: '6kWnPx3rLqT9sM2yBvE5dFaG8hJcU7iNzOrQ4xRySmV',
    metadataUri: 'https://arweave.net/mno345-defi-solana',
    treeAddress: 'BPFLoader2111111111111111111111111111111111',
    verified: false,
    tokenStandard: 'cNFT (Metaplex Bubblegum)',
    attributes: { track: 'DeFi on Solana', level: 'Advanced', xpEarned: 4200, completionDate: '2024-02-09' },
  },
];

export const mockNotifications: MockNotification[] = [
  { id: 'notif-1', userId: 'u-1', type: 'achievement', title: 'Badge Earned!', message: 'You earned the "Social Butterfly" badge', timestamp: '2024-02-11T10:00:00Z', read: false, actionUrl: '/profile', icon: '🦋' },
  { id: 'notif-2', userId: 'u-1', type: 'completion', title: 'Lesson Completed', message: 'You completed "Read Account Data" and earned 150 XP', timestamp: '2024-02-10T14:30:00Z', read: false, actionUrl: '/courses/solana-fundamentals/lessons/l-2-3', icon: '✅' },
  { id: 'notif-3', userId: 'u-1', type: 'streak_warning', title: 'Streak at Risk!', message: "You haven't studied today. Don't lose your 23-day streak!", timestamp: '2024-02-10T20:00:00Z', read: false, actionUrl: '/dashboard', icon: '🔥' },
  { id: 'notif-4', userId: 'u-1', type: 'new_course', title: 'New Course Available', message: '"Token-2022 Deep Dive" is now available. Start learning!', timestamp: '2024-02-09T09:00:00Z', read: true, actionUrl: '/courses/token-2022-deep-dive', icon: '🆕' },
  { id: 'notif-5', userId: 'u-1', type: 'comment_reply', title: 'New Reply', message: 'Ana Santos replied to your comment in "What is Solana?"', timestamp: '2024-02-08T15:30:00Z', read: true, actionUrl: '/courses/solana-fundamentals/lessons/l-1-1', icon: '💬' },
  { id: 'notif-6', userId: 'u-1', type: 'enrollment', title: 'Enrollment Confirmed', message: 'You are now enrolled in "DeFi on Solana"', timestamp: '2024-02-05T11:00:00Z', read: true, actionUrl: '/courses/defi-on-solana', icon: '📚' },
  { id: 'notif-7', userId: 'u-1', type: 'achievement', title: 'Level Up!', message: 'You reached Level 9! Keep going!', timestamp: '2024-02-04T16:00:00Z', read: true, actionUrl: '/profile', icon: '⬆️' },
  { id: 'notif-8', userId: 'u-1', type: 'completion', title: 'Course Completed!', message: 'Congratulations! You completed "Solana Fundamentals"', timestamp: '2024-02-01T18:00:00Z', read: true, actionUrl: '/certificates/cert-001', icon: '🎓' },
  { id: 'notif-9', userId: 'u-1', type: 'streak_warning', title: 'Streak Freeze Used', message: 'Your streak freeze was automatically applied yesterday', timestamp: '2024-01-28T08:00:00Z', read: true, icon: '🧊' },
  { id: 'notif-10', userId: 'u-1', type: 'new_course', title: 'Course Updated', message: '"Anchor Program Development" has 3 new lessons', timestamp: '2024-01-25T12:00:00Z', read: true, actionUrl: '/courses/anchor-program-development', icon: '📝' },
];

export const mockUserSettings: UserSettings = {
  userId: 'u-1',
  profile: {
    name: 'Carlos Silva',
    bio: 'Solana developer passionate about DeFi. Building the future of finance on-chain.',
    avatarUrl: '/avatars/carlos.png',
    github: 'carlossilva',
    twitter: 'carlos_sol',
    website: 'https://carlos.dev',
  },
  account: {
    walletAddress: '7nYkBVMqPi9T5XzE2QrR1xK3bGp8wFhN4mJcLs3xPq9',
    googleEmail: 'carlos@example.com',
    githubUsername: 'carlossilva',
    notificationEmail: 'carlos@example.com',
  },
  preferences: {
    language: 'pt-BR',
    theme: 'dark',
    emailNewCourses: true,
    emailStreakReminders: true,
    emailWeeklyDigest: false,
  },
  privacy: {
    profilePublic: true,
  },
};

// ===== Weekly Chart Data (admin) =====

export const weeklyNewUsers = [
  { week: 'W1', count: 45 },
  { week: 'W2', count: 62 },
  { week: 'W3', count: 78 },
  { week: 'W4', count: 55 },
  { week: 'W5', count: 90 },
  { week: 'W6', count: 110 },
  { week: 'W7', count: 95 },
  { week: 'W8', count: 130 },
];

export const weeklyEnrollments = [
  { week: 'W1', count: 120 },
  { week: 'W2', count: 145 },
  { week: 'W3', count: 190 },
  { week: 'W4', count: 160 },
  { week: 'W5', count: 220 },
  { week: 'W6', count: 280 },
  { week: 'W7', count: 250 },
  { week: 'W8', count: 310 },
];

// ===== Original Course Data =====

export const courses: Course[] = [
  {
    slug: 'solana-fundamentals',
    title: 'Solana Fundamentals',
    description: 'Learn the core concepts of Solana blockchain — accounts, transactions, programs, and the runtime.',
    longDescription: 'A comprehensive introduction to Solana\'s architecture. You\'ll understand how accounts work, how transactions are processed, and how programs execute on the Solana runtime. Perfect for developers new to the ecosystem.',
    thumbnail: '/courses/solana-fundamentals.png',
    difficulty: 'beginner',
    duration: 480,
    lessonCount: 24,
    moduleCount: 6,
    xp: 2400,
    enrolled: true,
    progress: 45,
    tags: ['solana', 'blockchain', 'fundamentals'],
    instructor: { name: 'Ana Santos', avatar: '/avatars/ana.png', bio: 'Solana core contributor and educator with 5+ years in blockchain development.' },
    whatYoullLearn: [
      'Understand Solana\'s account model and state management',
      'Create and sign transactions programmatically',
      'Interact with on-chain programs using the @solana/web3.js SDK',
      'Use the Solana CLI for local development and deployment',
      'Understand the Solana runtime and transaction lifecycle',
      'Work with SPL tokens and associated token accounts',
    ],
    prerequisites: [],
    modules: [
      {
        id: 'mod-1', title: 'Introduction to Solana', description: 'Overview of the Solana blockchain and its unique architecture.',
        lessons: [
          { id: 'l-1-1', title: 'What is Solana?', type: 'text', duration: 15, completed: true, content: '# What is Solana?\n\nSolana is a high-performance blockchain.' },
          { id: 'l-1-2', title: 'Solana vs Other Blockchains', type: 'video', duration: 20, completed: true, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
          { id: 'l-1-3', title: 'Setting Up Your Environment', type: 'challenge', duration: 30, completed: true, challenge: { description: '# Setting Up Your Solana Environment', starterCode: 'import { Connection } from "@solana/web3.js";\n\nasync function getCurrentSlot(): Promise<number> {\n  return 0;\n}', language: 'typescript', testCases: [{ id: 'tc-1', name: 'Creates a Connection object', input: 'new Connection()', expectedOutput: 'Connection instance created' }], hints: ['Use clusterApiUrl("devnet")'], solution: 'const connection = new Connection(clusterApiUrl("devnet"));', xpReward: 100 } },
          { id: 'l-1-4', title: 'Knowledge Check', type: 'quiz', duration: 10, completed: true, quiz: { questions: [{ id: 'q-1-1', question: 'What consensus mechanism does Solana use?', type: 'multiple-choice', options: ['PoW', 'PoH', 'PoA', 'DPoS'], correctAnswer: 1, explanation: 'Solana uses Proof of History.' }], passingScore: 75, xpReward: 50 } },
        ],
      },
      {
        id: 'mod-2', title: 'Accounts & State', description: 'Deep dive into Solana\'s account model.',
        lessons: [
          { id: 'l-2-1', title: 'Account Model Explained', type: 'text', duration: 20, completed: true, content: '# The Solana Account Model' },
          { id: 'l-2-2', title: 'Creating Accounts', type: 'video', duration: 25, completed: true, videoUrl: 'https://www.youtube.com/embed/pRYs49MqapI' },
          { id: 'l-2-3', title: 'Read Account Data', type: 'challenge', duration: 30, completed: false, challenge: { description: '# Read Account Data', starterCode: 'async function getAccountSummary(address: string) {\n  return { balanceSOL: 0, dataLength: 0 };\n}', language: 'typescript', testCases: [{ id: 'tc-2-1', name: 'Creates connection', input: 'connection', expectedOutput: 'Connection instance' }], hints: ['Use connection.getAccountInfo()'], solution: 'const info = await connection.getAccountInfo(pubkey);', xpReward: 150 } },
          { id: 'l-2-4', title: 'Account Quiz', type: 'quiz', duration: 10, completed: false, quiz: { questions: [{ id: 'q-2-1', question: 'What field determines account ownership?', type: 'multiple-choice', options: ['executable', 'lamports', 'owner', 'rent_epoch'], correctAnswer: 2, explanation: 'The owner field specifies which program has write access.' }], passingScore: 66, xpReward: 50 } },
        ],
      },
      {
        id: 'mod-3', title: 'Transactions', description: 'Learn how transactions work on Solana.',
        lessons: [
          { id: 'l-3-1', title: 'Transaction Anatomy', type: 'text', duration: 15, completed: false },
          { id: 'l-3-2', title: 'Building Transactions', type: 'video', duration: 25, completed: false, videoUrl: 'https://www.youtube.com/embed/pRYs49MqapI' },
          { id: 'l-3-3', title: 'Send SOL Challenge', type: 'challenge', duration: 35, completed: false, challenge: { description: '# Send SOL', starterCode: 'function createTransfer() { return new Transaction(); }', language: 'typescript', testCases: [{ id: 'tc-3-1', name: 'Creates valid transaction', input: 'createTransfer()', expectedOutput: 'Transaction with transfer instruction' }], hints: ['Use SystemProgram.transfer()'], solution: 'return new Transaction().add(SystemProgram.transfer({...}))', xpReward: 150 } },
          { id: 'l-3-4', title: 'Transaction Quiz', type: 'quiz', duration: 10, completed: false, quiz: { questions: [{ id: 'q-3-1', question: 'What is required in every Solana transaction?', type: 'multiple-choice', options: ['A smart contract address', 'A recent blockhash', 'A memo field', 'A gas price'], correctAnswer: 1, explanation: 'A recent blockhash prevents replay attacks.' }], passingScore: 100, xpReward: 25 } },
        ],
      },
      {
        id: 'mod-4', title: 'Programs & Instructions', description: 'Understand how Solana programs work.',
        lessons: [
          { id: 'l-4-1', title: 'Program Architecture', type: 'text', duration: 20, completed: false },
          { id: 'l-4-2', title: 'Calling Programs', type: 'video', duration: 20, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
          { id: 'l-4-3', title: 'Interact with a Program', type: 'challenge', duration: 40, completed: false },
          { id: 'l-4-4', title: 'Programs Quiz', type: 'quiz', duration: 10, completed: false },
        ],
      },
      {
        id: 'mod-5', title: 'SPL Tokens', description: 'Work with fungible and non-fungible tokens.',
        lessons: [
          { id: 'l-5-1', title: 'Token Program Overview', type: 'text', duration: 15, completed: false },
          { id: 'l-5-2', title: 'Creating Tokens', type: 'video', duration: 25, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
          { id: 'l-5-3', title: 'Mint & Transfer Tokens', type: 'challenge', duration: 35, completed: false },
          { id: 'l-5-4', title: 'Tokens Quiz', type: 'quiz', duration: 10, completed: false },
        ],
      },
      {
        id: 'mod-6', title: 'Final Project', description: 'Build a complete Solana application.',
        lessons: [
          { id: 'l-6-1', title: 'Project Requirements', type: 'text', duration: 10, completed: false },
          { id: 'l-6-2', title: 'Build Your dApp', type: 'challenge', duration: 60, completed: false },
          { id: 'l-6-3', title: 'Submit & Review', type: 'text', duration: 15, completed: false },
          { id: 'l-6-4', title: 'Final Assessment', type: 'quiz', duration: 15, completed: false },
        ],
      },
    ],
    rating: 4.8,
    studentCount: 3420,
    status: 'published',
    featured: true,
    createdAt: '2023-12-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    slug: 'anchor-program-development',
    title: 'Anchor Program Development',
    description: 'Build Solana programs with the Anchor framework — the most popular way to develop on Solana.',
    longDescription: 'Master the Anchor framework for building robust Solana programs.',
    thumbnail: '/courses/anchor.png',
    difficulty: 'intermediate',
    duration: 600,
    lessonCount: 30,
    moduleCount: 7,
    xp: 3600,
    enrolled: false,
    progress: 0,
    tags: ['anchor', 'rust', 'programs', 'solana'],
    instructor: { name: 'Lucas Oliveira', avatar: '/avatars/lucas.png', bio: 'Full-stack Solana developer. Built 10+ programs in production with Anchor.' },
    whatYoullLearn: ['Set up Anchor projects', 'Write and deploy programs', 'Use PDAs effectively', 'Implement CPIs', 'Handle errors', 'Build production contracts'],
    prerequisites: ['Solana Fundamentals', 'Basic Rust knowledge'],
    modules: [
      { id: 'a-mod-1', title: 'Getting Started with Anchor', description: 'Setup and first program.', lessons: [
        { id: 'a-1-1', title: 'What is Anchor?', type: 'text', duration: 15, completed: false },
        { id: 'a-1-2', title: 'Project Setup', type: 'video', duration: 20, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
        { id: 'a-1-3', title: 'Hello World Program', type: 'challenge', duration: 30, completed: false },
        { id: 'a-1-4', title: 'Anchor Basics Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
      { id: 'a-mod-2', title: 'Account Validation', description: 'Anchor account constraints and validation.', lessons: [
        { id: 'a-2-1', title: 'Account Structs', type: 'text', duration: 20, completed: false },
        { id: 'a-2-2', title: 'Constraints Deep Dive', type: 'video', duration: 25, completed: false, videoUrl: 'https://www.youtube.com/embed/pRYs49MqapI' },
        { id: 'a-2-3', title: 'Validate Accounts', type: 'challenge', duration: 35, completed: false },
        { id: 'a-2-4', title: 'Validation Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
      { id: 'a-mod-3', title: 'PDAs & State Management', description: 'Program Derived Addresses and on-chain state.', lessons: [
        { id: 'a-3-1', title: 'Understanding PDAs', type: 'text', duration: 20, completed: false },
        { id: 'a-3-2', title: 'State Design Patterns', type: 'video', duration: 25, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
        { id: 'a-3-3', title: 'Build a Counter', type: 'challenge', duration: 40, completed: false },
        { id: 'a-3-4', title: 'PDAs Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
    ],
    rating: 4.9,
    studentCount: 2150,
    status: 'published',
    featured: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-02-05T00:00:00Z',
  },
  {
    slug: 'defi-on-solana',
    title: 'DeFi on Solana',
    description: 'Understand and build DeFi protocols — AMMs, lending, staking, and more on Solana.',
    longDescription: 'Explore the world of decentralized finance on Solana.',
    thumbnail: '/courses/defi.png',
    difficulty: 'advanced',
    duration: 720,
    lessonCount: 28,
    moduleCount: 7,
    xp: 4200,
    enrolled: true,
    progress: 12,
    tags: ['defi', 'amm', 'lending', 'solana'],
    instructor: { name: 'Maria Costa', avatar: '/avatars/maria.png', bio: 'DeFi researcher and protocol engineer.' },
    whatYoullLearn: ['Understand AMM mechanics', 'Build a swap program', 'Implement lending logic', 'Design tokenomics', 'Integrate via CPI', 'Handle oracle feeds'],
    prerequisites: ['Anchor Program Development', 'Understanding of DeFi concepts'],
    modules: [
      { id: 'd-mod-1', title: 'DeFi Foundations', description: 'Core DeFi concepts.', lessons: [
        { id: 'd-1-1', title: 'DeFi on Solana Overview', type: 'text', duration: 20, completed: true },
        { id: 'd-1-2', title: 'Key Protocols', type: 'video', duration: 30, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
        { id: 'd-1-3', title: 'Explore DeFi dApps', type: 'challenge', duration: 25, completed: false },
        { id: 'd-1-4', title: 'DeFi Basics Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
    ],
    rating: 4.7,
    studentCount: 890,
    status: 'published',
    featured: false,
    createdAt: '2024-01-10T00:00:00Z',
    updatedAt: '2024-02-03T00:00:00Z',
  },
  {
    slug: 'security-auditing',
    title: 'Security Auditing for Solana',
    description: 'Learn to find and prevent vulnerabilities in Solana programs.',
    longDescription: 'A comprehensive security course covering common vulnerabilities in Solana programs.',
    thumbnail: '/courses/security.png',
    difficulty: 'advanced',
    duration: 540,
    lessonCount: 22,
    moduleCount: 5,
    xp: 3800,
    enrolled: false,
    progress: 0,
    tags: ['security', 'audit', 'solana', 'rust'],
    instructor: { name: 'Pedro Almeida', avatar: '/avatars/pedro.png', bio: 'Security auditor. Found 50+ critical bugs.' },
    whatYoullLearn: ['Identify vulnerabilities', 'Manual code review', 'Use fuzzing tools', 'Understand attack vectors', 'Write security tests', 'Create audit reports'],
    prerequisites: ['Anchor Program Development'],
    modules: [
      { id: 's-mod-1', title: 'Security Fundamentals', description: 'Common vulnerabilities.', lessons: [
        { id: 's-1-1', title: 'Top 10 Solana Vulnerabilities', type: 'text', duration: 25, completed: false },
        { id: 's-1-2', title: 'Attack Vectors Explained', type: 'video', duration: 30, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
        { id: 's-1-3', title: 'Find the Bug', type: 'challenge', duration: 45, completed: false },
        { id: 's-1-4', title: 'Security Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
    ],
    rating: 4.9,
    studentCount: 650,
    status: 'published',
    featured: false,
    createdAt: '2024-01-15T00:00:00Z',
    updatedAt: '2024-02-01T00:00:00Z',
  },
  {
    slug: 'token-2022-deep-dive',
    title: 'Token-2022 Deep Dive',
    description: 'Master the Token-2022 program — transfer hooks, confidential transfers, and more.',
    longDescription: 'Go beyond the basic SPL Token program.',
    thumbnail: '/courses/token2022.png',
    difficulty: 'intermediate',
    duration: 360,
    lessonCount: 18,
    moduleCount: 4,
    xp: 2800,
    enrolled: false,
    progress: 0,
    tags: ['token-2022', 'spl', 'extensions', 'solana'],
    instructor: { name: 'Rafael Mendes', avatar: '/avatars/rafael.png', bio: 'SPL contributor and token infrastructure specialist.' },
    whatYoullLearn: ['Token-2022 extensions', 'Transfer hooks', 'Interest-bearing tokens', 'Confidential transfers', 'Metadata extensions', 'Migrate from SPL Token'],
    prerequisites: ['Solana Fundamentals'],
    modules: [
      { id: 't-mod-1', title: 'Token-2022 Overview', description: 'Understanding the new token standard.', lessons: [
        { id: 't-1-1', title: 'Why Token-2022?', type: 'text', duration: 15, completed: false },
        { id: 't-1-2', title: 'Extensions Architecture', type: 'video', duration: 25, completed: false, videoUrl: 'https://www.youtube.com/embed/pRYs49MqapI' },
        { id: 't-1-3', title: 'Create a Token-2022 Mint', type: 'challenge', duration: 30, completed: false },
        { id: 't-1-4', title: 'Token-2022 Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
    ],
    rating: 4.6,
    studentCount: 1200,
    status: 'published',
    featured: false,
    createdAt: '2024-01-20T00:00:00Z',
    updatedAt: '2024-02-02T00:00:00Z',
  },
  {
    slug: 'full-stack-solana-dapp',
    title: 'Full Stack Solana dApp',
    description: 'Build a complete dApp from scratch — Anchor backend, Next.js frontend, wallet integration.',
    longDescription: 'The ultimate project-based course.',
    thumbnail: '/courses/fullstack.png',
    difficulty: 'intermediate',
    duration: 900,
    lessonCount: 36,
    moduleCount: 9,
    xp: 5000,
    enrolled: false,
    progress: 0,
    tags: ['fullstack', 'nextjs', 'anchor', 'solana', 'dapp'],
    instructor: { name: 'Juliana Ferreira', avatar: '/avatars/juliana.png', bio: 'Full-stack developer and hackathon winner.' },
    whatYoullLearn: ['Design full-stack architecture', 'Build Anchor programs', 'Create Next.js frontend', 'Real-time WebSocket updates', 'Deploy to devnet', 'Handle UX best practices'],
    prerequisites: ['Solana Fundamentals', 'Anchor Program Development', 'React/Next.js basics'],
    modules: [
      { id: 'f-mod-1', title: 'Project Planning', description: 'Architecture and design decisions.', lessons: [
        { id: 'f-1-1', title: 'App Architecture', type: 'text', duration: 20, completed: false },
        { id: 'f-1-2', title: 'Tech Stack Overview', type: 'video', duration: 15, completed: false, videoUrl: 'https://www.youtube.com/embed/1jzROE6EhxM' },
        { id: 'f-1-3', title: 'Setup Monorepo', type: 'challenge', duration: 30, completed: false },
        { id: 'f-1-4', title: 'Planning Quiz', type: 'quiz', duration: 10, completed: false },
      ] },
    ],
    rating: 4.8,
    studentCount: 1850,
    status: 'draft',
    featured: false,
    createdAt: '2024-02-01T00:00:00Z',
    updatedAt: '2024-02-10T00:00:00Z',
  },
];

export const discussionComments: DiscussionComment[] = [
  {
    id: 'dc-1', lessonId: 'l-1-1',
    author: { name: 'Carlos Silva', avatar: '/avatars/carlos.png', isProfessor: false },
    content: 'Great introduction! The comparison table really helped me understand why Solana is so fast.',
    timestamp: '2024-01-15T10:30:00Z', upvotes: 12,
    replies: [
      { id: 'dr-1', author: { name: 'Ana Santos', avatar: '/avatars/ana.png', isProfessor: true }, content: 'Thanks Carlos! Wait until you see PoH in detail!', timestamp: '2024-01-15T11:00:00Z', upvotes: 8 },
    ],
  },
  {
    id: 'dc-2', lessonId: 'l-1-1',
    author: { name: 'Marina Alves', avatar: '/avatars/marina.png', isProfessor: false },
    content: 'Can someone explain the difference between Solana\'s account model and Ethereum\'s?',
    timestamp: '2024-01-16T14:20:00Z', upvotes: 15,
    replies: [
      { id: 'dr-2', author: { name: 'Diego Martins', avatar: '/avatars/diego.png', isProfessor: false }, content: 'In Ethereum contracts hold both code and state. In Solana programs are separate from accounts.', timestamp: '2024-01-16T15:00:00Z', upvotes: 20 },
      { id: 'dr-3', author: { name: 'Ana Santos', avatar: '/avatars/ana.png', isProfessor: true }, content: 'Diego explained it perfectly!', timestamp: '2024-01-16T15:30:00Z', upvotes: 10 },
    ],
  },
];

export const learningPaths: LearningPath[] = [
  { id: 'solana-fundamentals-path', title: 'Solana Fundamentals', description: 'Start from zero and understand the Solana blockchain inside out.', icon: '🏗️', courseCount: 2, estimatedHours: 14, courses: ['solana-fundamentals', 'token-2022-deep-dive'] },
  { id: 'defi-developer', title: 'DeFi Developer', description: 'Master DeFi protocols and build your own decentralized finance applications.', icon: '💰', courseCount: 3, estimatedHours: 30, courses: ['solana-fundamentals', 'anchor-program-development', 'defi-on-solana'] },
  { id: 'security-auditor', title: 'Security Auditor', description: 'Become a Solana security expert. Find bugs, write audits, protect protocols.', icon: '🛡️', courseCount: 3, estimatedHours: 27, courses: ['solana-fundamentals', 'anchor-program-development', 'security-auditing'] },
  { id: 'full-stack-solana', title: 'Full Stack Solana', description: 'Build complete decentralized applications from backend to frontend.', icon: '🚀', courseCount: 3, estimatedHours: 33, courses: ['solana-fundamentals', 'anchor-program-development', 'full-stack-solana-dapp'] },
];

export const testimonials: Testimonial[] = [
  { name: 'Carlos Silva', role: 'Solana Developer @ Phantom', avatar: '/avatars/carlos.png', quote: 'Superteam Academy was the catalyst for my career in Web3.' },
  { name: 'Isabela Rocha', role: 'Founder, SolanaPayBR', avatar: '/avatars/isabela.png', quote: 'I went from zero blockchain knowledge to shipping a production dApp in 3 months.' },
  { name: 'Diego Martins', role: 'Security Researcher', avatar: '/avatars/diego.png', quote: 'The security auditing course is top-tier.' },
];

export const stats = {
  students: 12500,
  courses: 24,
  challenges: 3800,
  countries: 45,
};

export function findLessonById(lessonId: string): {
  course: Course;
  module: Module;
  lesson: Lesson;
  lessonIndex: number;
  totalLessons: number;
  allLessons: Lesson[];
} | null {
  for (const course of courses) {
    const allLessons: Lesson[] = course.modules.flatMap((m) => m.lessons);
    for (const mod of course.modules) {
      const lessonIdx = mod.lessons.findIndex((l) => l.id === lessonId);
      if (lessonIdx !== -1) {
        const globalIndex = allLessons.findIndex((l) => l.id === lessonId);
        return {
          course,
          module: mod,
          lesson: mod.lessons[lessonIdx]!,
          lessonIndex: globalIndex,
          totalLessons: allLessons.length,
          allLessons,
        };
      }
    }
  }
  return null;
}

export function getDiscussionForLesson(lessonId: string): DiscussionComment[] {
  return discussionComments.filter((c) => c.lessonId === lessonId);
}

// Current user helper (mock - pretend carlos-silva is logged in)
export function getCurrentUser(): UserProfile {
  return userProfiles[0]!;
}
