# Architecture

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                           Client (Browser)                          │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌───────────────────┐  │
│  │ Next.js  │  │ Wallet   │  │  Monaco   │  │    PostHog /      │  │
│  │ App      │  │ Adapter  │  │  Editor   │  │    GA4 / Sentry   │  │
│  └────┬─────┘  └────┬─────┘  └───────────┘  └───────────────────┘  │
│       │              │                                               │
└───────┼──────────────┼───────────────────────────────────────────────┘
        │              │
        ▼              ▼
┌───────────────┐  ┌───────────────┐  ┌───────────────┐
│   Next.js     │  │   Solana      │  │   Sanity      │
│   API Routes  │  │   Devnet      │  │   CMS         │
│   (NextAuth)  │  │   (RPC)       │  │   (GROQ API)  │
└───────┬───────┘  └───────────────┘  └───────────────┘
        │
        ▼
┌───────────────┐  ┌───────────────┐
│   Supabase    │  │   Resend      │
│   Postgres    │  │   (Email)     │
│   + RLS       │  │               │
└───────────────┘  └───────────────┘
```

## Component Hierarchy

```
RootLayout
├── NextIntlClientProvider
│   └── Providers
│       ├── SessionProvider (NextAuth)
│       ├── ThemeProvider (next-themes)
│       └── AnalyticsProvider
│           ├── Header
│           │   ├── GlobalSearch
│           │   ├── LanguageSwitcher
│           │   └── NotificationBell
│           ├── <Page Content>
│           └── Footer
```

## Data Flow

```
User Action
    │
    ▼
React Component (client)
    │
    ▼
Service Interface (abstraction layer)
    │
    ├──▶ Supabase Client (user data, progress, enrollments)
    ├──▶ Sanity Client (course content, lessons, media)
    └──▶ Solana RPC (XP tokens, credentials, verification)
    │
    ▼
Response → State Update → UI Re-render
```

## Route Structure

| Route | Group | Auth | Role | Description |
|-------|-------|------|------|-------------|
| `/` | — | ❌ | — | Landing page |
| `/courses` | `(public)` | ❌ | — | Course catalog |
| `/courses/[slug]` | `(public)` | ❌ | — | Course detail |
| `/courses/[slug]/lessons/[id]` | `(public)` | ❌ | — | Lesson viewer |
| `/leaderboard` | `(public)` | ❌ | — | Rankings |
| `/profile/[username]` | `(public)` | ❌ | — | Public profile |
| `/certificates/[id]` | `(public)` | ❌ | — | Certificate verification |
| `/auth/signin` | `(auth)` | ❌ | — | Sign in page |
| `/dashboard` | `(auth)` | ✅ | student+ | Student dashboard |
| `/profile` | `(auth)` | ✅ | student+ | Own profile |
| `/certificates` | `(auth)` | ✅ | student+ | My certificates |
| `/settings` | `(auth)` | ✅ | student+ | Account settings |
| `/teach/dashboard` | `(teach)` | ✅ | professor | Teacher dashboard |
| `/teach/courses` | `(teach)` | ✅ | professor | Manage courses |
| `/teach/courses/[id]/edit` | `(teach)` | ✅ | professor | Course editor |
| `/teach/courses/[id]/students` | `(teach)` | ✅ | professor | Student list |
| `/teach/analytics` | `(teach)` | ✅ | professor | Teaching analytics |
| `/admin/dashboard` | `(admin)` | ✅ | admin | Admin dashboard |
| `/admin/users` | `(admin)` | ✅ | admin | User management |
| `/admin/courses` | `(admin)` | ✅ | admin | All courses |
| `/admin/analytics` | `(admin)` | ✅ | admin | Platform analytics |

## Service Interfaces

### `AuthService`
- `signIn(provider)` — Initiate OAuth or wallet auth
- `signOut()` — End session
- `getSession()` — Current user session
- `getUser(id)` — Fetch user by ID
- `updateRole(userId, role)` — Admin: change user role

### `ContentService`
- `getCourses(filters)` — List courses with filtering
- `getCourse(slug)` — Single course with modules
- `getLesson(id)` — Lesson content
- `createCourse(data)` — Professor: new course
- `updateCourse(id, data)` — Edit course
- `publishCourse(id)` — Change status to published

### `LearningProgressService`
- `enroll(userId, courseId)` — Enroll in course
- `completeLesson(userId, lessonId)` — Mark lesson done
- `getProgress(userId, courseId)` — Course progress %
- `getEnrollments(userId)` — All enrollments
- `submitChallenge(userId, challengeId, code)` — Code submission

### `GamificationService`
- `awardXP(userId, amount, reason)` — Give XP
- `getLevel(xp)` — Calculate level from XP
- `getAchievements(userId)` — User's badges
- `unlockAchievement(userId, id)` — Grant achievement
- `checkStreak(userId)` — Streak status
- `getRewardConfig()` — XP amounts per action
- `getRank(userId)` — Leaderboard position

### `OnChainService`
- `getXPBalance(wallet)` — Read soulbound XP token
- `getCredentials(wallet)` — List cNFT credentials
- `verifyCredential(mint)` — Verify on-chain
- `getLeaderboard()` — On-chain rankings
- `mintCredential(wallet, metadata)` — Issue cNFT

### `NotificationService`
- `getNotifications(userId)` — List notifications
- `markRead(id)` — Mark as read
- `sendEmail(to, template, data)` — Transactional email

## On-Chain Integration

| Feature | Status | Details |
|---------|--------|---------|
| Wallet authentication | ✅ Implemented | Phantom, Backpack, Solflare via Wallet Adapter |
| XP token read | 🔶 Stubbed | Interface ready, reads mock balance. Wire to Token-2022 |
| cNFT credentials | 🔶 Stubbed | Interface ready, returns mock data. Wire to Bubblegum |
| On-chain verification | 🔶 Stubbed | Verifies against mock proof. Wire to Merkle tree |
| Leaderboard (on-chain) | 🔶 Stubbed | Returns mock data. Wire to token balance ranking |
| Credential minting | 🔶 Stubbed | Returns mock tx. Wire to Metaplex cNFT minting |

All on-chain features use **service interfaces** — swap the implementation without touching UI code.

## State Management

- **Server State:** React Server Components (RSC) for initial data
- **Client State:** React `useState`/`useReducer` for local UI
- **Auth State:** NextAuth session (React context)
- **Theme:** `next-themes` (persisted in cookie)
- **i18n:** `next-intl` (locale in cookie, server-resolved)
- **No global store:** No Redux/Zustand needed — RSC + service layer handles it

## Authentication Flow

```
1. User clicks "Sign In"
2. Choose provider: Google | GitHub | Wallet
   ├── OAuth: NextAuth redirects → provider → callback → session
   └── Wallet: Wallet Adapter → sign message → verify → session
3. NextAuth creates session (JWT strategy)
4. Middleware checks session + role for protected routes
5. RBAC enforced at route group level via layout.tsx
```

## i18n Architecture

```
src/i18n/
├── config.ts           # Locales: ['pt-BR', 'en', 'es'], default: 'pt-BR'
├── navigation.ts       # Localized link/router utilities
└── request.ts          # Server-side locale resolution

src/messages/
├── en.json             # English translations
├── pt-BR.json          # Portuguese translations
└── es.json             # Spanish translations
```

- Locale detected from: cookie → Accept-Language header → default
- All UI strings via `useTranslations()` hook
- CMS content localized via Sanity's i18n plugin

## CMS Content Model (Sanity)

```
Course
├── title (string, localized)
├── slug (slug)
├── description (text, localized)
├── difficulty (string: beginner | intermediate | advanced)
├── duration (number, hours)
├── xp (number)
├── thumbnail (image)
├── instructor (reference → Author)
├── prerequisites (array of string)
├── status (string: draft | published | archived)
└── modules[] (reference → Module)

Module
├── title (string, localized)
├── order (number)
└── lessons[] (reference → Lesson)

Lesson
├── title (string, localized)
├── type (string: content | challenge | quiz | video)
├── content (portable text / markdown)
├── videoUrl (url)
├── xp (number)
└── order (number)

Challenge
├── title (string)
├── description (text)
├── starterCode (code)
├── solution (code)
├── language (string)
├── testCases (array of { input, expected })
└── hints (array of string)
```
