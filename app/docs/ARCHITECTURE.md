# Architecture Guide

## System Overview

Caminho. is a Next.js 16 application using the App Router with a clear separation between public and authenticated experiences.

```
┌─────────────────────────────────────────────────────┐
│                    Next.js App                       │
│                                                     │
│  ┌──────────────┐    ┌───────────────────────────┐  │
│  │  (public)     │    │  (app) - authenticated     │  │
│  │  Landing      │    │  Dashboard                 │  │
│  │  Auth pages   │    │  Courses (catalog+detail)  │  │
│  │  Navbar+Footer│    │  Leaderboard               │  │
│  └──────┬───────┘    │  Profile / Settings         │  │
│         │            │  Certificates               │  │
│         │            │  Collapsible Sidebar         │  │
│         │            └──────────┬──────────────────┘  │
│         │                       │                     │
│  ┌──────┴───────────────────────┴──────────────────┐  │
│  │              Providers Layer                      │  │
│  │  ThemeProvider > I18nProvider > AuthProvider >     │  │
│  │  WalletProvider                                   │  │
│  └──────────────────────────────────────────────────┘  │
└──────────────────┬──────────────────────────────────┘
                   │
     ┌─────────────┼──────────────┐
     │             │              │
┌────┴────┐  ┌────┴────┐  ┌─────┴─────┐
│ Supabase│  │  Sanity  │  │  Solana   │
│  Auth   │  │   CMS    │  │  Wallets  │
│  DB     │  │ Courses  │  │  (devnet) │
│  RLS    │  │ Lessons  │  │           │
└─────────┘  └─────────┘  └───────────┘
```

## Route Groups

### `(public)` - Public Layout
- **Layout**: `Navbar` (top) + `Footer` (bottom)
- **Pages**: Landing (`/`), Auth (`/auth/sign-in`, `/auth/sign-up`), Auth Callback
- No sidebar, no authentication required

### `(app)` - Authenticated Layout
- **Layout**: `DashboardSidebar` (left) + content area
- **Pages**: Dashboard, Courses, Leaderboard, Profile, Settings, Certificates
- Sidebar is collapsible (persisted via `SidebarContext`)
- Responsive: sidebar collapses to mobile drawer on small screens

## Data Flow

### Authentication
```
User clicks "Sign In" / "Connect Wallet"
        │
        ├── Email/Google/GitHub ──> Supabase Auth ──> Session cookie
        │
        └── Wallet ──> Sign message ──> POST /api/auth/wallet
                                              │
                                    Verify signature
                                              │
                                    Create/find Supabase user
                                              │
                                    Link wallet to profile
                                              │
                                    Return session
```

### Learning Progress
```
User completes lesson
        │
        ▼
LearningProgressService.completeLesson()
        │
        ├── Insert into lesson_completions
        ├── Insert XP event into xp_events
        ├── Update user_xp_summary (upsert)
        └── Return updated XP data
```

### CMS Content
```
Sanity CMS ──GROQ queries──> Next.js Server Components
                                      │
                              ┌───────┴───────┐
                              │               │
                         Static pages    Dynamic pages
                        (revalidate=60) (on-demand)
```

## State Management

| State | Solution | Scope |
|-------|----------|-------|
| Auth session | Supabase + AuthProvider context | Global |
| User profile | AuthProvider (fetched on mount) | Global |
| Theme | next-themes (cookie + class) | Global |
| Locale | I18nProvider (localStorage) | Global |
| Sidebar | SidebarContext (React state) | App layout |
| Page data | Component-local useState/useEffect | Page |

## Database Schema

### Tables (Supabase/Postgres)

- **profiles** - User profiles with social links, display names
- **linked_wallets** - Solana wallet addresses linked to users
- **enrollments** - Course enrollment records with progress tracking
- **xp_events** - Individual XP gain events (lesson completion, achievements)
- **user_xp_summary** - Materialized XP totals, level, streak per user
- **lesson_completions** - Which lessons each user has completed

All tables have Row Level Security (RLS) policies ensuring users can only access their own data.

## XP & Leveling System

```
Level = floor(sqrt(totalXp / 100))

Level 0:     0 XP
Level 1:   100 XP
Level 2:   400 XP
Level 3:   900 XP
Level 4: 1,600 XP
Level 5: 2,500 XP
...
```

XP is awarded for:
- Lesson completion (10-50 XP per lesson)
- Course completion (bonus)
- Streak milestones (7-day, 30-day, etc.)
- Achievement unlocks

## On-Chain Integration (Planned)

| Component | Technology | Status |
|-----------|-----------|--------|
| XP Tokens | Token-2022 (NonTransferable) | Stubbed |
| Credentials | Compressed NFTs (Bubblegum) | Stubbed |
| Verification | Solana Explorer links | UI ready |
| Network | Devnet | Configured |

## Internationalization

The i18n system uses a lightweight custom provider:

1. **Translation files** in `src/lib/i18n/translations/` (en.ts, pt-br.ts, es.ts)
2. **I18nProvider** wraps the app, reads locale from localStorage
3. **useI18n()** hook provides `t()` function and `setLocale()`
4. **LanguageSwitcher** dropdown in sidebar and navbar
5. Auto-detects browser language on first visit

Server components use English by default; CMS content stays in its original language.

## Dark Mode

- Powered by `next-themes` with `attribute="class"`
- Tailwind `dark:` variants throughout all components
- ThemeToggle component in sidebar and navbar
- Three modes: Light, Dark, System (auto)
- Persisted in cookie for SSR consistency
