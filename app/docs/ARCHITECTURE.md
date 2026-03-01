# Architecture Overview

System architecture, component structure, data flow, and service interfaces for the Superteam Academy frontend.

## 1. App Router Structure

```
src/app/
+-- layout.tsx                    # Root shell (Header, Sidebar, Footer, providers)
+-- page.tsx                      # Landing page
+-- (auth)/sign-in/page.tsx       # SIWS + Google sign-in
+-- (auth)/sign-up/page.tsx       # SIWS + Google sign-up
+-- courses/page.tsx              # Course catalog with search + difficulty filter
+-- courses/[slug]/page.tsx       # Course detail + enrollment
+-- courses/[slug]/lessons/[id]/  # Lesson viewer + code editor + challenges
+-- dashboard/page.tsx            # Learner metrics, enrolled courses, activity
+-- leaderboard/page.tsx          # On-chain XP ranking + timeframe filter
+-- profile/[username]/page.tsx   # Public profile + credentials display
+-- certificates/[id]/page.tsx    # Credential detail + Solana Explorer links
+-- settings/page.tsx             # Language, theme, wallet management
+-- loading.tsx                   # Global loading state
+-- error.tsx                     # Error boundary (reports to Sentry)
+-- not-found.tsx                 # 404 page
```

## 2. Provider Composition

Defined in `src/components/providers/app-providers.tsx` (outer to inner):

1. **ThemeProvider** (next-themes) - Dark/light/system mode
2. **IntlProvider** (next-intl) - Locale-aware translations
3. **QueryProvider** (TanStack React Query) - Server state caching (30s stale, 1 retry)
4. **AcademyWalletProvider** (Solana Wallet Adapter) - Phantom + Solflare

Also in root layout:
- **Sonner Toaster** - Toast notifications (bottom-right, rich colors)
- **GA4 Script** - Conditional on `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- **Sentry** - Wraps `next.config.ts` via `withSentryConfig`

## 3. Authentication

### Sign-In With Solana (SIWS)

```
Client                          Server
  |-- GET /api/auth/nonce -------->|  Generate 32-byte nonce
  |<-------- { nonce } ------------|
  |                                |
  |-- wallet.signMessage(msg) ---->|  Sign nonce with wallet
  |                                |
  |-- POST /api/auth/callback ---->|  NextAuth CredentialsProvider("solana")
  |   { walletAddress, signature,  |  -> verifySiws() validates signature
  |     nonce, message }           |  -> Prisma upsert User
  |<-------- JWT session ----------|  -> Return JWT (7-day maxAge)
```

### Google OAuth

Conditionally enabled when `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` are set. Standard NextAuth GoogleProvider flow.

### Session Strategy

JWT-based. Session includes `walletAddress` via custom callbacks in `src/lib/auth/auth-options.ts`.

## 4. API Routes

| Route | Method | Auth | Validation | Description |
|-------|--------|------|------------|-------------|
| `/api/auth/[...nextauth]` | `*` | Public | NextAuth | Auth handlers |
| `/api/auth/nonce` | GET | Public | - | SIWS nonce generation |
| `/api/user` | GET | Public | Query param | Fetch user by wallet |
| `/api/user` | PATCH | Public | Body fields | Upsert profile |
| `/api/lessons/complete` | POST | `requireSession()` | `completeLessonSchema` | Backend-signed lesson completion |
| `/api/courses/finalize` | POST | `requireSession()` | `finalizeCourseSchema` | Backend-signed course finalization + XP |
| `/api/courses/issue-credential` | POST | `requireSession()` | `issueCredentialSchema` | Backend-signed credential mint |
| `/api/leaderboard` | GET | Public | - | On-chain XP leaderboard (top 50) |

Protected routes use `requireSession()` from `src/lib/auth/require-session.ts` and Zod schemas from `src/lib/api-schemas.ts`.

## 5. On-Chain Integration

### Program Client (`src/lib/solana/program-client.ts`)

- `connection` - Helius RPC with confirmed commitment
- `getReadonlyProvider()` - Read-only AnchorProvider (no signing)
- `getProgram()` - Anchor Program instance for reads
- `getSignerProgram(wallet)` - Anchor Program with wallet signer

### On-Chain Service (`src/lib/solana/on-chain-service.ts`)

| Function | Returns | Description |
|----------|---------|-------------|
| `fetchAllCourses()` | `OnChainCourse[]` | All course accounts from program |
| `fetchCourse(courseId)` | `OnChainCourse` | Single course by PDA |
| `fetchEnrollment(courseId, learner)` | `OnChainEnrollment` | Enrollment + completed lesson count (bit-counted) |
| `fetchXpBalance(wallet)` | `number` | Token-2022 ATA balance |
| `fetchXpLeaderboard()` | `LeaderboardEntry[]` | All XP holders sorted desc |

### Backend Signer (`src/lib/solana/backend-signer.ts`)

Loads keypair from `BACKEND_SIGNER_KEY` env var (supports base58 and JSON byte-array). Used by API routes for server-side transaction signing.

### Transaction Flows

**Client-signed (enrollment):**
```
useEnrollment hook -> enrollOnChain(anchorWallet, courseId) -> wallet signs -> broadcast
```

**Backend-signed (lesson completion, finalization, credential):**
```
Client POST /api/... -> requireSession() -> Zod validate -> getBackendKeypair()
  -> build instruction -> sign with backend keypair -> broadcast -> return txSig
```

## 6. React Query Hooks (`src/hooks/use-on-chain.ts`)

| Hook | Query Key | Stale Time |
|------|-----------|------------|
| `useOnChainCourses()` | `["onchain-courses"]` | 60s |
| `useOnChainCourse(courseId)` | `["onchain-course", id]` | 60s |
| `useOnChainEnrollment(courseId, wallet)` | `["onchain-enrollment", id, wallet]` | 15s |
| `useOnChainXp(wallet)` | `["onchain-xp", wallet]` | 15s |

## 7. State Management

### Zustand Store (`src/lib/store/user-store.ts`)

Persisted to localStorage (key: `academy-user-state-v1`).

| Field | Type | Description |
|-------|------|-------------|
| `profile` | `UserProfile` | Display name, avatar, XP, level, interests |
| `locale` | `Locale` | en / pt-BR / es |
| `theme` | `string` | dark / light / system |
| `walletAddress` | `string?` | Connected wallet |
| `enrollments` | `string[]` | Enrolled course IDs |
| `completedLessons` | `Record<string, string[]>` | courseId -> lessonId[] |
| `streakDays` | `string[]` | ISO date strings (last 90) |

Actions: `setLocale`, `setTheme`, `setWalletAddress`, `updateProfile`, `enroll`, `completeLesson`, `addXp`, `recordActivity`.

Wallet switch/disconnect automatically clears enrollments and completedLessons.

## 8. Database (Prisma)

PostgreSQL via `@prisma/adapter-pg`. Schema at `prisma/schema.prisma`.

| Model | Key Fields | Purpose |
|-------|-----------|---------|
| `User` | id, walletAddress (unique), displayName, username (unique), bio, avatar | User profiles |
| `Activity` | id, userId (FK), kind, courseId, lessonIdx, txSig, xpEarned | Activity log |

Indexed: `[userId, createdAt]`, `[kind]`.

## 9. Service Interface Pattern

Service interfaces in `src/lib/services/` define stable contracts. Current implementations use local/mock data. Backend swap happens by replacing implementation classes behind the same exports.

| Interface | File | Current Impl |
|-----------|------|--------------|
| `CourseService` | `course-service.ts` | `LocalCourseService` |
| `LearningProgressService` | `learning-progress.ts` | `LocalLearningProgressService` |
| `AchievementService` | `achievement-service.ts` | `LocalAchievementService` |
| `LeaderboardService` | `leaderboard-service.ts` | `LocalLeaderboardService` |
| `CredentialService` | `credential-service.ts` | `LocalCredentialService` |

See [CMS_GUIDE.md](CMS_GUIDE.md) for migration strategy.

## 10. Data Flow

```
REFERENCE_COURSE_CATALOG.ts
        |
        v
src/lib/data/mock-courses.ts  (maps to Course model)
        |
        v
src/lib/services/*Service     (interface boundary)
        |
        v
src/hooks/use-*.ts            (React hooks, React Query)
        |
        v
src/app/*/page.tsx            (route components)
```

On-chain reads flow separately:

```
Solana Program (Anchor)
        |
        v
on-chain-service.ts           (fetchAllCourses, fetchXpBalance, etc.)
        |
        v
use-on-chain.ts               (React Query wrappers)
        |
        v
use-enrollment.ts / use-xp.ts (composite hooks)
        |
        v
UI components
```
