# ARCHITECTURE.md — Superteam Academy

## System Overview

```
┌─────────────────────────────────────────────────┐
│                    Frontend                       │
│  Next.js 14 (App Router) + TypeScript + Tailwind │
│  shadcn/ui + Monaco Editor + Wallet Adapter      │
├─────────────────────────────────────────────────┤
│              Service Layer                        │
│  LearningProgressService (interface)             │
│  ├── LocalStorageImpl (MVP stub)                 │
│  └── OnChainImpl (future, swappable)             │
├──────────┬──────────┬───────────┬───────────────┤
│  Sanity  │ Supabase │  Solana   │  Analytics    │
│  CMS     │ User DB  │  Devnet   │  GA4+PostHog  │
│  Courses │ Progress │  XP/cNFT  │  +Sentry      │
│  Content │ Auth     │  Wallet   │  Events       │
└──────────┴──────────┴───────────┴───────────────┘
```

## Directory Structure

```
superteam-academy/
├── app/                          # Next.js App Router
│   ├── (marketing)/              # Landing page group
│   │   └── page.tsx              # Landing (/)
│   ├── courses/
│   │   ├── page.tsx              # Course Catalog
│   │   └── [slug]/
│   │       ├── page.tsx          # Course Detail
│   │       └── lessons/
│   │           └── [id]/
│   │               └── page.tsx  # Lesson View + Challenge
│   ├── dashboard/
│   │   └── page.tsx              # User Dashboard
│   ├── profile/
│   │   └── [username]/
│   │       └── page.tsx          # User Profile
│   ├── leaderboard/
│   │   └── page.tsx              # Leaderboard
│   ├── certificates/
│   │   └── [id]/
│   │       └── page.tsx          # Certificate View
│   ├── settings/
│   │   └── page.tsx              # Settings
│   ├── api/
│   │   ├── auth/                 # NextAuth routes
│   │   └── progress/             # Progress API routes
│   ├── layout.tsx                # Root layout
│   ├── providers.tsx             # Context providers
│   └── globals.css               # Global styles + Tailwind
│
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── layout/
│   │   ├── Header.tsx
│   │   ├── Footer.tsx
│   │   ├── Sidebar.tsx
│   │   └── MobileNav.tsx
│   ├── courses/
│   │   ├── CourseCard.tsx
│   │   ├── CourseGrid.tsx
│   │   ├── ModuleList.tsx
│   │   └── LessonContent.tsx
│   ├── editor/
│   │   ├── CodeEditor.tsx        # Monaco wrapper
│   │   ├── TestRunner.tsx
│   │   └── ChallengePanel.tsx
│   ├── gamification/
│   │   ├── XPBar.tsx
│   │   ├── LevelBadge.tsx
│   │   ├── StreakCalendar.tsx
│   │   ├── AchievementGrid.tsx
│   │   └── LeaderboardTable.tsx
│   ├── auth/
│   │   ├── WalletButton.tsx
│   │   ├── AuthModal.tsx
│   │   └── AccountLinker.tsx
│   └── shared/
│       ├── LanguageSwitcher.tsx
│       ├── ThemeToggle.tsx
│       └── SkillRadar.tsx
│
├── lib/
│   ├── services/
│   │   ├── types.ts              # Service interfaces
│   │   ├── local-progress.ts     # LocalStorage implementation
│   │   ├── onchain-progress.ts   # On-chain implementation (stub)
│   │   └── index.ts              # Service factory
│   ├── sanity/
│   │   ├── client.ts             # Sanity client
│   │   ├── queries.ts            # GROQ queries
│   │   └── schemas/              # Content schemas
│   ├── supabase/
│   │   ├── client.ts             # Supabase client
│   │   ├── types.ts              # Database types
│   │   └── queries.ts            # User/progress queries
│   ├── solana/
│   │   ├── wallet.ts             # Wallet adapter config
│   │   ├── xp.ts                 # XP token reads
│   │   ├── credentials.ts        # cNFT reads (Bubblegum)
│   │   └── constants.ts          # Program IDs, mints
│   ├── analytics/
│   │   ├── ga4.ts                # GA4 events
│   │   ├── posthog.ts            # PostHog events
│   │   └── sentry.ts             # Error tracking
│   ├── i18n/
│   │   ├── config.ts             # i18n configuration
│   │   └── dictionaries/
│   │       ├── en.json
│   │       ├── pt-br.json
│   │       └── es.json
│   ├── gamification/
│   │   ├── xp.ts                 # XP calculation logic
│   │   ├── levels.ts             # Level derivation
│   │   ├── streaks.ts            # Streak tracking
│   │   └── achievements.ts       # Achievement definitions + checks
│   └── utils/
│       ├── cn.ts                 # Class name helper
│       └── format.ts             # Number/date formatting
│
├── content/                      # Mock course content
│   └── sample-course/
│       ├── meta.json
│       └── lessons/
│
├── public/
│   ├── images/
│   ├── icons/
│   └── fonts/
│
├── sanity/                       # Sanity Studio config
│   ├── sanity.config.ts
│   └── schemas/
│       ├── course.ts
│       ├── module.ts
│       ├── lesson.ts
│       └── challenge.ts
│
├── supabase/
│   └── schema.sql                # Database schema
│
├── docs/
│   ├── CMS_GUIDE.md
│   └── CUSTOMIZATION.md
│
├── tests/
│   ├── e2e/                      # Playwright tests
│   └── unit/                     # Component tests
│
├── .env.example
├── next.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── package.json
├── README.md
├── ARCHITECTURE.md
├── CLAUDE.md                     # For Claude Code context
└── PRD.md
```

## Data Flow

### Course Content Flow
```
Sanity CMS → GROQ Query → Server Component → Render
```

### User Progress Flow
```
User Action → LearningProgressService → Supabase (MVP) / On-chain (future)
           → XP Calculation → Level Derivation → UI Update
```

### Auth Flow
```
Wallet Connect / Google / GitHub
  → NextAuth Session
  → Supabase User Record
  → Link additional auth methods
```

### Gamification Flow
```
Complete Lesson → Award XP → Check Level Up → Check Achievements
                → Update Streak → Update Leaderboard
```

## Database Schema (Supabase)

```sql
-- Users (extended by NextAuth)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id),
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  social_links JSONB DEFAULT '{}',
  wallet_address TEXT,
  xp INTEGER DEFAULT 0,
  level INTEGER DEFAULT 1,
  current_streak INTEGER DEFAULT 0,
  longest_streak INTEGER DEFAULT 0,
  last_activity_date DATE,
  achievements BYTEA DEFAULT E'\\x00'::bytea, -- 256-bit bitmap
  preferred_language TEXT DEFAULT 'en',
  is_public BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Course Progress
CREATE TABLE enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  course_id TEXT NOT NULL, -- Sanity document ID
  progress_bitmap BYTEA DEFAULT E'\\x00'::bytea, -- lesson completion bitmap
  xp_earned INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

-- XP Transactions (audit log)
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  amount INTEGER NOT NULL,
  source TEXT NOT NULL, -- 'lesson', 'challenge', 'course', 'streak', 'achievement'
  source_id TEXT, -- lesson/course ID
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Streak History
CREATE TABLE streak_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES profiles(id),
  date DATE NOT NULL,
  lessons_completed INTEGER DEFAULT 0,
  xp_earned INTEGER DEFAULT 0,
  UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE streak_history ENABLE ROW LEVEL SECURITY;
```

## Service Interface (Swappable)

```typescript
// lib/services/types.ts

export interface Progress {
  courseId: string;
  completedLessons: number[];
  totalLessons: number;
  percentComplete: number;
  xpEarned: number;
  startedAt: Date;
  completedAt?: Date;
}

export interface StreakData {
  current: number;
  longest: number;
  lastActivityDate: Date;
  history: { date: string; lessonsCompleted: number; xpEarned: number }[];
}

export interface LeaderboardEntry {
  rank: number;
  userId: string;
  username: string;
  avatarUrl?: string;
  xp: number;
  level: number;
  streak: number;
}

export interface Credential {
  mint: string;
  track: string;
  level: number;
  issuedAt: Date;
  metadataUri: string;
  explorerUrl: string;
}

export interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: string): Promise<Credential[]>;
}
```

## Key Technical Decisions
1. **App Router over Pages Router** — Better server components, layouts, streaming
2. **Sanity over Strapi** — Better DX, hosted, real-time preview, GROQ queries
3. **Monaco over CodeMirror** — Better TypeScript/Rust support, VS Code familiarity
4. **Supabase for user data** — Auth, RLS, real-time subscriptions, familiar to team
5. **Service interface pattern** — Swap localStorage for on-chain calls without touching UI
6. **Bitmap for achievements/progress** — Matches on-chain program's bitmap approach
