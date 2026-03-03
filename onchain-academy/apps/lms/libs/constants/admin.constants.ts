// ─── Types ──────────────────────────────────────────────────────────────────

export type CourseStatus = 'published' | 'draft' | 'archived'
export type CourseTrack =
  | 'Fundamentals'
  | 'DeFi'
  | 'NFTs'
  | 'Security'
  | 'Frontend'
export type CourseDifficulty = 'Beginner' | 'Intermediate' | 'Advanced'
export type UserRole = 'student' | 'author' | 'moderator' | 'admin'
export type AuthProvider = 'wallet' | 'google' | 'github'
export type LessonType = 'reading' | 'video' | 'challenge' | 'quiz'

export interface I18nField {
  en: string
  es: string
  pt: string
}

export interface AdminUser {
  id: string
  name: string
  username: string
  email: string
  avatar: string
  walletAddress: string
  authProvider: AuthProvider
  role: UserRole
  level: number
  xp: number
  coursesCompleted: number
  joinedAt: string
  lastActive: string
  suspended: boolean
}

export interface AdminCourse {
  id: string
  slug: string
  title: I18nField
  description: I18nField
  track: CourseTrack
  difficulty: CourseDifficulty
  status: CourseStatus
  xpReward: number
  thumbnail: string
  modulesCount: number
  lessonsCount: number
  enrollments: number
  completionRate: number
  createdAt: string
  updatedAt: string
}

export interface AdminLesson {
  id: string
  moduleId: string
  type: LessonType
  title: I18nField
  content: I18nField
  videoUrl?: string
  xpReward: number
  order: number
  published: boolean
}

export interface AdminModule {
  id: string
  courseId: string
  title: I18nField
  order: number
  lessons: AdminLesson[]
}

export interface AdminCMSCourse {
  id: string
  title: string
  slug: string
  modules: AdminModule[]
}

export interface AnalyticsKPI {
  label: string
  value: string
  change: string
  positive: boolean
}

export interface ChartDataPoint {
  label: string
  value: number
}

export interface AdminNavItem {
  id: string
  label: string
  href: string
  icon: string
}

// ─── Nav ────────────────────────────────────────────────────────────────────

export const ADMIN_NAV_ITEMS: AdminNavItem[] = [
  {
    id: 'overview',
    label: 'Overview',
    href: '/en/admin',
    icon: 'LayoutDashboard',
  },
  {
    id: 'courses',
    label: 'Courses',
    href: '/en/admin/courses',
    icon: 'BookOpen',
  },
  { id: 'cms', label: 'CMS Creator', href: '/en/admin/cms', icon: 'FileEdit' },
  { id: 'users', label: 'Users', href: '/en/admin/users', icon: 'Users' },
  {
    id: 'analytics',
    label: 'Analytics',
    href: '/en/admin/analytics',
    icon: 'BarChart2',
  },
]

// ─── Overview KPIs ──────────────────────────────────────────────────────────

export const OVERVIEW_KPIS = [
  {
    label: 'Total Users',
    value: '3,842',
    change: '+12.4%',
    positive: true,
    icon: 'Users',
  },
  {
    label: 'Active Today',
    value: '248',
    change: '+5.1%',
    positive: true,
    icon: 'Activity',
  },
  {
    label: 'Courses Published',
    value: '14',
    change: '+2',
    positive: true,
    icon: 'BookOpen',
  },
  {
    label: 'XP Distributed',
    value: '1.2M',
    change: '+18.7%',
    positive: true,
    icon: 'Zap',
  },
  {
    label: 'Completions',
    value: '584',
    change: '+8.3%',
    positive: true,
    icon: 'CheckCircle2',
  },
  {
    label: 'Avg. Session',
    value: '24m',
    change: '-1.2m',
    positive: false,
    icon: 'Clock',
  },
]

export const WEEKLY_ACTIVE_USERS: ChartDataPoint[] = [
  { label: 'Mon', value: 180 },
  { label: 'Tue', value: 240 },
  { label: 'Wed', value: 310 },
  { label: 'Thu', value: 275 },
  { label: 'Fri', value: 390 },
  { label: 'Sat', value: 220 },
  { label: 'Sun', value: 180 },
]

export const COMPLETION_BY_TRACK: ChartDataPoint[] = [
  { label: 'Fundamentals', value: 68 },
  { label: 'DeFi', value: 42 },
  { label: 'NFTs', value: 55 },
  { label: 'Security', value: 31 },
  { label: 'Frontend', value: 49 },
]

export const XP_PER_MONTH: ChartDataPoint[] = [
  { label: 'Oct', value: 82000 },
  { label: 'Nov', value: 110000 },
  { label: 'Dec', value: 95000 },
  { label: 'Jan', value: 148000 },
  { label: 'Feb', value: 182000 },
  { label: 'Mar', value: 210000 },
]

export const RECENT_SIGNUPS: AdminUser[] = [
  {
    id: 'u1',
    name: 'Marco Lima',
    username: 'marco_dev',
    email: 'marco@dev.br',
    avatar: '🧑‍💻',
    walletAddress: '7xKX2a...9mNp',
    authProvider: 'wallet',
    role: 'student',
    level: 3,
    xp: 950,
    coursesCompleted: 2,
    joinedAt: '2024-03-01',
    lastActive: '2024-03-02',
    suspended: false,
  },
  {
    id: 'u2',
    name: 'Sofia Reyes',
    username: 'sofia_sol',
    email: 'sofia@gmail.com',
    avatar: '👩‍💻',
    walletAddress: '4aBC...7qWe',
    authProvider: 'google',
    role: 'student',
    level: 5,
    xp: 2800,
    coursesCompleted: 4,
    joinedAt: '2024-02-28',
    lastActive: '2024-03-02',
    suspended: false,
  },
  {
    id: 'u3',
    name: 'Alex Rivera',
    username: 'alex_sol',
    email: 'alex@sol.dev',
    avatar: '🧑‍🎨',
    walletAddress: '8xKX...4mNp',
    authProvider: 'github',
    role: 'author',
    level: 7,
    xp: 4280,
    coursesCompleted: 6,
    joinedAt: '2024-02-20',
    lastActive: '2024-03-02',
    suspended: false,
  },
  {
    id: 'u4',
    name: 'Pedro Santos',
    username: 'pedro_br',
    email: 'pedro@rust.dev',
    avatar: '🦀',
    walletAddress: '2yPQ...1xKL',
    authProvider: 'wallet',
    role: 'student',
    level: 2,
    xp: 420,
    coursesCompleted: 1,
    joinedAt: '2024-03-02',
    lastActive: '2024-03-02',
    suspended: false,
  },
  {
    id: 'u5',
    name: 'Camila Torres',
    username: 'cami_web3',
    email: 'camila@web3.lat',
    avatar: '🌟',
    walletAddress: '9zAB...5rST',
    authProvider: 'wallet',
    role: 'student',
    level: 4,
    xp: 1600,
    coursesCompleted: 3,
    joinedAt: '2024-02-25',
    lastActive: '2024-03-01',
    suspended: false,
  },
]

// ─── Courses ─────────────────────────────────────────────────────────────────

export const ADMIN_COURSES: AdminCourse[] = [
  {
    id: 'c1',
    slug: 'solana-fundamentals',
    title: {
      en: 'Solana Fundamentals',
      es: 'Fundamentos de Solana',
      pt: 'Fundamentos do Solana',
    },
    description: {
      en: 'The complete beginner guide to Solana development.',
      es: 'La guía completa para principiantes en el desarrollo de Solana.',
      pt: 'O guia completo para iniciantes no desenvolvimento Solana.',
    },
    track: 'Fundamentals',
    difficulty: 'Beginner',
    status: 'published',
    xpReward: 2500,
    thumbnail: '🌊',
    modulesCount: 5,
    lessonsCount: 22,
    enrollments: 1280,
    completionRate: 68,
    createdAt: '2024-01-10',
    updatedAt: '2024-02-28',
  },
  {
    id: 'c2',
    slug: 'anchor-development',
    title: {
      en: 'Anchor Development',
      es: 'Desarrollo con Anchor',
      pt: 'Desenvolvimento com Anchor',
    },
    description: {
      en: 'Build and deploy Solana programs using the Anchor framework.',
      es: 'Construye y despliega programas Solana con Anchor.',
      pt: 'Construa e publique programas Solana com Anchor.',
    },
    track: 'Fundamentals',
    difficulty: 'Intermediate',
    status: 'published',
    xpReward: 4000,
    thumbnail: '⚓',
    modulesCount: 6,
    lessonsCount: 28,
    enrollments: 854,
    completionRate: 51,
    createdAt: '2024-01-20',
    updatedAt: '2024-03-01',
  },
  {
    id: 'c3',
    slug: 'defi-protocols',
    title: {
      en: 'DeFi Protocols on Solana',
      es: 'Protocolos DeFi en Solana',
      pt: 'Protocolos DeFi no Solana',
    },
    description: {
      en: 'Understand and build AMMs, lending protocols, and more.',
      es: 'Comprende y construye AMMs, protocolos de préstamo y más.',
      pt: 'Entenda e construa AMMs, protocolos de empréstimo e mais.',
    },
    track: 'DeFi',
    difficulty: 'Advanced',
    status: 'published',
    xpReward: 5000,
    thumbnail: '💹',
    modulesCount: 7,
    lessonsCount: 34,
    enrollments: 412,
    completionRate: 37,
    createdAt: '2024-02-01',
    updatedAt: '2024-03-01',
  },
  {
    id: 'c4',
    slug: 'metaplex-nfts',
    title: {
      en: 'Metaplex & NFTs',
      es: 'Metaplex y NFTs',
      pt: 'Metaplex e NFTs',
    },
    description: {
      en: 'Mint, manage and evolve NFTs using Metaplex Core.',
      es: 'Crea, gestiona y evoluciona NFTs con Metaplex Core.',
      pt: 'Crie, gerencie e evolua NFTs com Metaplex Core.',
    },
    track: 'NFTs',
    difficulty: 'Intermediate',
    status: 'draft',
    xpReward: 3500,
    thumbnail: '🎨',
    modulesCount: 4,
    lessonsCount: 18,
    enrollments: 0,
    completionRate: 0,
    createdAt: '2024-02-15',
    updatedAt: '2024-03-02',
  },
  {
    id: 'c5',
    slug: 'solana-security',
    title: {
      en: 'Solana Security',
      es: 'Seguridad en Solana',
      pt: 'Segurança no Solana',
    },
    description: {
      en: 'Identify and prevent common Solana program vulnerabilities.',
      es: 'Identifica y previene vulnerabilidades en programas Solana.',
      pt: 'Identifique e previna vulnerabilidades em programas Solana.',
    },
    track: 'Security',
    difficulty: 'Advanced',
    status: 'draft',
    xpReward: 4500,
    thumbnail: '🔐',
    modulesCount: 5,
    lessonsCount: 24,
    enrollments: 0,
    completionRate: 0,
    createdAt: '2024-02-20',
    updatedAt: '2024-03-01',
  },
]

// ─── CMS Course Tree ─────────────────────────────────────────────────────────

export const CMS_COURSES: AdminCMSCourse[] = [
  {
    id: 'c1',
    title: 'Solana Fundamentals',
    slug: 'solana-fundamentals',
    modules: [
      {
        id: 'm1',
        courseId: 'c1',
        order: 1,
        title: {
          en: 'Introduction to Solana',
          es: 'Introducción a Solana',
          pt: 'Introdução ao Solana',
        },
        lessons: [
          {
            id: 'l1',
            moduleId: 'm1',
            order: 1,
            type: 'reading',
            published: true,
            xpReward: 10,
            title: {
              en: 'What is Solana?',
              es: '¿Qué es Solana?',
              pt: 'O que é Solana?',
            },
            content: {
              en: '## What is Solana?\nSolana is a high-performance blockchain...',
              es: '## ¿Qué es Solana?\nSolana es una blockchain de alto rendimiento...',
              pt: '## O que é Solana?\nSolana é uma blockchain de alto desempenho...',
            },
          },
          {
            id: 'l2',
            moduleId: 'm1',
            order: 2,
            type: 'video',
            published: true,
            xpReward: 15,
            videoUrl: 'https://youtube.com/watch?v=example',
            title: {
              en: 'Solana Architecture',
              es: 'Arquitectura de Solana',
              pt: 'Arquitetura do Solana',
            },
            content: {
              en: "In this video, we explore Solana's unique architecture...",
              es: 'En este video exploramos la arquitectura única de Solana...',
              pt: 'Neste vídeo, exploramos a arquitetura única do Solana...',
            },
          },
          {
            id: 'l3',
            moduleId: 'm1',
            order: 3,
            type: 'quiz',
            published: true,
            xpReward: 25,
            title: {
              en: 'Intro Quiz',
              es: 'Quiz Intro',
              pt: 'Quiz de Introdução',
            },
            content: {
              en: 'Test your understanding of Solana basics.',
              es: 'Prueba tu comprensión de los fundamentos de Solana.',
              pt: 'Teste seu entendimento sobre os fundamentos do Solana.',
            },
          },
        ],
      },
      {
        id: 'm2',
        courseId: 'c1',
        order: 2,
        title: {
          en: 'Accounts & Programs',
          es: 'Cuentas y Programas',
          pt: 'Contas e Programas',
        },
        lessons: [
          {
            id: 'l4',
            moduleId: 'm2',
            order: 1,
            type: 'reading',
            published: true,
            xpReward: 20,
            title: {
              en: 'Understanding Accounts',
              es: 'Entendiendo las Cuentas',
              pt: 'Entendendo as Contas',
            },
            content: {
              en: '## Solana Accounts\nEvery piece of data on Solana lives in an account...',
              es: '## Cuentas en Solana\nCada dato en Solana vive en una cuenta...',
              pt: '## Contas no Solana\nCada dado no Solana vive em uma conta...',
            },
          },
          {
            id: 'l5',
            moduleId: 'm2',
            order: 2,
            type: 'challenge',
            published: false,
            xpReward: 50,
            title: {
              en: 'Write Your First Program',
              es: 'Escribe tu Primer Programa',
              pt: 'Escreva seu Primeiro Programa',
            },
            content: {
              en: 'Use the code editor below to write a simple hello world program in Rust.',
              es: 'Usa el editor de código para escribir un programa hello world en Rust.',
              pt: 'Use o editor de código para escrever um programa hello world em Rust.',
            },
          },
        ],
      },
    ],
  },
  {
    id: 'c4',
    title: 'Metaplex & NFTs',
    slug: 'metaplex-nfts',
    modules: [
      {
        id: 'm10',
        courseId: 'c4',
        order: 1,
        title: {
          en: 'NFT Basics',
          es: 'Conceptos Básicos de NFT',
          pt: 'Conceitos Básicos de NFT',
        },
        lessons: [
          {
            id: 'l20',
            moduleId: 'm10',
            order: 1,
            type: 'reading',
            published: false,
            xpReward: 10,
            title: {
              en: 'What are NFTs?',
              es: '¿Qué son los NFTs?',
              pt: 'O que são NFTs?',
            },
            content: {
              en: 'NFTs are non-fungible tokens...',
              es: 'Los NFTs son tokens no fungibles...',
              pt: 'NFTs são tokens não fungíveis...',
            },
          },
        ],
      },
    ],
  },
]

// ─── All Users ─────────────────────────────────────────────────────────────

export const ADMIN_USERS: AdminUser[] = [
  ...RECENT_SIGNUPS,
  {
    id: 'u6',
    name: 'Lucas Oliveira',
    username: 'lucas_dev',
    email: 'lucas@dev.br',
    avatar: '🦊',
    walletAddress: '3fDE...2gHI',
    authProvider: 'github',
    role: 'moderator',
    level: 6,
    xp: 3600,
    coursesCompleted: 5,
    joinedAt: '2024-01-15',
    lastActive: '2024-03-01',
    suspended: false,
  },
  {
    id: 'u7',
    name: 'Ana García',
    username: 'ana_sol',
    email: 'ana@web3.es',
    avatar: '🌺',
    walletAddress: '6eGH...8jKL',
    authProvider: 'wallet',
    role: 'student',
    level: 1,
    xp: 110,
    coursesCompleted: 0,
    joinedAt: '2024-03-01',
    lastActive: '2024-03-02',
    suspended: false,
  },
  {
    id: 'u8',
    name: 'Ravi Mendes',
    username: 'ravi_br',
    email: 'ravi@superteam.br',
    avatar: '⚡',
    walletAddress: '5cDE...0wXY',
    authProvider: 'wallet',
    role: 'admin',
    level: 9,
    xp: 8100,
    coursesCompleted: 10,
    joinedAt: '2023-12-01',
    lastActive: '2024-03-02',
    suspended: false,
  },
]

// ─── Analytics ───────────────────────────────────────────────────────────────

export const ANALYTICS_KPIS = [
  {
    label: 'Monthly Active Users',
    value: '1,842',
    change: '+14%',
    positive: true,
  },
  { label: 'Daily Active Users', value: '248', change: '+5%', positive: true },
  {
    label: 'Avg. Session Duration',
    value: '24m 18s',
    change: '-1m',
    positive: false,
  },
  { label: 'Avg. XP/Week', value: '380 XP', change: '+22%', positive: true },
]

export const FUNNEL_DATA = [
  { label: 'Registered', value: 3842, pct: 100 },
  { label: 'Enrolled (1+ course)', value: 2410, pct: 62.7 },
  { label: '25%+ Complete', value: 1380, pct: 35.9 },
  { label: 'Course Completed', value: 584, pct: 15.2 },
]

export const LOCALE_DISTRIBUTION: ChartDataPoint[] = [
  { label: 'PT-BR', value: 42 },
  { label: 'ES', value: 35 },
  { label: 'EN', value: 23 },
]

export const TOP_COURSES_ANALYTICS = [
  {
    title: 'Solana Fundamentals',
    enrollments: 1280,
    completionRate: 68,
    avgXP: 1700,
  },
  {
    title: 'Anchor Development',
    enrollments: 854,
    completionRate: 51,
    avgXP: 2040,
  },
  {
    title: 'Metaplex & NFTs',
    enrollments: 601,
    completionRate: 55,
    avgXP: 1925,
  },
  {
    title: 'DeFi Protocols',
    enrollments: 412,
    completionRate: 37,
    avgXP: 1850,
  },
  {
    title: 'Solana Security',
    enrollments: 298,
    completionRate: 31,
    avgXP: 1395,
  },
]

export const LEADERBOARD_WEEK = [
  { rank: 1, name: 'Ravi Mendes', username: 'ravi_br', avatar: '⚡', xp: 840 },
  { rank: 2, name: 'Alex Rivera', username: 'alex_sol', avatar: '🧑‍🎨', xp: 720 },
  {
    rank: 3,
    name: 'Lucas Oliveira',
    username: 'lucas_dev',
    avatar: '🦊',
    xp: 610,
  },
  {
    rank: 4,
    name: 'Sofia Reyes',
    username: 'sofia_sol',
    avatar: '👩‍💻',
    xp: 540,
  },
  { rank: 5, name: 'Marco Lima', username: 'marco_dev', avatar: '🧑‍💻', xp: 480 },
]

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const LESSON_TYPE_META: Record<
  LessonType,
  { label: string; icon: string; color: string }
> = {
  reading: { label: 'Reading', icon: '📖', color: 'blue' },
  video: { label: 'Video', icon: '🎥', color: 'purple' },
  challenge: { label: 'Code Challenge', icon: '💻', color: 'green' },
  quiz: { label: 'Quiz', icon: '❓', color: 'amber' },
}

export const STATUS_META: Record<
  CourseStatus,
  { label: string; color: string; bg: string }
> = {
  published: {
    label: 'Published',
    color: 'text-green-primary',
    bg: 'bg-green-primary/10 border-green-primary/20',
  },
  draft: {
    label: 'Draft',
    color: 'text-amber-dark',
    bg: 'bg-amber/10 border-amber/20',
  },
  archived: {
    label: 'Archived',
    color: 'text-text-tertiary',
    bg: 'bg-charcoal/8 border-border-warm',
  },
}

export const ROLE_META: Record<
  UserRole,
  { label: string; color: string; bg: string }
> = {
  admin: {
    label: 'Admin',
    color: 'text-green-primary',
    bg: 'bg-green-primary/10 border-green-primary/20',
  },
  author: {
    label: 'Author',
    color: 'text-amber-dark',
    bg: 'bg-amber/10 border-amber/20',
  },
  moderator: {
    label: 'Moderator',
    color: 'text-charcoal',
    bg: 'bg-charcoal/8 border-border-warm',
  },
  student: {
    label: 'Student',
    color: 'text-text-tertiary',
    bg: 'bg-cream border-border-warm',
  },
}

export const LOCALE_TABS = [
  { id: 'en', label: '🇺🇸 EN' },
  { id: 'es', label: '🇪🇸 ES' },
  { id: 'pt', label: '🇧🇷 PT' },
] as const

export type LocaleKey = 'en' | 'es' | 'pt'
