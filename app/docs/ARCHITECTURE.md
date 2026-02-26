# Frontend Architecture — Superteam Academy

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js App                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────┐  │
│  │  Pages    │  │Components│  │  Hooks   │  │  Services  │  │
│  │ (App      │  │ (UI +    │  │          │  │ (Interface │  │
│  │  Router)  │  │  Layout) │  │          │  │  + Impl)   │  │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────┬─────┘  │
│       │              │             │                │        │
│       └──────────────┴─────────────┴────────────────┘        │
│                            │                                 │
└────────────────────────────┼─────────────────────────────────┘
                             │
              ┌──────────────┼──────────────┐
              │              │              │
        ┌─────▼─────┐ ┌─────▼─────┐ ┌──────▼──────┐
        │  Supabase  │ │   Sanity  │ │   Solana    │
        │  (Auth +   │ │   (CMS)   │ │  (On-chain) │
        │   Data)    │ │           │ │             │
        └───────────┘ └───────────┘ └─────────────┘
```

## Directory Structure

```
src/
├── app/                        # Next.js App Router
│   ├── layout.tsx              # Root layout (fonts, metadata, providers)
│   ├── page.tsx                # Landing page
│   ├── courses/
│   │   ├── page.tsx            # Course catalog (search, filter, grid)
│   │   └── [slug]/
│   │       ├── page.tsx        # Course detail (enroll, modules, progress)
│   │       └── lessons/
│   │           └── [id]/
│   │               └── page.tsx # Lesson view (content + code editor)
│   ├── dashboard/page.tsx      # Authenticated dashboard
│   ├── profile/
│   │   ├── page.tsx            # Own profile (stats, achievements, credentials)
│   │   └── [username]/page.tsx # Public profile
│   ├── leaderboard/page.tsx    # XP leaderboard
│   ├── settings/page.tsx       # User settings (profile, locale, theme)
│   ├── certificates/[id]/page.tsx # Credential detail + on-chain verification
│   └── api/
│       ├── auth/callback/route.ts  # Supabase OAuth callback
│       ├── challenges/run/route.ts # Server-side code challenge validation
│       └── health/route.ts        # Health check endpoint
│
├── components/
│   ├── auth/                   # AuthDialog, ProtectedRoute
│   ├── gamification/           # StreakCalendar, AchievementCard, LevelRing,
│   │                           # XPNotification, GamificationStats, SkillRadar
│   ├── layout/                 # Navbar, PlatformLayout, Footer
│   ├── lesson/                 # CodeEditor (Monaco) — server-validated challenges
│   ├── providers/              # AuthProvider, SolanaProvider, ThemeProvider,
│   │                           # AnalyticsProvider
│   ├── shared/                 # XPDisplay, StreakBadge, DifficultyBadge,
│   │                           # ErrorBoundary
│   └── ui/                     # shadcn/ui primitives (20+ components)
│
├── hooks/
│   ├── use-services.ts         # React hooks wrapping service layer
│   └── use-onchain.ts          # On-chain hooks (XP, enrollment, credentials)
│
├── i18n/                       # Internationalization (next-intl)
│   ├── config.ts               # Locale config (en, pt-br, es)
│   ├── navigation.ts           # Localized Link, useRouter
│   ├── request.ts              # Server-side locale detection
│   └── messages/               # Translation files (JSON)
│
├── lib/
│   ├── constants.ts            # XP curve, track labels, site config
│   ├── utils.ts                # Tailwind merge utility
│   ├── sanity/                 # Sanity client, schemas, queries, image builder
│   ├── solana/                 # PDA derivation, program IDs, bitmap helpers
│   └── supabase/               # Supabase client (browser + server)
│
├── services/                   # Service layer (interface + implementation)
│   ├── *-service.ts            # 10 service interfaces
│   ├── implementations/        # Sanity, Supabase, and mock implementations
│   └── index.ts                # Smart service selection (Sanity vs mock)
│
├── stores/                     # Zustand state management
│   └── use-auth-store.ts       # Auth state store
│
└── types/                      # TypeScript type definitions
    └── index.ts                # Course, Enrollment, XP, Credential, etc.
```

## Data Flow

### Course Content Flow

```
Sanity CMS ──GROQ──▶ sanityCourseService ──▶ useCourse() ──▶ Page
                                            │
         OR                                 │
                                            │
mock-course-service ────────────────────────┘
     (auto-selected when no Sanity config)
```

### Authentication Flow

```
User clicks "Sign In"
  │
  ├──▶ Wallet Connect (Solana Wallet Standard)
  │     └──▶ signMessage() ──▶ Supabase custom auth
  │
  └──▶ OAuth (Google / GitHub)
        └──▶ Supabase Auth ──▶ /api/auth/callback
                              └──▶ Session cookie set
```

### On-Chain Integration Flow

```
Frontend Hooks                    Solana Program
─────────────                     ──────────────
useOnChainXP()     ◀─read──      Token-2022 ATA (soulbound XP)
useOnChainEnrollment() ◀─read──  Enrollment PDA
useEnrollOnChain() ──write──▶    enroll instruction
useOnChainCredentials() ◀─read── Metaplex Core NFTs (via Helius DAS)
useOnChainConfig() ◀─read──     Config PDA
```

## Provider Stack

```
<html>
  <NextIntlClientProvider>        (i18n)
    <ThemeProvider>                (dark/light mode)
      <SolanaProvider>             (wallet connection)
        <AuthProvider>             (Supabase auth state)
          <TooltipProvider>        (shadcn/ui tooltips)
            <AnalyticsProvider>    (GA4 + PostHog pageviews)
              {children}
            </AnalyticsProvider>
          </TooltipProvider>
        </AuthProvider>
      </SolanaProvider>
    </ThemeProvider>
  </NextIntlClientProvider>
</html>
```

## Service Layer Pattern

Every domain uses an **interface + implementation** pattern:

```typescript
// Interface (src/services/course-service.ts)
export interface CourseService {
  getCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
}

// Implementation (src/services/implementations/sanity-course-service.ts)
export const sanityCourseService: CourseService = { ... };

// Mock fallback (src/services/implementations/mock-course-service.ts)
export const mockCourseService: CourseService = { ... };

// Smart selection (src/services/index.ts)
export const courseService: CourseService =
  process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
    ? sanityCourseService
    : mockCourseService;
```

This enables:
- Zero-config development (mock data works out of the box)
- Easy testing (inject mock services)
- Swappable backends (Sanity → Strapi, Supabase → PostgreSQL, etc.)

## Offline / PWA

The app supports real offline course reading via Service Worker + IndexedDB:

1. **Service Worker** (`public/sw.js`) — network-first for navigation, stale-while-revalidate for static assets. Enrolled users can cache entire courses (all lesson pages) into a dedicated `academy-courses` cache via message-passing.
2. **IndexedDB** (`src/lib/offline-store.ts`) — `academy-offline` database with two object stores:
   - `courses` — full course metadata + slug-based key, for listing saved courses
   - `completions` — queued lesson completions made while offline, synced via `/api/progress/offline-sync` when connectivity returns
3. **React hooks** (`src/hooks/use-offline.ts`) — `useOnlineStatus`, `useServiceWorker`, `useOfflineCourse`, `useOfflineCourses`, `useOfflineCompletion`
4. **UI** — "Save for Offline" button on course detail (enrolled only), amber offline banner on lessons, `/offline` page listing saved courses + pending sync count
5. **Sync** — `useOfflineCompletion` auto-POSTs pending completions to `/api/progress/offline-sync` when `navigator.onLine` flips to `true`

Zero database impact — all offline data is client-side only.

## Performance Considerations

- **Turbopack** for fast HMR in development
- **Dynamic imports** for Monaco Editor (heavy bundle)
- **Resizable panels** for lesson split layout
- **oklch colors** for perceptually uniform dark mode
- **Image optimization** via Sanity CDN or Next.js Image
- **Service Worker** caching for offline + faster repeat visits

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| App Router (not Pages) | Server components, layouts, streaming |
| Tailwind v4 (not v3) | oklch native, @theme directive, CSS-first config |
| shadcn/ui (not MUI) | Copy-paste components, full control, small bundle |
| Zustand (not Redux) | Minimal boilerplate, React 19 compatible |
| next-intl (not i18next) | App Router native, type-safe, ICU syntax |
| Service interfaces | Swappable backends, testable, mock-first dev |
| Token-2022 for XP | Soulbound (NonTransferable), wallet-visible |
| Metaplex Core for creds | Soulbound NFTs, upgradeable, DAS queryable |
| IndexedDB for offline | Client-side only, zero DB impact, auto-sync |
