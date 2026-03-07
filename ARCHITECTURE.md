# System Architecture

The Superteam Academy is a full-stack Web3 learning platform that combines traditional web2 content management with blockchain-based credentials and rewards. The architecture consists of three core domains: a Next.js full-stack application (serving the UI and CMS), an off-chain Backend (API validating lessons and acting as a co-signer), and an Anchor-based Solana Smart Contract (handling state, XP tokens, and NFTs).

## System Overview

```
┌──────────────────────────────────────────────────────────────────────────┐
│                        FRONTEND (Next.js App)                            │
│                                                                          │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐  ┌──────────────┐  │
│  │   Stores    │  │  API Clients │  │   Hooks     │  │   Services   │  │
│  │  (Zustand)  │  │  (REST API)  │  │  (Anchor)   │  │  (Payload)   │  │
│  └─────────────┘  └──────────────┘  └─────────────┘  └──────────────┘  │
│         │                 │                 │                 │          │
│         └─────────────────┴─────────────────┴─────────────────┘          │
│                                  │                                       │
└──────────────────────────────────┼───────────────────────────────────────┘
                                   │
        ┌──────────────────────────┼──────────────────────────┐
        │                          │                          │
┌───────▼────────┐      ┌──────────▼──────────┐   ┌─────────▼──────────┐
│  Payload CMS   │      │   Solana Program    │   │  Helius DAS API    │
│  (PostgreSQL)  │      │   (Anchor/Rust)     │   │  (NFT Indexing)    │
│                │      │                     │   │                    │
│  - Courses     │      │  - Enrollments      │   │  - Leaderboard     │
│  - Lessons     │      │  - XP Tokens        │   │  - Credentials     │
│  - Users       │      │  - Credentials      │   │  - Achievements    │
│  - Reviews     │      │  - Achievements     │   │                    │
│  - Streaks     │      │                     │   │                    │
└────────────────┘      └─────────────────────┘   └────────────────────┘
```

## Repository Structure

The repository is organized as a monorepo housing both the Solana program and the web application:

```
onchain-academy/
├── programs/academy/          # Rust-based Solana smart contract
│   └── src/
│       ├── lib.rs            # Program entry point
│       ├── state/            # Account structures (Course, Enrollment, etc.)
│       └── instructions/     # Program instructions
│
└── apps/academy/             # Next.js web application
    ├── app/                  # Next.js App Router
    │   ├── (frontend)/       # Public-facing routes
    │   ├── (payloas their wallet and clicks Enroll.
   - The frontend (`useOnchainAcademy().enroll`) initializes an `Enrollment` PDA tied to the user's wallet and the specific Course PDA.
2. **Completing a Lesson**:
   - The user completes a quiz or task on the frontend.
   - The frontend triggers a backend API to validate the completion.
   - The backend signs `complete_lesson` alongside the user. This updates a bit in the Enrollment's progress bitmap and mints the lesson's XP to the user's Token-2022 wallet.
3. **Finalizing a Course**:
   - Once all bits in the lesson bitmap are flipped, the backend signs `finalize_course` to mark the enrollment as fully complete, distribute bonus completion XP, and reward the course creator.
4. **Issuing Credentials**:
   - With the course finalized, the backend invokes `issue_credential`.
   - A soulbound Metaplex Core NFT credential is minted to the user's wallet as permanent, immutable proof of their achievement.

## Service Interfaces & Integrations

### Payload CMS

Function├── auth-sync.service.ts      # Syncs Better Auth → Payload users
    │   ├── courses.service.ts        # Course CRUD operations
    │   ├── lessons.service.ts        # Lesson queries
    │   ├── lesson-contents.service.ts # Lesson content management
    │   ├── modules.service.ts        # Module queries
    │   ├── users.service.ts          # User management
    │   ├── reviews.service.ts        # Course reviews
    │   ├── streaks.service.ts        # Daily streak tracking
    │   └── leaderboard.service.ts    # XP leaderboard aggregation
    │
    ├── libs/
    │   ├── api/              # Client-side REST API layer
    │   │   ├── index.ts      # Shared fetchAPI helper + barrel export
    │   │   ├── courses.api.ts
    │   │   ├── lessons.api.ts
    │   │   ├── modules.api.ts
    │   │   ├── users.api.ts
    │   │   ├── streaks.api.ts
    │   │   └── xp.api.ts
    │   │
    │   ├── auth.ts           # Better Auth configuration
    │   ├── auth-client.ts    # Better Auth client hooks
    │   ├── payload.ts        # Payload client singleton
    │   └── solana-auth-plugin.ts  # Solana wallet auth plugin
    │
    ├── hooks/
    │   ├── useOnchainAcademy.ts   # Primary Solana program hook
    │   └── useAnchorProgram.ts    # Anchor program provider
    │
    ├── stores/               # Global state management (Zustand)
    │   ├── authStore.ts      # User authentication state
    │   └── courseStore.ts    # Course module cache
    │
    └── components/           # React components
```

---

## Core Data Flow: Learning Journey

The learning process combines web2 content delivery with web3 proof-of-work:

### 1. User Authentication & Onboarding

- User connects wallet or signs in via OAuth (Google/GitHub)
- Better Auth creates user record in PostgreSQL
- `auth-sync.service.ts` syncs user to Payload CMS
- User completes onboarding (profile setup)
- `awardXP` action awards 100 XP for account setup

### 2. Course Enrollment

- User browses courses from Payload CMS via `courses.service.ts`
- Frontend calls `useOnchainAcademy().enroll()`
- Creates `Enrollment` PDA on Solana linked to user's wallet
- Enrollment tracks progress via bitmap (one bit per lesson)

### 3. Lesson Completion

- User completes lesson quiz/task in UI
- Frontend validates completion
- Backend API validates and co-signs `completeLesson` transaction
- Solana program:
  - Flips lesson bit in enrollment bitmap
  - Mints lesson XP to user's Token-2022 account
  - Records XP in Payload via `xp-records` collection

### 4. Course Finalization

- When all lesson bits are set, backend co-signs `finalizeCourse`
- Solana program:
  - Marks enrollment as complete
  - Awards bonus completion XP
  - Rewards course creator with XP

### 5. Credential Issuance

- Backend calls `issueCredential` to mint soulbound NFT
- Metaplex Core NFT created with:
  - Course completion metadata
  - Total XP earned
  - Courses completed count
  - Immutable proof of achievement

---

## Smart Contract Integration Layer

### `hooks/useOnchainAcademy.ts`

Primary React hook for all Solana program interactions using `@coral-xyz/anchor`.

#### Configuration & Queries

- **`getConfig`** - Fetches global Config PDA (XP mint, authorities)

#### Learner Methods (Wallet-signed)

- **`enroll`** - Initialize enrollment PDA for a course
  - Creates progress tracker (bitmap)
  - Validates prerequisites if required
  - Learner pays rent (~0.002 SOL)

- **`closeEnrollment`** - Reclaim rent from dropped course
  - Enforces 24-hour cooldown
  - Returns rent to learner

#### Backend/Admin Methods (Co-signed)

- **`completeLesson`** - Mark lesson complete + mint XP
  - Requires backend co-signer
  - Flips lesson bit in bitmap
  - Mints XP tokens to learner

- **`finalizeCourse`** - Lock enrollment as complete
  - Validates all lessons complete
  - Awards completion bonus XP
  - Rewards course creator

- **`issueCredential`** - Mint soulbound NFT credential
  - Creates Metaplex Core asset
  - Stores completion metadata
  - Permanently linked to learner wallet

- **`upgradeCredential`** - Update existing credential NFT
  - Burns old credential
  - Mints new with updated stats

#### Course Management (Admin)

- **`createCourse`** - Create on-chain course PDA
  - Maps CMS course to blockchain
  - Sets XP rewards, difficulty, prerequisites

- **`updateCourse`** - Modify course parameters
  - Update XP amounts
  - Toggle active status
  - Update content references

#### Achievement System

- **`createAchievementType`** - Define new achievement
  - Set max supply, XP reward
  - Link to Metaplex collection

- **`awardAchievement`** - Grant achievement NFT
  - Mints badge to recipient
  - Awards XP bonus
  - Tracks via receipt PDA

- **`deactivateAchievementType`** - Disable achievement

#### XP Rewards (Minter Role)

- **`rewardXp`** - Award XP for non-course activities
  - Daily streaks
  - Community contributions
  - Special events

#### System Administration

- **`initialize`** - Bootstrap program (one-time)
  - Creates Config PDA
  - Initializes XP mint (Token-2022)
  - Sets up backend minter role

- **`updateConfig`** - Update program authorities
  - Change backend signer
  - Rotate minter roles

#### NFT Collection Management

- **`createTrack`** - Create Metaplex Core collection
  - For course track credentials
  - Program becomes update authority

---

## Payload CMS Integration Layer

### Client-Side API (`libs/api/`)

All client components use these API clients to interact with Payload REST API. Never call `fetch('/api/...')` directly.

#### `libs/api/index.ts`

- **`fetchAPI<T>(path, options)`** - Shared fetch wrapper
  - Handles authentication cookies
  - Standardized error handling
  - Type-safe responses

#### `libs/api/courses.api.ts`

```typescript
coursesAPI.find(params) // List courses with filters
coursesAPI.findBySlug(slug) // Get course by slug
coursesAPI.findById(id) // Get course by ID
```

#### `libs/api/lessons.api.ts`

```typescript
lessonsAPI.find(params) // List lessons
lessonsAPI.findBySlug(slug) // Get lesson by slug
lessonsAPI.findById(id) // Get lesson by ID
```

#### `libs/api/modules.api.ts`

```typescript
modulesAPI.find(params) // List modules
modulesAPI.findById(id) // Get module by ID
```

#### `libs/api/users.api.ts`

```typescript
usersAPI.me() // Get current user
usersAPI.findById(id) // Get user by ID
usersAPI.update(id, data) // Update user profile
```

#### `libs/api/streaks.api.ts`

```typescript
streaksAPI.findByUser(userId) // Get user's streak data
streaksAPI.update(id, data) // Update streak
```

#### `libs/api/xp.api.ts`

```typescript
xpAPI.getLeaderboard(params) // Fetch leaderboard with filters
// params: { timePeriod, limit, offset }
// timePeriod: 'weekly' | 'monthly' | 'all-time'
```

---

## Server-Side Services Layer

All server-side data access goes through services. Never call `payload.find()` outside of services.

### `services/auth-sync.service.ts`

**Purpose:** Syncs Better Auth users to Payload CMS

- **`syncUserToPayload(betterAuthUser)`**
  - Called from Better Auth database hooks
  - Creates/updates Payload user record
  - Maps Better Auth ID to Payload user
  - Handles wallet email format conversion

### `services/courses.service.ts`

**Purpose:** Course CRUD operations

- **`getAllCourses()`** - List all courses
- **`getCourseBySlug(slug)`** - Get course with modules/lessons
- **`getCourseById(id)`** - Get course by ID
- **`getPublishedCourses()`** - List published courses only
- **`createCourse(data)`** - Create new course
- **`updateCourse(id, data)`** - Update course
- **`deleteCourse(id)`** - Delete course

### `services/lessons.service.ts`

**Purpose:** Lesson queries

- **`getLessonBySlug(slug)`** - Get lesson with content
- **`getLessonById(id)`** - Get lesson by ID
- **`getLessonsByCourse(courseId)`** - List course lessons
- **`createLesson(data)`** - Create new lesson
- **`updateLesson(id, data)`** - Update lesson

### `services/lesson-contents.service.ts`

**Purpose:** Lesson content management

- **`getLessonContent(lessonId)`** - Get lesson content blocks
- **`updateLessonContent(lessonId, content)`** - Update content

### `services/modules.service.ts`

**Purpose:** Module queries

- **`getModuleById(id)`** - Get module with lessons
- **`getModulesByCourse(courseId)`** - List course modules
- **`createModule(data)`** - Create new module
- **`updateModule(id, data)`** - Update module

### `services/users.service.ts`

**Purpose:** User management

- **`getUserByWallet(walletAddress)`** - Find user by wallet
- **`getUserByEmail(email)`** - Find user by email
- **`getUserById(id)`** - Get user by Payload ID
- **`getUserByBetterAuthId(betterAuthId)`** - Map Better Auth → Payload
- **`createUser(data)`** - Create new user
- **`updateUser(id, data)`** - Update user profile

### `services/reviews.service.ts`

**Purpose:** Course review management

- **`getReviewsByCourse(courseId)`** - List course reviews
- **`createReview(data)`** - Submit new review
- **`updateReview(id, data)`** - Update review
- **`deleteReview(id)`** - Delete review

### `services/streaks.service.ts`

**Purpose:** Daily streak tracking

- **`getStreakByUser(userId)`** - Get user's streak data
- **`updateStreak(userId, data)`** - Update streak count
- **`checkDailyStreak(userId)`** - Validate daily login
- **`resetStreak(userId)`** - Reset broken streak

### `services/leaderboard.service.ts`

**Purpose:** XP leaderboard aggregation

- **`getLeaderboard(timePeriod, limit, offset)`**
  - Aggregates XP from `xp-records` collection
  - Filters by time period (weekly/monthly/all-time)
  - Joins user data (displayName, avatar)
  - Joins streak data
  - Calculates levels using `calculateLevel(totalXP)`
  - Returns paginated leaderboard with ranks

**Types:**

```typescript
TimePeriod: 'weekly' | 'monthly' | 'all-time'
LeaderboardEntry: {
  rank: number
  user: {
    ;(id, displayName, username, avatar)
  }
  totalXP: number
  level: number
  streak: {
    ;(current, longest)
  }
}
```

---

## Server Actions Layer

### `actions/xp.actions.ts`

Universal server action for awarding XP from any client component.

- **`awardXP({ betterAuthUserId, amount, source })`**
  - Maps Better Auth ID → Payload user ID
  - Creates XP record in Payload
  - Returns success/error status
  - Can be called from any client component

**Common XP Sources:**

- `account-setup` - 100 XP for onboarding
- `lesson-complete` - 50 XP per lesson
- `quiz-passed` - 75 XP per quiz
- `course-complete` - 200 XP bonus
- `daily-login` - 10 XP for streak

---

## Global State Management

### `stores/authStore.ts` (Zustand)

Manages user authentication state across the application.

**State:**

```typescript
{
  user: AuthUser | null // Current user data
  isAuthenticated: boolean // Auth status
  isLoading: boolean // Loading state
  needsOnboarding: boolean // Onboarding required
  isAdmin: boolean // Admin role check
  isInstructor: boolean // Instructor role check
}
```

**Actions:**

- `setUser(user)` - Update user state
- `setLoading(loading)` - Set loading state
- `clear()` - Clear auth state (logout)

**Usage:**

```typescript
const { user, isAuthenticated, isAdmin } = useAuthStore()
```

### `stores/courseStore.ts` (Zustand)

Caches course module data to avoid repeated fetches.

**State:**

```typescript
{
  courseModules: Record<string, CourseModule[]> // Keyed by course slug
}
```

**Actions:**

- `setCourseModules(courseSlug, modules)` - Cache course modules

**Usage:**

```typescript
const { courseModules, setCourseModules } = useCourseStore()
```

---

## Authentication Flow

### Better Auth + Solana Wallet

1. **Wallet Authentication:**
   - User connects Solana wallet
   - `solana-auth-plugin.ts` generates nonce
   - User signs message with wallet
   - Plugin verifies signature
   - Creates Better Auth session
   - Email format: `{walletAddress}@wallet.superteam.academy`

2. **OAuth Authentication:**
   - User signs in via Google/GitHub
   - Better Auth handles OAuth flow
   - Creates user with OAuth email

3. **User Sync:**
   - `auth-sync.service.ts` syncs to Payload
   - Creates Payload user record
   - Links Better Auth ID to Payload ID
   - Stores wallet address if present

4. **Session Management:**
   - Better Auth manages sessions
   - `useAuthStore` caches user state
   - `useSession()` hook provides auth data

---

## Key Design Patterns

### 1. Service Layer Pattern

- All Payload data access goes through `services/`
- Server Components call services directly (Local API)
- Never call `payload.find()` outside services

### 2. API Client Pattern

- All client-side REST calls go through `libs/api/`
- Never call `fetch('/api/...')` directly in components
- Use React Query for all client data fetching

### 3. Server Actions Pattern

- Mutations use Next.js Server Actions
- Located in `actions/` or co-located with routes
- Type-safe, no manual API routes needed

### 4. Co-Signing Pattern

- Backend holds `backend_signer` keypair
- Co-signs sensitive transactions (lesson completion, credentials)
- Prevents cheating while maintaining decentralization

### 5. Dual Identity Pattern

- Better Auth ID (web2 authentication)
- Payload User ID (CMS data)
- Solana Wallet (web3 identity)
- Services map between all three

---

## Technology Stack

### Frontend

- **Next.js 14** - App Router, Server Components
- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - Global state management
- **React Query** - Server state management
- **Framer Motion** - Animations

### Backend

- **Payload CMS** - Headless CMS
- **Better Auth** - Authentication
- **PostgreSQL** - Database
- **Next.js API Routes** - REST API

### Blockchain

- **Solana** - Layer 1 blockchain
- **Anchor** - Solana framework
- **Token-2022** - XP token standard
- **Metaplex Core** - NFT standard
- **@coral-xyz/anchor** - TypeScript client

### Infrastructure

- **Vercel** - Hosting
- **Helius** - RPC + DAS API
- **PostHog** - Analytics
- **Sentry** - Error tracking

---

## Security Considerations

1. **Access Control:**
   - Payload collections have role-based access
   - Backend signer required for sensitive operations
   - Wallet signatures required for user actions

2. **Data Validation:**
   - Server-side validation in services
   - Client-side validation in forms
   - Solana program validates all state changes

3. **Authentication:**
   - Better Auth handles session management
   - Wallet signatures prove ownership
   - Co-signing prevents unauthorized state changes

4. **Rate Limiting:**
   - API routes protected by rate limits
   - Solana transactions limited by wallet balance
   - Cooldown periods on certain actions

---

## Performance Optimizations

1. **Caching:**
   - React Query caches API responses
   - Zustand stores cache global state
   - Payload uses PostgreSQL indexes

2. **Pagination:**
   - Leaderboard uses offset pagination
   - Course lists paginated
   - Infinite scroll for long lists

3. **Lazy Loading:**
   - Components code-split
   - Images lazy loaded
   - Modules loaded on demand

4. **Database Optimization:**
   - Indexed fields for queries
   - Depth control for relationships
   - Select specific fields only

---

## Development Workflow

1. **Local Development:**

   ```bash
   # Start Payload + Next.js
   cd onchain-academy/apps/academy
   npm run dev

   # Build Solana program
   cd onchain-academy
   anchor build

   # Run tests
   anchor test
   ```

2. **Database Migrations:**

   ```bash
   npx payload migrate:create   # Create migration
   npx payload migrate          # Apply migrations
   npx payload generate:types   # Generate TypeScript types
   ```

3. **Deployment:**
   - Frontend: Vercel (automatic from main branch)
   - Database: Vercel Postgres
   - Solana Program: `anchor deploy`

---

## Future Enhancements

- [ ] Real-time leaderboard updates (WebSockets)
- [ ] Course completion certificates (PDF generation)
- [ ] Social features (comments, discussions)
- [ ] Mobile app (React Native)
- [ ] Advanced analytics dashboard
- [ ] Multi-language support expansion
- [ ] Video lesson support
- [ ] Live coding challenges
- [ ] Peer review system
- [ ] Instructor dashboard
