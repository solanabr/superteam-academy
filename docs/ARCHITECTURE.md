# Superteam Academy -- Architecture Reference

System architecture, component structure, data flow, and service interfaces for Superteam Academy -- a Solana-native educational LMS.

---

## 1. System Architecture Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                        BROWSER (Client)                              │
│                                                                      │
│  React + Solana Wallet Adapter (Phantom, Solflare, Backpack)         │
│  Monaco Editor (code challenges) · canvas-confetti (celebrations)    │
└───────────┬─────────────────────────┬────────────────────────────────┘
            │ fetch / POST            │ wallet signs (enroll, close)
            │                         │
┌───────────▼─────────────────────────▼────────────────────────────────┐
│                    NEXT.JS 14 (App Router on Vercel)                  │
│                                                                      │
│  Server Components ── API Routes ── Middleware (auth + i18n)         │
│                                                                      │
│  Holds: BACKEND_SIGNER_SECRET · PROGRAM_AUTHORITY_SECRET             │
│         SUPABASE_SERVICE_ROLE_KEY · SANITY_ADMIN_TOKEN               │
└──┬───────────┬──────────────┬──────────────┬─────────────────────────┘
   │           │              │              │
   ▼           ▼              ▼              ▼
┌──────┐  ┌────────┐  ┌───────────┐  ┌──────────────────────────────┐
│Sanity│  │Supabase│  │  Solana   │  │  Build Server (Rust/Axum)    │
│(CMS) │  │(DB +   │  │ (Devnet) │  │  on GCP Cloud Run            │
│      │  │ Auth)  │  │          │  │  cargo-build-sbf --offline   │
└──────┘  └────────┘  │ Token-2022│  └──────────────────────────────┘
                      │ Metaplex  │
                      │   Core    │
                      └───────────┘
```

### Monorepo Layout

| Directory            | Purpose                                                                         |
| -------------------- | ------------------------------------------------------------------------------- |
| `apps/web/`          | Next.js 14 application (pages, API routes, components, services)                |
| `apps/build-server/` | Rust/Axum Solana program compiler on GCP Cloud Run                              |
| `onchain-academy/`   | Anchor workspace (program source, IDL, tests)                                   |
| `packages/types/`    | Shared TypeScript interfaces (`Course`, `UserProfile`, `Progress`)              |
| `packages/config/`   | Shared ESLint, TypeScript, Tailwind configs                                     |
| `sanity/`            | Sanity Studio schemas (`course`, `module`, `lesson`, `achievement`) + seed data |
| `supabase/`          | Complete Postgres schema (tables, indexes, RLS, functions)                      |

### Deployment Model

| Service          | Host                       | Notes                                    |
| ---------------- | -------------------------- | ---------------------------------------- |
| Web app          | Vercel                     | Edge middleware, automatic deploys       |
| Database + Auth  | Supabase (hosted Postgres) | RLS, SECURITY DEFINER functions          |
| CMS              | Sanity (hosted)            | GROQ queries via CDN                     |
| On-chain program | Solana devnet              | Anchor 0.31+, Token-2022, Metaplex Core  |
| Build server     | GCP Cloud Run              | Docker, no IAM gateway, `X-API-Key` auth |

---

## 2. Component Structure

### Page Hierarchy

```
RootLayout (app/layout.tsx)
  └── [locale] layout (ThemeProvider + SolanaWalletProvider + GamificationOverlays)
       ├── (marketing)/           ← Public landing page
       │    └── page.tsx          ← Landing with terminal typewriter
       │
       ├── (platform)/            ← Platform routes (layout: Header + Sidebar + Footer)
       │    ├── dashboard/        ← Auth-gated: enrolled courses, XP, streaks
       │    ├── courses/          ← Public: course catalog
       │    │    └── [slug]/      ← Public: course detail
       │    │         └── lessons/[id]/  ← Public: lesson view + code editor
       │    ├── profile/          ← Auth-gated (own profile)
       │    │    └── [username]/  ← Public: other users' profiles
       │    ├── leaderboard/      ← Public: XP rankings
       │    ├── certificates/     ← Public: certificate list
       │    │    └── [id]/        ← Public: individual certificate
       │    └── settings/         ← Auth-gated: account settings
       │
       └── admin/                 ← Admin dashboard (admin_session cookie required)
```

### Component Groups

| Directory       | Components                                                                                                                                                 | Purpose                                                 |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| `ui/`           | Button, Card, Dialog, Avatar, Progress, Tabs, DropdownMenu                                                                                                 | shadcn/ui base primitives (Radix UI)                    |
| `course/`       | CourseCard, ProgressBar, CurriculumAccordion, DifficultyBadge                                                                                              | Course display and progress tracking                    |
| `editor/`       | ChallengeInterface, CodeEditor, ChallengeRunner, OutputPanel                                                                                               | Monaco editor with in-browser test runner               |
| `gamification/` | XpPopup, LevelUpOverlay, LevelBadge, StreakDisplay, SkillRadar, AchievementCard, AchievementGrid, AchievementPopup, CertificatePopup, GamificationOverlays | XP animations, achievement celebrations, streak display |
| `certificates/` | CertificateCard, CertificateGrid, CourseCompletionMint                                                                                                     | NFT credential display and minting UI                   |
| `deploy/`       | DeployPanel, WalletFundingCard, GenericProgramExplorer                                                                                                     | Student program deployment panel                        |
| `admin/`        | CourseSyncTable, AchievementSyncTable, StatusBadge, SyncDiffView, ImmutableMismatchWarning                                                                 | Admin CMS-to-chain sync UI                              |
| `auth/`         | AuthModal, WalletAuthHandler, UserMenu                                                                                                                     | Wallet + OAuth authentication                           |
| `layout/`       | Header, Footer, Sidebar, LanguageSwitcher, ThemeProvider, ThemeToggle                                                                                      | Page chrome, navigation, theming                        |
| `landing/`      | TerminalTypewriter                                                                                                                                         | Landing page animation                                  |
| `profile/`      | WalletNameGenerator                                                                                                                                        | Fun name generation for wallet users                    |
| `analytics/`    | AnalyticsProvider                                                                                                                                          | GA4 + PostHog + Sentry wrapper                          |

### Client vs Server Components

| Type                    | Used For                             | Examples                                                 |
| ----------------------- | ------------------------------------ | -------------------------------------------------------- |
| Server                  | Data fetching, SEO, static rendering | Course detail page, lesson page, leaderboard             |
| Client (`"use client"`) | Interactivity, browser APIs, wallet  | AuthModal, CodeEditor, GamificationOverlays, ThemeToggle |

---

## 3. Data Flow

### Four Data Sources

| Source                | Data                                                                | Access Pattern                                                        |
| --------------------- | ------------------------------------------------------------------- | --------------------------------------------------------------------- |
| **Sanity CMS**        | Course content (titles, modules, lessons, challenges, achievements) | Read-only via GROQ queries in server components                       |
| **Supabase Postgres** | User data (profiles, progress, XP, achievements, certificates)      | Client reads via anon key + RLS; writes via API routes + service_role |
| **Solana Blockchain** | Token-2022 XP balances, Enrollment PDAs, Credential NFTs            | On-chain writes via backend signer; reads via RPC                     |
| **Build Server**      | Compiled Solana programs (.so binaries)                             | POST source to `/build`, GET binary from `/deploy/{uuid}`             |

### Content Flow (Sanity to Pages)

```
Sanity CMS (content authoring)
       │
       ▼ GROQ queries via CDN
       │
Next.js Server Components ──► Rendered HTML
```

Courses are only visible to students when their Sanity document has `onChainStatus.status == "synced"`. This filter is applied in every public-facing GROQ query (`getAllCourses`, `getCourseBySlug`, `getLessonBySlug`, etc.). Unpublished or undeployed courses are invisible to the platform but visible in the admin dashboard.

Key queries in `lib/sanity/queries.ts`:

| Function                                  | Returns                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------------ |
| `getAllCourses()`                         | All synced courses with modules and lesson summaries                           |
| `getCourseBySlug(slug)`                   | Single course with full module/lesson content                                  |
| `getLessonBySlug(courseSlug, lessonSlug)` | Single lesson with code, tests, hints, solution                                |
| `getCourseById(id)`                       | Course by Sanity `_id` (used in API routes), includes `trackCollectionAddress` |
| `getAllCourseLessonCounts()`              | `{ _id, totalLessons }[]` for course-completion detection                      |
| `getAllAchievements()`                    | All achievement definitions (for unlock checking)                              |
| `getDeployedAchievements()`               | Achievements with on-chain PDAs only                                           |
| `getAllCoursesAdmin()`                    | All courses including drafts and `onChainStatus` fields                        |
| `getAllAchievementsAdmin()`               | All achievements with `onChainStatus` fields                                   |

Sanity admin mutations (`lib/sanity/admin-mutations.ts`):

| Function                                                                     | Purpose                                     |
| ---------------------------------------------------------------------------- | ------------------------------------------- |
| `writeCourseOnChainStatus(sanityId, status, coursePda, txSignature)`         | Mark course as synced after on-chain deploy |
| `writeCourseTrackCollection(sanityId, trackCollectionAddress)`               | Store credential collection address         |
| `writeAchievementOnChainStatus(sanityId, achievementPda, collectionAddress)` | Mark achievement as synced                  |

### Auth Flow

#### SIWS (Sign In With Solana)

```
1. User clicks "Connect Wallet" → wallet adapter modal
2. POST /api/auth/nonce → server generates nonce, stores in siws_nonces table (5-min TTL)
3. Client builds SIWS message (domain, nonce, expiry) → wallet signs
4. POST /api/auth/wallet → server validates:
   ├── Nonce exists in siws_nonces with status='pending' and not expired
   ├── Domain matches Host header
   └── Ed25519 signature valid (tweetnacl)
5. Server creates/finds user (synthetic email: {pubkey}@wallet.superteam-lms.local)
6. Generates magic link → verifies OTP → session cookies set
7. Updates profiles.wallet_address, assigns generated wallet name if placeholder
```

#### Google/GitHub OAuth

```
1. User clicks "Sign in with Google/GitHub"
2. Supabase redirects to OAuth consent screen
3. Provider redirects to /api/auth/callback with authorization code
4. Server exchanges code for session (redirect URL sanitization applied)
5. Database trigger auto-creates profiles + user_xp rows
6. User redirected to dashboard
```

### Lesson Completion Flow (Critical Path)

The `POST /api/lessons/complete` route orchestrates the entire learning loop. This is the most complex API route in the system. Each step is documented with its failure mode.

```
Client: POST /api/lessons/complete { lessonId, courseId }
  │
  ├── 1. Auth check ── getUser() from Supabase session cookie
  │    Failure: 401 Unauthorized
  │
  ├── 2. Supabase enrollment check ── enrollments table lookup
  │    Failure: 403 Not enrolled
  │
  ├── 3. Supabase idempotency check ── user_progress.completed lookup
  │    If already completed: return { alreadyCompleted: true, xpEarned: 0 }
  │
  ├── 4. Wallet + program liveness check
  │    If no wallet or program not deployed: skip on-chain, continue to DB writes
  │
  ├── 5. On-chain bitmap idempotency ── fetchEnrollment() → isLessonComplete()
  │    If bit already set: skip completeLesson TX, fall through
  │
  ├── 6. completeLesson instruction ── backend signer signs, XP minted via CPI
  │    Pre-instruction: create learner Token-2022 ATA if needed
  │    Failure: 500 (transaction fails)
  │
  ├── 7. Re-fetch enrollment ── check updated bitmap for course completion
  │
  ├── 8. Auto-finalize if all lessons complete:
  │    ├── finalizeCourse instruction ── completion bonus XP + creator XP
  │    ├── Supabase mirror: enrollments.completed_at = now  (non-fatal)
  │    └── Failure: logged, can retry later
  │
  ├── 9. Auto-mint credential if finalized and no credential_asset:
  │    ├── Validate track collection (exists on-chain, owned by Metaplex Core)
  │    ├── Store metadata JSON in nft_metadata table
  │    ├── issueCredential instruction ── Metaplex Core NFT, Config PDA signs
  │    ├── Supabase mirror: certificates table insert  (non-fatal)
  │    └── Failure: logged, orphaned metadata cleaned up, non-fatal
  │
  ├── 10. Supabase DB writes:
  │    ├── Upsert user_progress (lesson marked complete)  ── REQUIRED, 500 on failure
  │    ├── award_xp() SECURITY DEFINER (XP + streak)  ── non-fatal
  │    └── These are "Supabase mirror" writes: on-chain is source of truth
  │
  ├── 11. Achievement check:
  │    ├── Fetch user state (XP, streaks, completed lessons/courses)
  │    ├── checkNewAchievements() against UNLOCK_CHECKS
  │    ├── For each new achievement:
  │    │    ├── unlock_achievement() in Supabase  ── logged on failure
  │    │    └── awardAchievement() on-chain (NFT mint)  ── non-fatal
  │    └── Failed achievements listed in response as failedAchievements
  │
  └── 12. Response → client dispatches popup events:
       ├── dispatchXpGain(xpEarned)           → "xp-gain" CustomEvent
       ├── dispatchAchievementUnlock(id, name) → "superteam:achievement-unlock"
       └── dispatchCertificateMinted(certId)   → "superteam:certificate-minted"
```

**"Non-fatal" pattern**: Supabase mirror writes and on-chain achievement mints use try/catch. Failure is logged but does not abort the response or return a 500. The on-chain state (enrollment bitmap, XP tokens, credential NFT) is the source of truth; Supabase mirrors exist for fast queries, streaks, and leaderboards.

### Enrollment Flow

```
1. Client builds enroll(courseId) instruction
2. Learner wallet signs the transaction
3. On-chain: Enrollment PDA created (lesson_flags = 0, completed_at = None)
4. If course has prerequisite: verified via remaining accounts
5. Supabase: enrollment row mirrored via /api/enrollment/sync
```

### Admin Deployment Flow

```
Admin Dashboard → POST /api/admin/courses/sync
  │
  ├── Verify ADMIN_SECRET (Bearer token in Authorization header)
  ├── deployCoursePda() via admin-signer.ts → createCourse instruction
  ├── deployCourseTrackCollection() → Metaplex Core collection (UMI)
  ├── writeCourseOnChainStatus() → Sanity marks course as "synced"
  └── writeCourseTrackCollection() → Sanity stores collection address

Similarly for achievements:
  POST /api/admin/achievements/sync
  ├── deployAchievementType() → createAchievementType + collection
  └── writeAchievementOnChainStatus() → Sanity marks as "synced"
```

---

## 4. Service Interfaces

### `academy-program.ts` -- Backend-Signed Instructions

Server-only module (`import "server-only"`). Builds and sends Anchor instructions using the `BACKEND_SIGNER_SECRET` keypair. Lazy-loaded connection and program singletons.

| Export                                                                                      | Purpose                                                   |
| ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| `getConnection()`                                                                           | Lazy singleton RPC connection                             |
| `getBackendSigner()`                                                                        | Load backend signer from `BACKEND_SIGNER_SECRET` env var  |
| `getProgram()`                                                                              | Lazy Anchor `Program` instance (camelCase IDL conversion) |
| `isOnChainProgramLive()`                                                                    | Check if Config PDA exists (cached, 60s TTL)              |
| `completeLesson(courseId, learner, lessonIndex)`                                            | Set bitmap bit + mint XP via CPI                          |
| `finalizeCourse(courseId, learner)`                                                         | Verify all lessons complete, award bonus XP               |
| `issueCredential(courseId, learner, name, uri, coursesCompleted, totalXp, trackCollection)` | Mint Metaplex Core soulbound credential NFT               |
| `awardAchievement(achievementId, recipient)`                                                | Mint achievement NFT + XP reward                          |

All instruction wrappers pre-create Token-2022 ATAs via `createAssociatedTokenAccountIdempotentInstruction` before the program instruction.

### `admin-signer.ts` -- Admin Deployment Functions

Server-only module. Uses `PROGRAM_AUTHORITY_SECRET` (the `config.authority` keypair) for admin-level instructions.

| Export                                | Purpose                                                                  |
| ------------------------------------- | ------------------------------------------------------------------------ |
| `isAdminSignerReady()`                | Check if authority keypair loaded successfully                           |
| `deployCoursePda(params)`             | Submit `createCourse` instruction on-chain                               |
| `updateCoursePda(params)`             | Submit `updateCourse` with optional fields                               |
| `deactivateCoursePda(courseId)`       | Set `is_active = false` (convenience wrapper)                            |
| `deployAchievementType(params)`       | Submit `createAchievementType` + generate collection keypair             |
| `deployCourseTrackCollection(params)` | Create Metaplex Core collection via UMI (Config PDA as update authority) |
| `verifyAuthorityMatchesConfig()`      | Compare local keypair against on-chain Config.authority                  |

### `pda.ts` -- PDA Derivation Helpers

| Function                                                          | Seeds                                               | Returns             |
| ----------------------------------------------------------------- | --------------------------------------------------- | ------------------- |
| `findConfigPDA(programId?)`                                       | `["config"]`                                        | `[PublicKey, bump]` |
| `findCoursePDA(courseId, programId?)`                             | `["course", courseId]`                              | `[PublicKey, bump]` |
| `findEnrollmentPDA(courseId, user, programId?)`                   | `["enrollment", courseId, user]`                    | `[PublicKey, bump]` |
| `findMinterRolePDA(minter, programId?)`                           | `["minter", minter]`                                | `[PublicKey, bump]` |
| `findAchievementTypePDA(achievementId, programId?)`               | `["achievement", achievementId]`                    | `[PublicKey, bump]` |
| `findAchievementReceiptPDA(achievementId, recipient, programId?)` | `["achievement_receipt", achievementId, recipient]` | `[PublicKey, bump]` |

All functions accept an optional `programId` parameter (defaults to `PROGRAM_ID` from env).

### `bitmap.ts` -- Lesson Completion Bitmap

The on-chain Enrollment account stores lesson completion as `lesson_flags: [u64; 4]` -- a 256-bit bitmap. Each lesson index maps to a single bit: `word = floor(index / 64)`, `bit = index % 64`.

| Function                                         | Purpose                                             |
| ------------------------------------------------ | --------------------------------------------------- |
| `decodeLessonBitmap(lessonFlags, lessonCount)`   | Returns `boolean[]` of completion status per lesson |
| `isLessonComplete(lessonFlags, lessonIndex)`     | Check single lesson bit                             |
| `isAllLessonsComplete(lessonFlags, lessonCount)` | True when all bits 0..lessonCount-1 are set         |

Input accepts `BN`, `bigint`, or `number` -- converts internally to `BigInt` for bitwise operations.

### `parse-program-error.ts` -- Error Resolution

| Function                       | Purpose                                                                          |
| ------------------------------ | -------------------------------------------------------------------------------- |
| `extractCustomErrorCode(logs)` | Extract Anchor custom error code from `"custom program error: 0x..."` in TX logs |
| `resolveIdlError(code, idl)`   | Map error code to `{ code, name, msg }` using the IDL's errors array             |

Error codes >= 6000 are program-specific (index = code - 6000). Codes < 6000 are Anchor framework errors.

### `account-resolver.ts` -- IDL-Driven Account Resolution

Used by the generic program explorer (`deploy/generic-program-explorer.tsx`) to auto-fill instruction accounts for student-deployed programs.

Resolution priority:

1. IDL `address` field (Anchor 0.32 format)
2. Wallet convention names (`user`, `authority`, `signer`, `payer`)
3. Well-known programs (`SystemProgram`, `TokenProgram`, etc.)
4. PDA derivation from IDL seed definitions
5. Stored/generated keypairs for mutable + signer accounts
6. Unresolved fallback (manual input required)

### `xp-mint.ts` -- Token-2022 XP Minting/Burning

Server-only module using `XP_MINT_AUTHORITY_SECRET`. Separate from `academy-program.ts` because it uses raw `@solana/spl-token` calls rather than Anchor instructions.

| Function                                | Purpose                                                                     |
| --------------------------------------- | --------------------------------------------------------------------------- |
| `mintXpToWallet(walletAddress, amount)` | Mint Token-2022 XP tokens to a user's ATA (creates ATA if needed)           |
| `burnXpFromWallet(walletAddress)`       | Burn ALL XP from a wallet via PermanentDelegate (no owner signature needed) |

Used for wallet link/unlink flow, not for lesson completion (which uses on-chain CPI).

---

## 5. On-Chain Integration Points

### Program Instructions (16 total)

The Solana program (`onchain-academy`) is built with Anchor 0.31+. Instruction names in Rust are snake_case; Anchor's `Program` constructor converts them to camelCase for TypeScript.

| Instruction (Rust)            | TypeScript Builder (`academy-program.ts`)         | Signer            |
| ----------------------------- | ------------------------------------------------- | ----------------- |
| `initialize`                  | -- (one-time setup via `scripts/init-program.ts`) | Authority         |
| `update_config`               | -- (admin CLI)                                    | Authority         |
| `create_course`               | `deployCoursePda()` in `admin-signer.ts`          | Authority         |
| `update_course`               | `updateCoursePda()` in `admin-signer.ts`          | Authority         |
| `enroll`                      | Client-side via `instructions.ts`                 | Learner wallet    |
| `complete_lesson`             | `completeLesson()` in `academy-program.ts`        | Backend signer    |
| `finalize_course`             | `finalizeCourse()` in `academy-program.ts`        | Backend signer    |
| `close_enrollment`            | Client-side via `instructions.ts`                 | Learner wallet    |
| `issue_credential`            | `issueCredential()` in `academy-program.ts`       | Backend signer    |
| `upgrade_credential`          | -- (not yet used in API routes)                   | Backend signer    |
| `register_minter`             | -- (admin CLI)                                    | Authority         |
| `revoke_minter`               | -- (admin CLI)                                    | Authority         |
| `reward_xp`                   | -- (minter CLI)                                   | Registered minter |
| `create_achievement_type`     | `deployAchievementType()` in `admin-signer.ts`    | Authority         |
| `award_achievement`           | `awardAchievement()` in `academy-program.ts`      | Registered minter |
| `deactivate_achievement_type` | -- (admin CLI)                                    | Authority         |

### PDA Table

Derived from the Rust state structs (`onchain-academy/programs/onchain-academy/src/state/*.rs`) and the TypeScript helpers (`lib/solana/pda.ts`).

| PDA                | Seeds                                                | Closeable | Size  | TypeScript                                            |
| ------------------ | ---------------------------------------------------- | --------- | ----- | ----------------------------------------------------- |
| Config             | `["config"]`                                         | No        | 113 B | `findConfigPDA()`                                     |
| Course             | `["course", course_id]`                              | No        | 192 B | `findCoursePDA(courseId)`                             |
| Enrollment         | `["enrollment", course_id, learner]`                 | Yes       | 127 B | `findEnrollmentPDA(courseId, user)`                   |
| MinterRole         | `["minter", minter]`                                 | Yes       | 110 B | `findMinterRolePDA(minter)`                           |
| AchievementType    | `["achievement", achievement_id]`                    | No        | 338 B | `findAchievementTypePDA(achievementId)`               |
| AchievementReceipt | `["achievement_receipt", achievement_id, recipient]` | No        | 49 B  | `findAchievementReceiptPDA(achievementId, recipient)` |

**Config** is the singleton root. It stores `authority` (platform multisig), `backend_signer` (rotatable), and `xp_mint` (Token-2022 mint address). Config PDA is also the update authority for all Metaplex Core collections.

**Enrollment** tracks per-user per-course state: `lesson_flags` (256-bit bitmap), `completed_at`, and `credential_asset` (set after `issue_credential`).

**AchievementReceipt** is a thin PDA whose existence prevents double-awarding (PDA init collision = error).

### Token-2022 XP

- **Mint**: Created during `initialize`, owned by Config PDA
- **Extensions**: NonTransferable (soulbound, cannot be transferred between wallets) + PermanentDelegate (platform can burn/adjust without owner signature)
- **Decimals**: 0 (1 token = 1 XP)
- **Minting**: Via CPI in `complete_lesson` (`xp_per_lesson` amount) and `finalize_course` (completion bonus = `floor(xp_per_lesson * lesson_count / 2)`)
- **Creator rewards**: `finalize_course` mints `creator_reward_xp` to the course creator's ATA when `total_completions >= min_completions_for_reward`

### Metaplex Core Credentials

- **Standard**: Metaplex Core (not legacy Token Metadata)
- **Soulbound**: `PermanentFreezeDelegate` plugin applied at creation
- **Collection**: One Metaplex Core collection per course track, created via `deployCourseTrackCollection()` using UMI
- **Update authority**: Config PDA signs as collection update authority for CPI calls
- **Attributes plugin**: Stores `courses_completed` and `total_xp` on the NFT
- **Create vs upgrade**: `enrollment.credential_asset == None` triggers `createV2` CPI; `Some(pubkey)` triggers `updateV1` + `updatePluginV1` CPI

### Idempotency Model

Three layers of idempotency prevent duplicate completions and wasteful transactions:

1. **Supabase check**: `user_progress.completed` -- if already true, return early (no TX submitted)
2. **On-chain bitmap check**: `isLessonComplete(enrollment.lesson_flags, index)` -- if bit already set, skip `completeLesson` TX
3. **Enrollment.completed_at**: If already set, skip `finalizeCourse` but proceed to credential check
4. **Enrollment.credential_asset**: If already set, skip `issueCredential`

### Trust Boundaries

| Role                     | Signs                                                                                                                          | Why                                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| **Learner wallet**       | `enroll`, `close_enrollment`                                                                                                   | Enrollment is a personal commitment; only the learner should create or close it |
| **Backend signer**       | `complete_lesson`, `finalize_course`, `issue_credential`                                                                       | Prevents gaming: backend validates lesson content was consumed before signing   |
| **Authority (multisig)** | `create_course`, `update_course`, `register_minter`, `revoke_minter`, `create_achievement_type`, `deactivate_achievement_type` | Platform governance, content management                                         |
| **Registered minter**    | `reward_xp`, `award_achievement`                                                                                               | Extensible XP distribution (events, community, streaks)                         |

The backend signer is stored in Config PDA and is rotatable via `update_config`. On devnet, authority and backend signer are typically the same keypair.

### Supabase Mirror Pattern

On-chain state is the source of truth for XP balances (Token-2022 ATA), enrollment status (bitmap), and credentials (Metaplex Core NFTs). Supabase mirrors this data for:

- **Fast queries**: Indexed tables for leaderboard, dashboard, profile
- **Streak tracking**: No on-chain equivalent (daily activity is Supabase-only)
- **Achievement records**: Supabase `user_achievements` is the UI source; on-chain minting is a bonus
- **Progress display**: `user_progress` table for lesson-level completion tracking

Mirror writes are non-fatal: if a Supabase write fails after an on-chain TX succeeds, the response still returns success. The on-chain state can be re-synced later.

---

## 6. Authentication and Authorization

### SIWS Flow

1. `GET /api/auth/nonce` -- generates nonce, stores in `siws_nonces` table with 5-minute TTL
2. Client builds SIWS message with domain + nonce + expiry, wallet signs via Ed25519
3. `POST /api/auth/wallet` -- verifies nonce (pending + not expired), domain match, signature
4. Nonce marked as `consumed` (replay protection)
5. Creates Supabase user with synthetic email `{pubkey}@wallet.superteam-lms.local`
6. Magic link generated → OTP verified → session cookies set
7. Assigns generated wallet name if username is placeholder (`user_XXXXXXXX`)

### Security Measures

- **Nonce replay**: Postgres table with status tracking (`pending` → `consumed`), background cleanup
- **Per-IP rate limiting**: Max 10 pending nonces per IP within TTL window
- **Domain validation**: SIWS message domain must match request Host header
- **Body size limit**: Wallet auth rejects requests > 10KB
- **Redirect sanitization**: OAuth callback prevents open redirects (no protocol-relative, no backslashes)
- **Generic errors**: No stack traces or internal details in API responses
- **Env var guards**: API routes fail-fast with 500 if required vars are missing

### RLS Model (10 tables, all with RLS enabled)

| Table               | SELECT                            | INSERT | UPDATE | DELETE |
| ------------------- | --------------------------------- | ------ | ------ | ------ |
| `profiles`          | Own + public (`is_public = true`) | Own    | Own    | --     |
| `enrollments`       | Own + public profiles             | Own    | --     | Own    |
| `user_progress`     | Own + public profiles             | Own    | Own    | --     |
| `user_xp`           | All (leaderboard)                 | --     | --     | --     |
| `xp_transactions`   | All (leaderboard)                 | --     | --     | --     |
| `user_achievements` | Own + public profiles             | --     | --     | --     |
| `certificates`      | Own + public profiles             | --     | --     | --     |
| `nft_metadata`      | All (public)                      | --     | --     | --     |
| `siws_nonces`       | None                              | None   | --     | --     |
| `deployed_programs` | Own                               | Own    | Own    | --     |

`user_xp`, `xp_transactions`, and `user_achievements` have no INSERT/UPDATE policies for authenticated users. All writes go through SECURITY DEFINER functions (`award_xp`, `unlock_achievement`) that are `REVOKE`d from `authenticated`, `anon`, and `public` and `GRANT`ed only to `service_role`.

`certificates` and `nft_metadata` have no INSERT policies for authenticated users. All writes go through service_role API routes to prevent users from fabricating completion records.

### Admin Auth

Admin routes use a separate `ADMIN_SECRET` environment variable. The admin page renders a login form; successful authentication sets an `admin_session` cookie. Sub-routes under `/admin/` redirect to the admin login page if the cookie is absent.

### Middleware

The middleware (`src/middleware.ts`) chains two concerns in order:

1. **Supabase auth**: Creates server client, calls `getUser()` (may refresh tokens via `setAll`)
2. **next-intl**: Adds locale prefix (default: `en`)

**Auth-gated routes** (redirect to landing if unauthenticated):

- `/dashboard`
- `/settings`
- `/profile` (exact -- own profile only)

**Public routes**:

- `/` (landing), `/courses`, `/courses/[slug]/lessons/[id]`
- `/leaderboard`, `/certificates`, `/certificates/[id]`
- `/profile/[username]` (viewing other users)

**Admin routes**: Checked against `admin_session` cookie, separate from Supabase auth.

The middleware matcher excludes API routes, `_next`, `_vercel`, and static assets.

---

## 7. Gamification System

### XP

XP is dual-tracked: Token-2022 on-chain (source of truth) + Supabase mirror (fast queries).

| Action                  | XP Range                                  | Enforcement                              |
| ----------------------- | ----------------------------------------- | ---------------------------------------- |
| Complete lesson         | 10-50 (by difficulty)                     | `xp_per_lesson` from on-chain Course PDA |
| Complete course (bonus) | `floor(xp_per_lesson * lesson_count / 2)` | `finalize_course` instruction            |
| Creator reward          | `creator_reward_xp` (when threshold met)  | `finalize_course` instruction            |

**Level formula**: `Level = floor(sqrt(totalXP / 100))`

Levels: 1 at 100 XP, 2 at 400 XP, 3 at 900 XP, 5 at 2,500 XP, 10 at 10,000 XP.

### Streaks

Handled entirely in the `award_xp()` SQL function:

- Yesterday activity: increment `current_streak`
- Today activity: no change
- Gap > 1 day: reset to 1
- `longest_streak = GREATEST(longest_streak, current_streak)`

### Achievements

Achievement metadata (name, description, icon, category) lives in **Sanity CMS**. Unlock logic lives in `lib/gamification/achievements.ts` as `UNLOCK_CHECKS`:

| Achievement ID      | Condition                      |
| ------------------- | ------------------------------ |
| `first-steps`       | 1+ lesson completed            |
| `course-completer`  | 1+ course completed            |
| `speed-runner`      | Course completed in < 24 hours |
| `week-warrior`      | 7-day streak                   |
| `monthly-master`    | 30-day streak                  |
| `consistency-king`  | 100-day streak                 |
| `rust-rookie`       | Completed a Rust lesson        |
| `anchor-expert`     | Completed an Anchor course     |
| `full-stack-solana` | Completed all tracks           |
| `early-adopter`     | Among first 100 users          |
| `perfect-score`     | All tests passed first try     |

Achievements without an `UNLOCK_CHECKS` entry (e.g., `bug-hunter`, `helper`) are admin-granted manually.

The check runs after every lesson completion. New achievements are:

1. Recorded in Supabase via `unlock_achievement()` SECURITY DEFINER function
2. Minted on-chain as Metaplex Core NFTs via `awardAchievement()` (non-fatal)

### Celebration Popups (Event Bus Pattern)

The client uses `window.dispatchEvent` / `CustomEvent` for real-time celebrations:

| Event Name                     | Dispatch Function                          | Listener Component | Duration |
| ------------------------------ | ------------------------------------------ | ------------------ | -------- |
| `xp-gain`                      | `dispatchXpGain(amount)`                   | `XpPopup`          | 2.5s     |
| `superteam:achievement-unlock` | `dispatchAchievementUnlock(id, name)`      | `AchievementPopup` | 4s       |
| `superteam:certificate-minted` | `dispatchCertificateMinted(certificateId)` | `CertificatePopup` | 5s       |

The `GamificationOverlays` component mounts all listener components when a user session exists. It renders in the `[locale]` layout so popups appear on all platform pages.

```
GamificationOverlays
  ├── XpPopup              ← fixed bottom-left, floating +XP badges
  ├── LevelUpOverlay       ← full-screen level-up celebration
  ├── AchievementPopup     ← bottom-left toast with achievement name
  └── CertificatePopup     ← bottom-left toast with "View Certificate" link
```

---

## 8. API Routes

All routes are in `apps/web/src/app/api/`.

| Route                              | Method | Auth         | Purpose                                                                            |
| ---------------------------------- | ------ | ------------ | ---------------------------------------------------------------------------------- |
| `/api/auth/nonce`                  | GET    | None         | Generate SIWS nonce (stored in `siws_nonces` table)                                |
| `/api/auth/wallet`                 | POST   | None         | SIWS authentication (nonce + Ed25519 verification)                                 |
| `/api/auth/callback`               | GET    | None         | Google/GitHub OAuth callback (code exchange)                                       |
| `/api/auth/link-wallet`            | POST   | Required     | Link wallet to existing account                                                    |
| `/api/auth/unlink`                 | POST   | Required     | Unlink auth method (wallet/Google/GitHub)                                          |
| `/api/lessons/complete`            | POST   | Required     | Mark lesson complete, award XP, auto-finalize, auto-credential, check achievements |
| `/api/courses/[courseId]/finalize` | POST   | Required     | Standalone course finalization on-chain                                            |
| `/api/credentials/issue`           | POST   | Required     | Standalone Metaplex Core credential issuance                                       |
| `/api/enrollment/sync`             | POST   | Required     | Sync on-chain enrollment to Supabase                                               |
| `/api/leaderboard`                 | GET    | None         | XP rankings (alltime/weekly/monthly)                                               |
| `/api/certificates/metadata`       | GET    | None         | Serve NFT metadata JSON by UUID                                                    |
| `/api/build-program`               | POST   | Required     | Proxy Anchor build to build server                                                 |
| `/api/deploy/save`                 | POST   | Required     | Save deployed program record                                                       |
| `/api/deploy/[uuid]`               | GET    | Required     | Download compiled .so binary                                                       |
| `/api/rust/execute`                | POST   | Required     | Proxy basic Rust execution to Rust Playground                                      |
| `/api/admin/auth`                  | POST   | ADMIN_SECRET | Admin authentication                                                               |
| `/api/admin/status`                | GET    | ADMIN_SECRET | Platform status (program liveness, authority match)                                |
| `/api/admin/courses/sync`          | POST   | ADMIN_SECRET | Deploy course PDA + collection on-chain                                            |
| `/api/admin/courses/deactivate`    | POST   | ADMIN_SECRET | Set course `is_active = false`                                                     |
| `/api/admin/courses/reactivate`    | POST   | ADMIN_SECRET | Set course `is_active = true`                                                      |
| `/api/admin/achievements/sync`     | POST   | ADMIN_SECRET | Deploy achievement type + collection on-chain                                      |

---

## 9. Database Schema

### Tables (10)

| Table               | Purpose                     | Key Columns                                                        |
| ------------------- | --------------------------- | ------------------------------------------------------------------ |
| `profiles`          | User identity               | `id` (FK auth.users), `wallet_address`, `username`, `is_public`    |
| `enrollments`       | Course enrollment records   | `user_id`, `course_id`, `completed_at`, `tx_signature`             |
| `user_progress`     | Per-lesson completion       | `user_id`, `lesson_id`, `completed`, `lesson_index`                |
| `user_xp`           | XP totals and streaks       | `user_id`, `total_xp`, `level`, `current_streak`, `longest_streak` |
| `xp_transactions`   | XP award history            | `user_id`, `amount`, `reason`, `tx_signature`                      |
| `user_achievements` | Achievement unlock records  | `user_id`, `achievement_id`, `asset_address`                       |
| `certificates`      | Credential NFT records      | `user_id`, `course_id`, `mint_address`, `credential_type`          |
| `nft_metadata`      | Full Metaplex metadata JSON | `id`, `data` (JSONB)                                               |
| `siws_nonces`       | Nonce replay protection     | `nonce`, `status`, `ip_address`, TTL-based cleanup                 |
| `deployed_programs` | Student program deployments | `user_id`, `program_id`, `network`                                 |

### Auto-Provisioning

The `on_auth_user_created` trigger fires `handle_new_user()` on every new auth.users insert:

1. Creates `profiles` row with username `user_{first_8_chars_of_id}`
2. Creates `user_xp` row initialized to 0 XP, level 0

### SECURITY DEFINER Functions

| Function                                      | Access                   | Purpose                                                                                  |
| --------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------- |
| `award_xp(user_id, amount, reason)`           | `service_role` only      | Insert XP transaction, update totals, manage streaks                                     |
| `unlock_achievement(user_id, achievement_id)` | `service_role` only      | Record achievement (ON CONFLICT DO NOTHING for idempotency)                              |
| `get_leaderboard(timeframe, limit)`           | `authenticated` + `anon` | Leaderboard query (alltime uses `user_xp`, weekly/monthly uses `xp_transactions` window) |

### Storage

- **avatars** bucket (public): Users can upload/update/delete their own avatar via `auth.uid()` folder path

---

## 10. Build Server Architecture

The build server is a standalone Rust/Axum service deployed on GCP Cloud Run for compiling student-authored Solana programs.

### Endpoints

| Route            | Method | Auth      | Rate Limit | Purpose                                 |
| ---------------- | ------ | --------- | ---------- | --------------------------------------- |
| `/build`         | POST   | X-API-Key | 5 req/min  | Compile Solana program                  |
| `/deploy/{uuid}` | GET    | X-API-Key | 20 req/min | Download compiled .so binary            |
| `/health`        | GET    | None      | None       | Health check with cache stats           |
| `/metrics`       | GET    | None      | None       | Build counts, durations, cache hit rate |

### Build Pipeline

1. Validate files (regex: `/src/*.rs` only, max 64 files, max 100KB each)
2. Block dangerous patterns (`std::process`, `std::fs`, `std::net`, `Command::new`, `proc_macro`)
3. SHA-256 content hash for cache lookup (cache hit returns immediately)
4. Semaphore-gated concurrency (default: 2 concurrent builds)
5. `cargo-build-sbf --offline` with pre-cached Anchor 0.32.1 dependencies
6. Background TTL cleanup of build directories

### Security

- SBF compilation target cannot access host system
- File validation (paths, sizes, blocked patterns)
- Non-root Docker execution (`academy` user)
- CORS exact origin match
- Per-IP rate limiting via tower-governor
- Request body limit: 512KB
- Constant-time API key comparison (`subtle::ConstantTimeEq`)

---

## 11. Key Design Decisions

### Hybrid On-Chain / Off-Chain Progress

On-chain state (Token-2022 XP, enrollment bitmap, Metaplex Core credentials) is the source of truth. Supabase mirrors this data for fast queries, streak tracking, and leaderboard display. The lesson completion API route writes on-chain first, then mirrors to Supabase. Mirror failures are non-fatal.

### Backend Signer Pattern

The backend server holds a rotatable keypair (`BACKEND_SIGNER_SECRET`, stored in Config PDA). Lesson completion, course finalization, and credential issuance are all backend-signed to prevent gaming. Enrollment and enrollment closure are learner-signed (personal commitment, no anti-cheat concern).

### Sanity Content Gate

Courses become visible to students only when `onChainStatus.status == "synced"` in Sanity. This ensures courses are deployed on-chain before students can access them. The admin dashboard shows all courses regardless of status.

### Browser-Side Code Execution

Challenge code runs via `new Function()` in the browser. Blocked patterns: `eval`, `Function`, `document`, `window`, `fetch`, `XMLHttpRequest`, `import()`. Mock console and mock Solana SDK provide isolation without server-side execution infrastructure.

### Dark Mode First

Solana brand colors (#9945FF, #14F195) contrast best against dark backgrounds. Developer tools are overwhelmingly used in dark mode.

---

_Last updated: 2026-02-19_
