# Frontend Architecture

## Table of Contents

- [Application Structure](#application-structure)
- [Routing Architecture](#routing-architecture)
- [Component Architecture](#component-architecture)
- [State Management](#state-management)
- [Custom Hooks](#custom-hooks)
- [Context Providers](#context-providers)
- [Frontend-Backend Integration](#frontend-backend-integration)

---

## Application Structure

```mermaid
graph TB
    subgraph AppRouter["Next.js 16 App Router"]
        ROOT["app/layout.tsx<br/>Root Layout + Providers"]
        ADMIN_GROUP["(admin)/<br/>Admin Route Group"]
        LOCALE["[locale]/<br/>i18n Dynamic Segment"]
        API["api/<br/>58 Route Handlers"]
    end

    subgraph LocaleRoutes["[locale]/(routes)/"]
        LOGIN["login/"]
        ONBOARD["onboarding/"]
        DASH["dashboard/"]
        COURSES["courses/"]
        COMMUNITY["community/"]
        LEADERBOARD["leaderboard/"]
        PROFILE["profile/"]
        SETTINGS["settings/"]
        ACHIEVEMENTS["achievements/"]
        CHALLENGES["challenges/"]
        CERTS["certificates/"]
        ADMIN_PAGES["admin/"]
    end

    subgraph Providers["Context Providers"]
        AUTH_P["AuthProvider<br/>NextAuth SessionProvider"]
        WALLET_P["WalletProvider<br/>Solana Wallet Adapter"]
        I18N_P["IntlProvider<br/>next-intl"]
        QUERY_P["QueryClientProvider<br/>TanStack React Query"]
        ANALYTICS_P["AnalyticsProvider<br/>PostHog + GA"]
    end

    ROOT --> Providers
    Providers --> LOCALE
    LOCALE --> LocaleRoutes
    ROOT --> ADMIN_GROUP
    ROOT --> API
```

---

## Routing Architecture

### Page Routes

| Route | Component Directory | Auth Required | Description |
|---|---|---|---|
| `/` | `[locale]/page.tsx` | No | Landing page |
| `/login` | `[locale]/(routes)/login/` | No | Login page |
| `/onboarding` | `[locale]/(routes)/onboarding/` | Yes | New user onboarding flow |
| `/dashboard` | `[locale]/(routes)/dashboard/` | Yes | User dashboard |
| `/courses` | `[locale]/(routes)/courses/` | No | Course catalog |
| `/courses/[slug]` | `[locale]/(routes)/courses/[slug]/` | No | Course detail |
| `/courses/[slug]/lessons/[id]` | `[locale]/(routes)/courses/[slug]/lessons/` | Yes | Lesson view with editor |
| `/leaderboard` | `[locale]/(routes)/leaderboard/` | No | XP leaderboard |
| `/achievements` | `[locale]/(routes)/achievements/` | Yes | Achievement showcase |
| `/challenges` | `[locale]/(routes)/challenges/` | Yes | Daily challenges |
| `/community` | `[locale]/(routes)/community/` | No | Forum listing |
| `/community/[threadId]` | `[locale]/(routes)/community/[id]/` | No | Thread detail |
| `/community/new` | `[locale]/(routes)/community/new/` | Yes | Create thread |
| `/profile` | `[locale]/(routes)/profile/` | Yes | User profile |
| `/profile/[username]` | `[locale]/(routes)/profile/[username]/` | No | Public profile |
| `/settings` | `[locale]/(routes)/settings/` | Yes | User settings |
| `/certificates/[id]` | `[locale]/(routes)/certificates/` | No | Certificate viewer |
| `/admin/*` | `[locale]/(routes)/admin/` | Admin | Admin dashboard |
| `/offline` | `[locale]/offline/` | No | PWA offline fallback |

### Route Groups and Middleware

```mermaid
graph TD
    subgraph Public["Public Routes (No Auth)"]
        LANDING["/"]
        COURSES_PUB["/courses"]
        LB["/leaderboard"]
        COMM_PUB["/community"]
        PUB_PROFILE["/profile/[username]"]
    end

    subgraph Protected["Protected Routes (JWT Required)"]
        DASHBOARD["/dashboard"]
        PROFILE_OWN["/profile"]
        SETTINGS["/settings"]
        ACHIEVEMENTS_P["/achievements"]
        ONBOARDING_P["/onboarding"]
    end

    subgraph Admin["Admin Routes (Admin Role)"]
        ADMIN_DASH["/admin"]
        ADMIN_USERS["/admin/users"]
        ADMIN_COURSES_P["/admin/courses"]
        ADMIN_COMMUNITY_P["/admin/community"]
    end

    style Public fill:#27ae60,color:#fff
    style Protected fill:#f39c12,color:#fff
    style Admin fill:#e74c3c,color:#fff
```

---

## Component Architecture

### Component Organization (23 Feature Areas)

```mermaid
graph TB
    subgraph Components["components/"]
        SHARED["shared/<br/>ErrorBoundary"]
        UI_COMP["ui/<br/>14 base components"]

        subgraph Feature["Feature Components"]
            C_AUTH["auth/ (2)"]
            C_LANDING["landing/ (9)"]
            C_DASH["dashboard/ (15)"]
            C_COURSE["course/ (15)"]
            C_LESSON["lesson/ (4)"]
            C_EDITOR["editor/ (5)"]
            C_PROFILE["profile/ (6)"]
            C_SETTINGS["settings/ (5)"]
            C_LB["leaderboard/ (10)"]
            C_ACH["achievement/ (5)"]
            C_COMM["community/ (9)"]
            C_ADMIN["admin/ (8)"]
            C_STREAK["streak/ (4)"]
            C_XP["xp/ (2)"]
            C_CRED["credential/ (2)"]
            C_NOTIF["notification/ (3)"]
            C_ONBOARD["onboarding/ (3)"]
            C_CHALLENGE["challenges/ (2)"]
            C_ANALYTICS["analytics/ (2)"]
            C_I18N["i18n/ (1)"]
            C_PWA["pwa/ (1)"]
        end
    end

    UI_COMP --> Feature
    SHARED --> Feature
```

### UI Base Components

| Component | Description |
|---|---|
| Button | Variant-based button with CVA |
| Card | Content container with header/footer |
| Dialog | Modal dialog (Radix UI) |
| Dropdown | Dropdown menu (Radix UI) |
| Input | Form input with validation |
| Select | Dropdown select (Radix UI) |
| Sheet | Slide-out panel |
| Skeleton | Loading placeholder |
| Tabs | Tab navigation (Radix UI) |
| Toast | Notification toasts (goey-toast) |
| Tooltip | Hover tooltips |
| Badge | Status badges |
| Avatar | User avatars |
| Calendar | Date picker (react-day-picker) |

---

## State Management

```mermaid
graph TB
    subgraph ServerState["Server State (React Query)"]
        RQ["@tanstack/react-query v5"]
        COURSES_Q["Course queries"]
        LB_Q["Leaderboard queries"]
        PROFILE_Q["Profile queries"]
    end

    subgraph ClientState["Client State (React Context)"]
        AUTH_CTX["Auth Context<br/>Session, user data"]
        WALLET_CTX["Wallet Context<br/>Connection, public key"]
        I18N_CTX["i18n Context<br/>Locale, translations"]
    end

    subgraph LocalState["Component-Local State"]
        FORM["Form state (useState)"]
        UI["UI state (open/close, tabs)"]
        EDITOR_S["Editor state (CodeMirror)"]
    end

    subgraph OnChain["On-Chain State (Direct RPC)"]
        ENROLLMENT_S["Enrollment accounts"]
        XP_BAL["XP token balances"]
        CRED_S["Credential NFTs"]
    end

    RQ --> COURSES_Q
    RQ --> LB_Q
    RQ --> PROFILE_Q
    AUTH_CTX --> RQ
    WALLET_CTX --> OnChain
```

---

## Custom Hooks

### Hook Catalog (19 Hooks)

| Hook | Purpose | Data Source |
|---|---|---|
| `useWalletAuth` | Wallet connection and sign-in | Wallet Adapter + API |
| `useAccountLinking` | Link/unlink auth providers | API endpoints |
| `useEnrollment` | Course enrollment management | Solana Program |
| `useLessonCompletion` | Lesson progress and completion | API + Solana |
| `useCourses` | Course catalog queries | API (on-chain data) |
| `useCourseDetails` | Single course with CMS content | API + Sanity |
| `useXpBalance` | On-chain XP balance | Solana RPC |
| `useStreak` | Activity streak data | API (PostgreSQL) |
| `useDailyLogin` | Daily login streak recording | API (PostgreSQL) |
| `useLeaderboard` | Leaderboard rankings | API (Helius DAS) |
| `useAchievements` | User achievement gallery | API (DB + on-chain) |
| `useCredentials` | Credential NFTs display | Helius DAS API |
| `useChallenges` | Daily challenge system | API |
| `useCodeExecution` | Code editor run/test | API sandbox |
| `useAnalytics` | Event tracking | PostHog + GA |
| `useUserStats` | Dashboard statistics | API aggregate |
| `useOfflineSync` | PWA offline data sync | IndexedDB |
| `usePushNotifications` | Push notification management | API + Browser Push |
| `useMobile` | Responsive breakpoint detection | Window resize |

### Hook Data Flow

```mermaid
graph LR
    subgraph Hooks["Custom Hooks"]
        H1["useEnrollment"]
        H2["useLessonCompletion"]
        H3["useXpBalance"]
        H4["useCredentials"]
    end

    subgraph APIs["API Layer"]
        A1["POST /api/lessons/complete"]
        A2["POST /api/courses/finalize"]
        A3["POST /api/credentials/issue"]
    end

    subgraph Chain["Solana"]
        C1["enrollment-service"]
        C2["TransactionBuilder"]
        C3["xp.ts"]
        C4["helius-service"]
    end

    H1 --> C1
    H2 --> A1
    A1 --> C2
    H3 --> C3
    H4 --> C4
    A2 --> C2
    A3 --> C2
```

---

## Context Providers

### Provider Hierarchy

```mermaid
graph TD
    ROOT["RootLayout"]
    ROOT --> SESSION["SessionProvider<br/>NextAuth session"]
    SESSION --> WALLET["WalletProvider<br/>Solana wallet-adapter"]
    WALLET --> QUERY["QueryClientProvider<br/>React Query"]
    QUERY --> INTL["NextIntlClientProvider<br/>i18n messages"]
    INTL --> ANALYTICS["AnalyticsProvider<br/>PostHog init"]
    ANALYTICS --> APP["Application Pages"]

    style ROOT fill:#2c3e50,color:#fff
    style APP fill:#27ae60,color:#fff
```

### Provider Configuration

| Provider | Package | Key Configuration |
|---|---|---|
| SessionProvider | next-auth/react | Session refetch on window focus |
| WalletProvider | @solana/wallet-adapter-react | Multi-wallet support, auto-connect |
| QueryClientProvider | @tanstack/react-query | Stale time, retry config |
| NextIntlClientProvider | next-intl | Locale from URL segment, message bundles |
| PostHog | posthog-js | API key, automatic page view tracking |

---

## Frontend-Backend Integration

### Integration Pattern

```mermaid
graph TB
    subgraph Frontend["Frontend (Client)"]
        PAGE["Page Component"]
        HOOK["Custom Hook"]
        FETCH["fetch() / React Query"]
    end

    subgraph Backend["Backend (API Routes)"]
        ROUTE["Route Handler"]
        SESSION_CHECK["getServerSession()"]
        SERVICE["Backend Service"]
    end

    subgraph External["External"]
        DB["PostgreSQL (Prisma)"]
        CHAIN["Solana (TX Builder)"]
        CMS["Sanity CMS"]
        CACHE["Redis Cache"]
    end

    PAGE --> HOOK
    HOOK --> FETCH
    FETCH -->|HTTP| ROUTE
    ROUTE --> SESSION_CHECK
    SESSION_CHECK --> SERVICE
    SERVICE --> DB
    SERVICE --> CHAIN
    SERVICE --> CMS
    SERVICE --> CACHE
```

### Data Fetching Patterns

| Pattern | Used For | Example |
|---|---|---|
| Server Components | Initial page data | Course catalog SSR |
| React Query | Client-side data with caching | Leaderboard, profile |
| Direct RPC | On-chain reads | XP balance, enrollment status |
| API Routes | Mutations with auth | Lesson completion, thread creation |
| Sanity Client | CMS content | Course lessons, media |
