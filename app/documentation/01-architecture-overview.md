# Superteam Academy - Architecture Overview

## Table of Contents

- [System Overview](#system-overview)
- [High-Level Architecture](#high-level-architecture)
- [Technology Stack](#technology-stack)
- [System Component Diagram](#system-component-diagram)
- [Data Flow Architecture](#data-flow-architecture)
- [Deployment Architecture](#deployment-architecture)
- [Module Dependency Graph](#module-dependency-graph)

---

## System Overview

Superteam Academy is a production-ready Learning Management System (LMS) built for Solana blockchain development education. It combines a modern web application with on-chain credential management, gamification mechanics, and multi-language support.

**Core Capabilities:**

| Capability | Description |
|---|---|
| Interactive Courses | Project-based Solana courses with integrated code editing |
| On-Chain Credentials | Soulbound Metaplex Core NFTs as course completion certificates |
| Gamification | XP token system (SPL Token-2022), level progression, streaks, achievements |
| Multi-Auth | Solana wallet, Google OAuth, GitHub OAuth with account linking |
| Multi-Language | Internationalized UI supporting English, Portuguese (BR), and Spanish |
| Community Forum | Discussion threads tied to courses and lessons |
| Admin Dashboard | Course management, user moderation, analytics |
| CMS Integration | Sanity CMS for course content management |
| Analytics | PostHog product analytics, Google Analytics, Sentry error tracking |

---

## High-Level Architecture

```mermaid
graph TB
    subgraph Client["Frontend Layer (Next.js 16 App Router)"]
        UI["UI Components<br/>React 19 + Tailwind CSS 4"]
        HOOKS["Custom Hooks Layer<br/>19 Feature Hooks"]
        CTX["Context Providers<br/>Auth / Solana / i18n / Analytics"]
        SOL_CLIENT["Solana Client Services<br/>Wallet Adapter + Anchor"]
    end

    subgraph Server["Backend Layer (Next.js API Routes)"]
        AUTH["Auth Service<br/>NextAuth.js v4"]
        API["58 API Route Handlers"]
        BACKEND["Backend Services<br/>Auth / Admin / Queue / Events"]
        TX["Transaction Builder<br/>Backend Signer"]
    end

    subgraph Data["Data & Storage Layer"]
        PG["PostgreSQL<br/>(Supabase)"]
        REDIS["Redis Cache<br/>(Upstash)"]
        SANITY["Sanity CMS<br/>Course Content"]
    end

    subgraph Blockchain["Solana Blockchain Layer"]
        PROGRAM["On-Chain Program<br/>ACADBRCB3zGvo1K..."]
        XP_MINT["XP Token Mint<br/>SPL Token-2022"]
        CRED["Credential NFTs<br/>Metaplex Core"]
        HELIUS["Helius DAS API<br/>Indexed Queries"]
    end

    subgraph External["External Services"]
        GOOGLE["Google OAuth"]
        GITHUB["GitHub OAuth"]
        SENTRY["Sentry<br/>Error Tracking"]
        POSTHOG["PostHog<br/>Analytics"]
        GA["Google Analytics"]
    end

    UI --> HOOKS
    HOOKS --> CTX
    CTX --> SOL_CLIENT
    UI --> API
    API --> AUTH
    API --> BACKEND
    BACKEND --> TX
    TX --> PROGRAM
    BACKEND --> PG
    BACKEND --> REDIS
    API --> SANITY
    SOL_CLIENT --> PROGRAM
    SOL_CLIENT --> HELIUS
    PROGRAM --> XP_MINT
    PROGRAM --> CRED
    AUTH --> GOOGLE
    AUTH --> GITHUB
    AUTH --> PG
    UI --> POSTHOG
    UI --> GA
    Server --> SENTRY
```

---

## Technology Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| Next.js | 16.1.6 | Framework (App Router, SSR, API Routes) |
| React | 19.2.3 | UI Library |
| TypeScript | 5.x | Type Safety (strict mode) |
| Tailwind CSS | 4.x | Utility-first Styling |
| Framer Motion | 12.x | Animations and Transitions |
| Radix UI | 1.4.x | Accessible UI Primitives |
| next-intl | 4.8.x | Internationalization |
| @solana/wallet-adapter | 0.15.x | Wallet Connection |
| @coral-xyz/anchor | 0.32.x | Solana Program Client |
| @tanstack/react-query | 5.x | Server State Management |
| CodeMirror | 6.x | Code Editor Integration |
| Lucide React | 0.575.x | Icon System |

### Backend

| Technology | Version | Purpose |
|---|---|---|
| NextAuth.js | 4.24.x | Authentication (JWT Strategy) |
| Prisma | 7.4.x | Database ORM |
| Supabase | 2.96.x | PostgreSQL + Auth Infrastructure |
| Upstash Redis | 1.36.x | Caching and Rate Limiting |
| @upstash/ratelimit | 2.0.x | Tiered Rate Limiting |
| @sanity/client | 7.15.x | CMS Integration |
| @sentry/nextjs | 10.39.x | Error Monitoring |

### Blockchain

| Technology | Purpose |
|---|---|
| Solana (Devnet) | Program Deployment Network |
| Anchor Framework | Program Development |
| SPL Token-2022 | Soulbound XP Tokens |
| Metaplex Core | Credential and Achievement NFTs |
| Helius DAS API | Indexed Asset Queries |

### Infrastructure

| Service | Purpose |
|---|---|
| Vercel | Frontend Deployment |
| Supabase | Managed PostgreSQL |
| Upstash | Serverless Redis |
| Helius | Solana RPC and DAS API |
| Sanity.io | Headless CMS |

---

## System Component Diagram

```mermaid
C4Context
    title Superteam Academy - System Context Diagram

    Person(student, "Student", "Learns Solana development through interactive courses")
    Person(instructor, "Instructor", "Creates and manages course content")
    Person(admin, "Admin", "Manages platform, users, and content")

    System(academy, "Superteam Academy", "LMS Platform with on-chain credentials")

    System_Ext(solana, "Solana Blockchain", "On-chain program, XP tokens, credential NFTs")
    System_Ext(helius, "Helius", "RPC provider and DAS API")
    System_Ext(sanity, "Sanity CMS", "Course content management")
    System_Ext(supabase, "Supabase", "PostgreSQL database with RLS")
    System_Ext(oauth, "OAuth Providers", "Google and GitHub authentication")

    Rel(student, academy, "Enrolls in courses, completes lessons, earns XP")
    Rel(instructor, academy, "Creates courses via CMS")
    Rel(admin, academy, "Manages users, moderates content")
    Rel(academy, solana, "Records progress, mints credentials")
    Rel(academy, helius, "Queries assets, leaderboard data")
    Rel(academy, sanity, "Fetches course content")
    Rel(academy, supabase, "Stores user data, streaks, community")
    Rel(academy, oauth, "Authenticates users")
```

---

## Data Flow Architecture

### Course Enrollment and Completion Flow

```mermaid
sequenceDiagram
    participant Student
    participant Frontend
    participant API as API Routes
    participant DB as PostgreSQL
    participant TX as Transaction Builder
    participant Chain as Solana Program

    Student->>Frontend: Browse courses
    Frontend->>API: GET /api/courses
    API->>Chain: Fetch on-chain course accounts
    Chain-->>API: Course data (PDA accounts)
    API-->>Frontend: Course list

    Student->>Frontend: Enroll in course
    Frontend->>Chain: Build enrollment tx (remaining_accounts for prerequisites)
    Chain-->>Frontend: Enrollment PDA created

    Student->>Frontend: Complete lesson
    Frontend->>API: POST /api/lessons/complete
    API->>TX: buildCompleteLessonIx()
    TX->>Chain: complete_lesson (bitmap update + XP mint)
    Chain-->>TX: Transaction signature
    TX-->>API: Result
    API->>DB: Record streak activity
    API-->>Frontend: Completion confirmed

    Student->>Frontend: Finalize course
    Frontend->>API: POST /api/courses/finalize
    API->>TX: buildFinalizeCourseIx()
    TX->>Chain: finalize_course (50% bonus XP + creator reward)
    Chain-->>TX: Transaction signature

    API->>TX: buildIssueCredentialIx()
    TX->>Chain: issue_credential (Metaplex Core NFT)
    Chain-->>TX: Credential asset address
    TX-->>API: Result
    API-->>Frontend: Credential issued
```

### Authentication Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant AuthAPI as Auth API
    participant NextAuth as NextAuth.js
    participant DB as PostgreSQL
    participant Redis as Upstash Redis

    User->>Frontend: Connect wallet / OAuth login

    alt Wallet Authentication
        Frontend->>AuthAPI: GET /api/auth/wallet/sign-message
        AuthAPI->>Redis: Store nonce (5min TTL)
        AuthAPI-->>Frontend: Nonce message
        User->>Frontend: Sign message with wallet
        Frontend->>NextAuth: POST credentials (address, message, signature)
        NextAuth->>Redis: Verify nonce
        NextAuth->>NextAuth: Verify ed25519 signature (tweetnacl)
        NextAuth->>Redis: Check lockout status
        NextAuth->>DB: Find/create profile by wallet_address
    end

    alt OAuth Authentication
        Frontend->>NextAuth: Redirect to Google/GitHub
        NextAuth-->>Frontend: OAuth callback
        NextAuth->>DB: Find/create profile by provider_id
        NextAuth->>DB: Create linked_account record
    end

    NextAuth->>DB: Update last_login_at, increment login_count
    NextAuth->>DB: Create audit_log entry
    NextAuth-->>Frontend: JWT session token (7-day max age)
    Frontend-->>User: Dashboard access

    Note over NextAuth,DB: Session contains: userId, role, walletAddress, sessionVersion
```

---

## Deployment Architecture

```mermaid
graph LR
    subgraph Production["Production Environment"]
        VERCEL["Vercel<br/>Next.js 16 Deployment"]
        EDGE["Edge Functions<br/>Middleware"]
    end

    subgraph Services["Managed Services"]
        SUPA["Supabase<br/>PostgreSQL + RLS"]
        UPSTASH["Upstash<br/>Redis (REST API)"]
        SANITY_SVC["Sanity.io<br/>CMS Studio"]
        HELIUS_SVC["Helius<br/>RPC + DAS"]
    end

    subgraph Monitoring["Observability"]
        SENTRY_SVC["Sentry<br/>Error Tracking"]
        PH["PostHog<br/>Product Analytics"]
        GA4["Google Analytics<br/>Traffic Analytics"]
    end

    subgraph Chain["Blockchain"]
        DEVNET["Solana Devnet"]
        PROGRAM_ADDR["Program: ACADBRCB3z..."]
        XP_ADDR["XP Mint: xpXPUjkfk7..."]
    end

    VERCEL --> SUPA
    VERCEL --> UPSTASH
    VERCEL --> SANITY_SVC
    VERCEL --> HELIUS_SVC
    VERCEL --> SENTRY_SVC
    VERCEL --> PH
    EDGE --> VERCEL
    HELIUS_SVC --> DEVNET
    VERCEL --> DEVNET
    DEVNET --> PROGRAM_ADDR
    DEVNET --> XP_ADDR
```

---

## Module Dependency Graph

```mermaid
graph TD
    subgraph Frontend_Hooks["Frontend Hooks (19)"]
        useWallet["useWalletAuth"]
        useEnroll["useEnrollment"]
        useLesson["useLessonCompletion"]
        useCourse["useCourses / useCourseDetails"]
        useStreak["useStreak / useDailyLogin"]
        useXP["useXpBalance"]
        useLB["useLeaderboard"]
        useAch["useAchievements"]
        useCred["useCredentials"]
        useAnalytics["useAnalytics"]
        useCode["useCodeExecution"]
        useOffline["useOfflineSync"]
        usePush["usePushNotifications"]
        useStats["useUserStats"]
        useLink["useAccountLinking"]
        useChallenges["useChallenges"]
    end

    subgraph Solana_Services["Solana Services (14)"]
        txBuilder["TransactionBuilder"]
        enrollSvc["enrollment-service"]
        credSvc["credential-service"]
        achSvc["achievement-service"]
        courseSvc["course-service"]
        xpSvc["xp (Token-2022)"]
        heliusSvc["helius-service"]
        pdaSvc["pda"]
        anchorAcct["anchor-accounts"]
        backendSigner["backend-signer"]
        bitmap["bitmap"]
        constants["constants"]
        courseTx["course-transactions"]
        accounts["accounts"]
    end

    subgraph Backend_Services["Backend Services"]
        authOpts["auth-options"]
        rateLimit["rate-limit"]
        lockout["lockout"]
        audit["audit"]
        nonceStore["nonce-store"]
        queueSvc["queue-service"]
        eventListener["event-listener"]
        handlers["event-handlers"]
        webhook["webhook"]
        cronSvc["cron"]
    end

    useEnroll --> enrollSvc
    useLesson --> txBuilder
    useCred --> credSvc
    useAch --> achSvc
    useCourse --> courseSvc
    useXP --> xpSvc
    useLB --> heliusSvc

    txBuilder --> pdaSvc
    txBuilder --> anchorAcct
    txBuilder --> backendSigner
    enrollSvc --> pdaSvc
    enrollSvc --> anchorAcct
    credSvc --> txBuilder
    credSvc --> heliusSvc
    achSvc --> pdaSvc

    authOpts --> rateLimit
    authOpts --> lockout
    authOpts --> audit
    authOpts --> nonceStore
    eventListener --> handlers
    handlers --> queueSvc
    queueSvc --> webhook
```

---

## Directory Structure

```
app/
  app/                    # Next.js App Router
    (admin)/              # Admin route group
    [locale]/             # Internationalized routes
      (routes)/           # Authenticated page routes
        achievements/     # Achievement showcase
        admin/            # Admin dashboard pages
        auth/             # Auth callback pages
        certificates/     # Certificate viewer
        challenges/       # Daily challenges
        community/        # Forum (threads, new thread, thread detail)
        courses/          # Course catalog and detail
        dashboard/        # User dashboard
        leaderboard/      # XP leaderboard
        login/            # Login page
        onboarding/       # User onboarding flow
        profile/          # User profile and public profiles
        settings/         # User settings
    api/                  # 58 API route handlers
      achievements/       # Achievement endpoints
      admin/              # Admin management endpoints
      auth/               # Authentication endpoints (9 groups)
      cms/                # CMS integration
      code/               # Code execution
      community/          # Forum endpoints
      courses/            # Course CRUD
      credentials/        # Credential operations
      cron/               # Scheduled jobs
      events/             # Event listener
      health/             # Health check
      leaderboard/        # Leaderboard queries
      lessons/            # Lesson completion
      notifications/      # Push subscriptions
      profile/            # Profile management
      queue/              # Queue processing
      streak/             # Streak management
      xp/                 # XP balance queries
    providers/            # React context providers

  backend/                # Server-side business logic
    admin/                # Admin service functions
    auth/                 # Auth utilities (12 files)
    certificate/          # Certificate generation
    cms/                  # CMS service
    events/               # Event listener and handlers
    queue/                # Job queue and webhooks
    
  components/             # React components (23 feature areas)
  context/                # Frontend context and utilities
    hooks/                # 19 custom React hooks
    solana/               # 14 Solana integration services
    types/                # 10 TypeScript type definitions
    i18n/                 # Internationalization config
    analytics/            # Analytics integration
    
  prisma/                 # Database schema and migrations
    schema.prisma         # 14 models, 334 lines
    migrations/           # 11 migration files
    
  sanity/                 # CMS schema definitions
    schemas/              # 6 content schemas
    
  public/                 # Static assets (205 items)
```

---

## On-Chain Program Addresses

| Component | Address | Network |
|---|---|---|
| Program ID | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` | Devnet |
| XP Token Mint | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` | Devnet |
| Authority | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` | Devnet |

**Program Statistics:** 16 instructions, 6 PDA types, 26 error variants, 15 events

---

## Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 90+ |
| Largest Contentful Paint | < 2.5s |
| First Input Delay | < 100ms |
| Cumulative Layout Shift | < 0.1 |
