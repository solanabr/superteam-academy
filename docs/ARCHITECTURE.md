> Last synced: 2026-07-12

# Superteam Academy -- Architecture Reference

System architecture, component structure, data flow, and service interfaces for Superteam Academy -- a Solana-native educational LMS.

**There is no CMS.** Course content is authored in a git repo, compiled ahead of
time, and **committed** to this repo as a typed bundle. Nothing fetches content at
runtime. See [§3 Data Flow](#3-data-flow).

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
│  ┌────────────────────────────────────────────────────────────────┐  │
│  │  COMMITTED CONTENT BUNDLE  (src/content/generated/*.json)      │  │
│  │  compiled from solanabr/courses-academy @ content.lock sha     │  │
│  │  statically imported — no runtime content fetch, no CMS        │  │
│  └────────────────────────────────────────────────────────────────┘  │
│                                                                      │
│  Holds: BACKEND_SIGNER_SECRET · PROGRAM_AUTHORITY_SECRET             │
│         SUPABASE_SERVICE_ROLE_KEY · GITHUB_TOKEN (READ-ONLY)         │
└──────────────┬──────────────┬──────────────┬─────────────────────────┘
               │              │              │
               ▼              ▼              ▼
        ┌────────────┐  ┌───────────┐  ┌──────────────────────────────┐
        │  Supabase  │  │  Solana   │  │  Build Server (Rust/Axum)    │
        │  (DB+Auth) │  │ (Devnet)  │  │  on GCP Cloud Run            │
        │            │  │           │  │  cargo-build-sbf --offline   │
        │ user data  │  │ Token-2022│  └──────────────────────────────┘
        │ +on-chain  │  │ Metaplex  │
        │  status    │  │   Core    │
        └────────────┘  └───────────┘
```

Build-time only (not a runtime dependency):

```
solanabr/courses-academy ──► compile-content.ts ──► committed bundle
      (git = source of truth)      (pinned by apps/web/content.lock)
```

### Monorepo Layout

| Directory                      | Purpose                                                                                 |
| ------------------------------ | --------------------------------------------------------------------------------------- |
| `apps/web/`                    | Next.js 14 application (pages, API routes, components, services)                        |
| `apps/build-server/`           | Rust/Axum Solana program compiler on GCP Cloud Run                                      |
| `onchain-academy/`             | Anchor workspace (program source, IDL, tests)                                           |
| `packages/types/`              | Shared TypeScript interfaces (`Course`, `Lesson`, `LessonBlock`, …)                     |
| `packages/content-schema/`     | Zod schemas for the content standard (course, lesson, blocks, achievement, quest, path) |
| `packages/content-lint/`       | The content linter — runs in `courses-academy` CI, gating what is publishable           |
| `packages/challenge-executor/` | Challenge runner (QuickJS sandbox) shared by the app and the linter's executor gate     |
| `packages/deploy/`             | Browser-based Solana program deployment library                                         |
| `packages/config/`             | Shared ESLint, TypeScript, Tailwind configs                                             |
| `supabase/`                    | Postgres schema + migrations (21 tables, indexes, RLS, functions, views)                |

Content itself lives **outside** this repo, in
[`solanabr/courses-academy`](https://github.com/solanabr/courses-academy).

### Deployment Model

| Service          | Host                       | Notes                                                                 |
| ---------------- | -------------------------- | --------------------------------------------------------------------- |
| Web app          | Vercel                     | Edge middleware, automatic deploys from `main`                        |
| Database + Auth  | Supabase (hosted Postgres) | RLS, SECURITY DEFINER functions. Prod project: `pywhtmidcrptomrabbrw` |
| Content          | **Committed to this repo** | Compiled bundle; no hosted service, no runtime credential             |
| On-chain program | Solana devnet              | Anchor 0.31+, Token-2022, Metaplex Core                               |
| Build server     | GCP Cloud Run              | Docker, no IAM gateway, `X-API-Key` auth                              |

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
       │    ├── dashboard/        ← Auth-gated: enrolled courses, XP, streaks, daily quests
       │    ├── courses/          ← Public: course catalog
       │    │    └── [slug]/      ← Public: course detail
       │    │         └── lessons/[id]/  ← Public: lesson view + code editor
       │    ├── community/        ← Public: forum home (categories)
       │    │    └── [category-slug]/   ← Category threads
       │    │         └── [thread-slug]/ ← Thread detail + answers
       │    ├── profile/          ← Auth-gated (own profile)
       │    │    └── [username]/  ← Public: other users' profiles
       │    ├── leaderboard/      ← Public: XP rankings
       │    ├── certificates/     ← Public: certificate list
       │    │    └── [id]/        ← Public: individual certificate
       │    └── settings/         ← Auth-gated: account settings
       │
       └── admin/                 ← Admin console (signed admin_session cookie required)
            ├── courses/          ← Default screen. Step 1 publish (content pin: bundle
            │                       SHA vs courses-academy HEAD) + step 2 deploy (course
            │                       & achievement on-chain tables), with a state legend
            ├── publish/          ← Redirect → courses/ (retired screen, kept for bookmarks)
            ├── deploy/           ← Redirect → courses/ (retired screen, kept for bookmarks)
            ├── moderation/       ← Pending community-flag queue
            └── status/           ← Program health + data resync
```

`/admin` itself renders the login form when unauthenticated and redirects to
`/admin/courses` when authenticated. A persistent nav rail (rendered by the
admin `layout.tsx`) links the three screens.

### Component Groups

| Directory       | Components                                                                                                                                                                                                       | Purpose                                                    |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `ui/`           | Button, Card, Dialog, Avatar, Progress, Tabs, DropdownMenu                                                                                                                                                       | shadcn/ui base primitives (Radix UI)                       |
| `course/`       | CourseCard, ProgressBar, CurriculumAccordion, DifficultyBadge                                                                                                                                                    | Course display and progress tracking                       |
| `community/`    | ThreadList, ThreadCard, AnswerCard, AnswerEditor, VoteButton, FlagButton, AcceptAnswerButton, CommunitySearch, CommunityStats, CreateThreadModal, CategoryCard, ThreadFilters, ThreadStatusBadge, MarkdownEditor | Forum threads, answers, voting, moderation (14 components) |
| `editor/`       | ChallengeInterface, CodeEditor, ChallengeRunner, OutputPanel                                                                                                                                                     | Monaco editor with in-browser test runner                  |
| `gamification/` | XpPopup, LevelUpOverlay, LevelBadge, StreakDisplay, SkillRadar, AchievementCard, AchievementGrid, AchievementPopup, CertificatePopup, GamificationOverlays                                                       | XP animations, achievement celebrations, streak display    |
| `certificates/` | CertificateCard, CertificateGrid, CourseCompletionMint                                                                                                                                                           | NFT credential display and minting UI                      |
| `deploy/`       | DeployPanel, WalletFundingCard, GenericProgramExplorer                                                                                                                                                           | Student program deployment panel                           |
| `admin/`        | CourseSyncTable, AchievementSyncTable, DataResyncPanel, FlagsPanel, StatusBadge, SyncDiffView                                                                                                                    | Admin console: content-to-chain deploy, resync, moderation |
| `auth/`         | AuthModal, WalletAuthHandler, UserMenu                                                                                                                                                                           | Wallet + OAuth authentication                              |
| `layout/`       | Header, Footer, Sidebar, LanguageSwitcher, ThemeProvider, ThemeToggle                                                                                                                                            | Page chrome, navigation, theming                           |
| `landing/`      | TerminalTypewriter                                                                                                                                                                                               | Landing page animation                                     |
| `profile/`      | WalletNameGenerator                                                                                                                                                                                              | Fun name generation for wallet users                       |
| `analytics/`    | AnalyticsProvider                                                                                                                                                                                                | GA4 + PostHog + Sentry wrapper                             |

### Client vs Server Components

| Type                    | Used For                             | Examples                                                 |
| ----------------------- | ------------------------------------ | -------------------------------------------------------- |
| Server                  | Data fetching, SEO, static rendering | Course detail page, lesson page, leaderboard             |
| Client (`"use client"`) | Interactivity, browser APIs, wallet  | AuthModal, CodeEditor, GamificationOverlays, ThemeToggle |

---

## 3. Data Flow

### Four Data Sources

| Source                       | Data                                                                                            | Access Pattern                                                            |
| ---------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| **Committed content bundle** | Course content (courses, lessons, blocks, achievements, quests, paths)                          | Statically imported at build time by `lib/content/store.ts` (server-only) |
| **Supabase Postgres**        | User data (profiles, progress, XP, achievements, certificates) **+ on-chain deployment status** | Client reads via anon key + RLS; writes via API routes + service_role     |
| **Solana Blockchain**        | Token-2022 XP balances, Enrollment PDAs, Credential NFTs                                        | On-chain writes via backend signer; reads via RPC                         |
| **Build Server**             | Compiled Solana programs (.so binaries)                                                         | POST source to `/build`, GET binary from `/deploy/{uuid}`                 |

### Content Flow (git to pages)

Content is **compiled ahead of time and committed**. Nothing fetches it at
request time.

```
solanabr/courses-academy         ← git repo: course.yaml, lesson.yaml,
        │                          achievements/, quests/, paths/, instructors/
        │  pinned to ONE commit by apps/web/content.lock
        ▼
apps/web/scripts/compile-content.ts
        │  fetch tarball @ locked SHA → Zod-validate every doc (fail-closed)
        │  → project → emit deterministic JSON (sorted keys, no timestamps)
        ▼
apps/web/src/content/generated/*.json   ← COMMITTED, prettier-ignored
apps/web/public/content-assets/*        ← COMMITTED
        │
        ▼ static import (server-only)
lib/content/store.ts  ──►  lib/content/queries.ts  ──►  Server Components
```

Properties this buys:

- **Determinism** — output is a pure function of the locked SHA. CI recompiles and
  fails on any byte of drift, catching a stale bundle after a lock bump _and_ a
  hand-edit of the generated files.
- **No runtime dependency** — a content-repo outage cannot affect the site.
- **No content-write credential exists.** The app cannot mutate content under any
  credential. Publishing is a PR that bumps `content.lock` + commits the
  regenerated bundle. `GITHUB_TOKEN` is **read-only** and only polls HEAD/CI state
  for the admin Publish screen.

`lib/content/store.ts` is `server-only` **by necessity**: the bundle contains quiz
answer keys, code solutions, and hidden tests. The `server-only` marker makes a
client value-import a build error. Client components read the safe subset through
the public `/api/content/*` routes (via `lib/content/client-queries.ts`, whose fn
signatures are identical to the server ones).

### The visibility gate

A course is visible to learners **iff its Supabase deployment row says so**:

```
visible  ⇔  onchain_deployments.status == "synced"  AND  coalesce(is_active, true)
```

This is the post-SP2 replacement for the old CMS `onChainStatus` field. It lives in
**exactly one function** — `isSynced()` in `lib/content/deployments.ts` — and is
applied to every public read. Content with **no** deployment row is **hidden**
(fail-closed: hidden > leaked). `is_active` is tri-state; `NULL` coalesces to
`true`, so deactivation is opt-in.

Two read paths into `onchain_deployments`:

| Function                 | Client                                                                                                                    | Used by                                                             |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `getActiveDeployments()` | Cookieless **anon** client over the `public_onchain_deployments` view, wrapped in `unstable_cache` (tag `courses`, 3600s) | Public catalog + lesson reads. Cookieless so pages stay static/ISR. |
| `getDeploymentById(id)`  | **service_role** client, uncached, full row                                                                               | Reward paths + admin reads that need `track_collection_address`     |

Key queries in `lib/content/queries.ts` (server-only):

| Function                                  | Returns                                                                  |
| ----------------------------------------- | ------------------------------------------------------------------------ |
| `getAllCourses()`                         | All synced+active courses with lesson summaries                          |
| `getCourseBySlug(slug)`                   | Single course with full lesson content                                   |
| `getLessonBySlug(courseSlug, lessonSlug)` | Single lesson with its ordered `blocks[]` (code, tests, hints, solution) |
| `getCourseById(id)`                       | Course by content `_id` (used in API routes)                             |
| `getAllCourseLessonCounts()`              | `{ _id, totalLessons }[]` for course-completion detection                |
| `getAllAchievements()`                    | All achievement definitions (for unlock checking)                        |
| `getDeployedAchievements()`               | Achievements with on-chain PDAs only                                     |
| `getAllCoursesAdmin()`                    | All courses joined with their full Supabase deployment row               |
| `getAllAchievementsAdmin()`               | All achievements joined with their full Supabase deployment row          |

Deployment writes (`lib/content/deployment-writes.ts`, service_role only) — these
kept their original signatures across the CMS removal, so their four call sites
(`courses/sync`, `achievements/sync`, `courses/{deactivate,reactivate}`) were
untouched:

| Function                                                               | Purpose                                                    |
| ---------------------------------------------------------------------- | ---------------------------------------------------------- |
| `writeCourseOnChainStatus(id, status, coursePda, txSignature)`         | Upsert the course row as `synced` after an on-chain deploy |
| `writeCourseTrackCollection(id, trackCollectionAddress)`               | Store the credential collection address                    |
| `writeAchievementOnChainStatus(id, achievementPda, collectionAddress)` | Upsert the achievement row as `synced`                     |

Each upsert is keyed on the `content_id` PK and sets **only the columns that writer
owns** (`ON CONFLICT DO UPDATE` merge semantics), preserving the rest of the row.

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
5. Supabase: enrollment row mirrored by the client via the enrollments table
```

### Admin Deployment Flow

```
/admin/courses → POST /api/admin/courses/sync
  │
  ├── requireAdminAuth() — same-origin check + HMAC-signed `admin_session` cookie
  ├── deployCoursePda() via admin-signer.ts → createCourse instruction
  ├── deployCourseTrackCollection() → Metaplex Core collection (UMI)
  ├── writeCourseOnChainStatus()   → Supabase `onchain_deployments` row = "synced"
  ├── writeCourseTrackCollection() → Supabase stores the collection address
  └── revalidateTag("courses")     → purge the cached deployment map so the
                                      catalog picks the new course up

Similarly for achievements:
  POST /api/admin/achievements/sync
  ├── deployAchievementType() → createAchievementType + collection
  └── writeAchievementOnChainStatus() → Supabase row = "synced"
```

**Admin auth is a signed cookie, not a bearer token.** `requireAdminAuth()`
(`lib/admin/auth.ts`) requires a same-origin request **and** a valid HMAC-signed
`admin_session` cookie, minted by `POST /api/admin/auth` when the operator enters
`ADMIN_SECRET` at the login form. No admin route accepts
`Authorization: Bearer <ADMIN_SECRET>`.

---

## 4. Service Interfaces

### `lib/content/*` -- The Content Read Layer

All server-only. Composes three seams: the committed bundle (content), Supabase
(on-chain status), and projectors (shape).

| Module                 | Purpose                                                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `store.ts`             | Statically imports the generated JSON into id/slug-keyed maps. **The `server-only` marker here is load-bearing** — the bundle holds quiz answers, solutions, and hidden tests. |
| `queries.ts`           | The query API (`getAllCourses`, `getCourseBySlug`, `getLessonBySlug`, …). Owns `COURSES_CACHE_TAG`.                                                                            |
| `deployments.ts`       | The on-chain status read seam. `getActiveDeployments()` (cached anon view read), `getDeploymentById()` (service_role full row), and `isSynced()` — the entire visibility gate. |
| `deployment-writes.ts` | The four service_role upserts into `onchain_deployments`.                                                                                                                      |
| `project.ts`           | Projectors that map raw bundle docs to the app's `Course` / `Lesson` / … types.                                                                                                |
| `meta.ts`              | `contentMeta` + `SYNCED_SHA` — the pinned SHA, a **build-time constant** (the bundle _is_ the synced content).                                                                 |
| `client-queries.ts`    | Browser-side fetch wrappers over `/api/content/*`. Same fn names/signatures as the server ones, so swapping a component over is an import-line change.                         |
| `compile/*`            | The compiler internals (tarball extract, validate, project, assets, prune), shared with `scripts/compile-content.ts`.                                                          |

### `lib/github/*` -- Read-Only GitHub Seam

| Module              | Purpose                                                                                                                                           |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `github.ts`         | The GitHub client: `fetchHeadSha`, `fetchChecksState`, `fetchAheadBy`. **Read scope only.**                                                       |
| `publish-pin.ts`    | Pure drift/verdict + PR-link helpers for `/admin/courses`. Builds the one-line `content.lock` diff and a prefilled PR URL. **Performs no write.** |
| `drift.ts`          | `computeContentDrift` / `computeChainDrift`.                                                                                                      |
| `content-commit.ts` | `deriveActiveMask` — the `active_lessons` bitmask derived from a course's `slots.lock.json`.                                                      |

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

### Program Instructions (18 total)

The Solana program (`onchain-academy`) is built with Anchor 0.31+. Instruction names in Rust are snake_case; Anchor's `Program` constructor converts them to camelCase for TypeScript.

Source of truth: `onchain-academy/programs/onchain-academy/src/instructions/`.

| Instruction (Rust)            | TypeScript Builder (`academy-program.ts`)           | Signer            |
| ----------------------------- | --------------------------------------------------- | ----------------- |
| `initialize`                  | -- (one-time setup via `scripts/init-program.ts`)   | Authority         |
| `update_config`               | -- (admin CLI)                                      | Authority         |
| `create_course`               | `deployCoursePda()` in `admin-signer.ts`            | Authority         |
| `update_course`               | `updateCoursePda()` in `admin-signer.ts`            | Authority         |
| `close_course`                | -- (admin CLI)                                      | Authority         |
| `enroll`                      | Client-side via `instructions.ts`                   | Learner wallet    |
| `complete_lesson`             | `completeLesson()` in `academy-program.ts`          | Backend signer    |
| `finalize_course`             | `finalizeCourse()` in `academy-program.ts`          | Backend signer    |
| `close_enrollment`            | Client-side via `instructions.ts`                   | Learner wallet    |
| `issue_credential`            | `issueCredential()` in `academy-program.ts`         | Backend signer    |
| `upgrade_credential`          | -- (not yet used in API routes)                     | Backend signer    |
| `register_minter`             | -- (admin CLI)                                      | Authority         |
| `update_minter`               | -- (admin CLI)                                      | Authority         |
| `revoke_minter`               | -- (admin CLI)                                      | Authority         |
| `reward_xp`                   | `rewardXp()` in `academy-program.ts` (daily quests) | Registered minter |
| `create_achievement_type`     | `deployAchievementType()` in `admin-signer.ts`      | Authority         |
| `award_achievement`           | `awardAchievement()` in `academy-program.ts`        | Registered minter |
| `deactivate_achievement_type` | -- (admin CLI)                                      | Authority         |

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

#### Trust assumption: the backend signer is trusted, not verified

The backend signer is a **trusted off-chain authority**, and its co-signature is an _authorization_ boundary, not a _proof of merit_. Every XP-minting and credential instruction (`complete_lesson`, `finalize_course`, `reward_xp`, `award_achievement`, `issue_credential`, `upgrade_credential`) requires it as an additional signer, enforced on-chain by `constraint = backend_signer.key() == config.backend_signer`.

What the program **does** verify is structural only: the lesson bit was not already set, the course is finalized at most once, supply and minter caps hold, the kill-switch (`Config.paused`) is off across all six minting/credential paths, and every account matches its PDA. The program **does not** verify that the learner actually completed the lesson or passed the challenge — that eligibility check is performed off-chain by the backend before it co-signs, and the program trusts it to have done so. Consequently a compromised backend-signer key can mint XP and credentials at will (bounded by minter caps and the kill-switch); the mitigation is rotation via `update_config`. The same boundary is documented in the `//!` module header of `programs/onchain-academy/src/lib.rs`.

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

### RLS Model (19 tables, all with RLS enabled)

#### Core Tables

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

#### Community Tables

| Table              | SELECT       | INSERT        | UPDATE | DELETE |
| ------------------ | ------------ | ------------- | ------ | ------ |
| `forum_categories` | All (public) | --            | --     | --     |
| `threads`          | All (public) | Authenticated | Own    | --     |
| `answers`          | All (public) | Authenticated | Own    | --     |
| `votes`            | All (public) | Authenticated | --     | --     |
| `flags`            | --           | Authenticated | --     | --     |

#### Queue / Quest Tables

| Table                     | SELECT | INSERT | UPDATE | DELETE |
| ------------------------- | ------ | ------ | ------ | ------ |
| `pending_onchain_actions` | Own    | Own    | Own    | --     |
| `user_daily_quests`       | Own    | --     | --     | --     |

`user_xp`, `xp_transactions`, and `user_achievements` have no INSERT/UPDATE policies for authenticated users. All writes go through SECURITY DEFINER functions (`award_xp`, `unlock_achievement`) that are `REVOKE`d from `authenticated`, `anon`, and `public` and `GRANT`ed only to `service_role`.

`certificates` and `nft_metadata` have no INSERT policies for authenticated users. All writes go through service_role API routes to prevent users from fabricating completion records.

Community data (categories, threads, answers, votes) has public SELECT policies. Thread/answer writes are authenticated. Vote writes are via SECURITY DEFINER functions (`cast_vote`, `create_thread_rpc`, `create_answer_rpc`).

### Admin Auth

Admin auth is separate from Supabase auth. `/admin` renders a login form; entering
`ADMIN_SECRET` mints an **HMAC-signed `admin_session` cookie** (`POST /api/admin/auth`).
`ADMIN_SECRET` is both the login secret and the HMAC signing key — rotating it
invalidates every session.

- Middleware redirects `/admin/*` sub-routes back to `/admin` when the cookie is
  absent or expired.
- Every `/api/admin/*` route calls `requireAdminAuth()`, which enforces a
  **same-origin check plus the signed cookie**. There is no bearer-token path.
- `ADMIN_SECRET` is never read in a page component, so it cannot be serialized into
  a client payload.

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

**Admin routes**: Checked against the signed `admin_session` cookie, separate from Supabase auth.

The middleware matcher excludes API routes, `_next`, `_vercel`, and static assets
(`matcher: ["/((?!api|_next|_vercel|.*\\..*).*)"]`).

---

## 7. Community Forum

Full-stack Q&A forum with XP integration, moderation, and course-scoped discussions.

### Pages

| Route                                      | Component                  | Purpose                                             |
| ------------------------------------------ | -------------------------- | --------------------------------------------------- |
| `/community`                               | `community/page.tsx`       | Forum home — category grid + recent threads         |
| `/community/[category-slug]`               | `[category-slug]/page.tsx` | Category page — filtered thread list + create modal |
| `/community/[category-slug]/[thread-slug]` | `[thread-slug]/page.tsx`   | Thread detail — body, answers, voting, accept       |

Course and lesson pages embed a `<ThreadList>` tab filtered by `courseId` / `lessonId` for contextual discussions.

### Data Flow

```
User action → API route → Supabase (RLS/service_role)
                       ↘ award_xp() SECURITY DEFINER → xp_transactions + user_xp
                       ↘ on-chain reward_xp (for thread/answer/accept XP)
```

### API Routes (9)

| Route                                | Method | Auth     | Rate Limit | Purpose                                                                                            |
| ------------------------------------ | ------ | -------- | ---------- | -------------------------------------------------------------------------------------------------- |
| `/api/community/threads`             | GET    | None     | —          | List threads with cursor pagination, category/course/lesson filters                                |
| `/api/community/threads`             | POST   | Required | 10/hr      | Create thread (5 XP, awards via `award_xp()`)                                                      |
| `/api/community/threads/[id]`        | GET    | None     | —          | Thread detail with answers, increments view count                                                  |
| `/api/community/threads/[id]/delete` | POST   | Required | —          | Soft-delete own thread (author only)                                                               |
| `/api/community/answers`             | POST   | Required | 30/hr      | Post answer to thread (10 XP)                                                                      |
| `/api/community/answers/[id]/accept` | POST   | Required | —          | Accept answer (thread author only, 25 XP to answerer). Re-accept revokes previous XP.              |
| `/api/community/answers/[id]/delete` | POST   | Required | —          | Soft-delete own answer (author only)                                                               |
| `/api/community/votes`               | POST   | Required | 60/hr      | Three-state vote (+1/0/-1). Self-vote prevented by DB trigger.                                     |
| `/api/community/flags`               | POST   | Required | 20/hr      | Flag content for moderation. Dedup index prevents duplicate flags. Self-flag prevented by trigger. |
| `/api/community/search`              | GET    | None     | —          | Full-text search (tsvector on title + body)                                                        |

Rate limiting uses a per-user in-memory token bucket (`lib/rate-limit.ts`). Process-local; not globally enforced across serverless instances.

### Database Tables (5 + 1 view)

| Table              | Key Columns                                                                                                                                                                            | Notes                                                                                                                                                                                         |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `forum_categories` | `name`, `slug`, `description`, `sort_order`                                                                                                                                            | Seeded manually. Public SELECT, no user writes.                                                                                                                                               |
| `threads`          | `title`, `body`, `type` (question/discussion), `category_id`, `course_id`, `lesson_id`, `author_id`, `vote_score`, `view_count`, `answer_count`, `is_solved`, `is_pinned`, `is_locked` | `search_vector` tsvector for full-text search. `last_activity_at` updated on new answers only.                                                                                                |
| `answers`          | `body`, `thread_id`, `author_id`, `vote_score`, `is_accepted`                                                                                                                          | One accepted answer per thread (enforced by accept route logic).                                                                                                                              |
| `votes`            | `user_id`, `thread_id`/`answer_id`, `value` (+1/-1)                                                                                                                                    | Unique constraint `(user_id, thread_id)` / `(user_id, answer_id)`. Self-vote prevented by `trg_prevent_self_vote` trigger. `update_vote_score()` trigger maintains denormalized `vote_score`. |
| `flags`            | `reporter_id`, `thread_id`/`answer_id`, `reason` (enum), `status`                                                                                                                      | Unique partial indexes prevent duplicate flags per user per target. `trg_prevent_self_flag` trigger prevents self-flagging.                                                                   |
| `community_stats`  | (view)                                                                                                                                                                                 | Aggregated thread/answer/accepted counts per user for profile display.                                                                                                                        |

### Components (14)

| Component            | Purpose                                                                                |
| -------------------- | -------------------------------------------------------------------------------------- |
| `ThreadList`         | Paginated thread list with filters (category, course, lesson). Uses `useThreads` hook. |
| `ThreadCard`         | Thread preview card with vote score, answer count, status badge.                       |
| `VoteButton`         | Three-state vote UI (up/neutral/down).                                                 |
| `AnswerCard`         | Answer display with vote, accept button (for thread author).                           |
| `AnswerEditor`       | Markdown editor for posting answers.                                                   |
| `CreateThreadModal`  | Modal for creating new threads (title, body, type, category).                          |
| `CommunitySearch`    | Full-text search bar with debounced API calls.                                         |
| `CommunityStats`     | User forum stats (threads, answers, accepted).                                         |
| `FlagButton`         | Content flagging with reason selector.                                                 |
| `ThreadStatusBadge`  | Question/discussion + solved/unsolved badge.                                           |
| `ThreadFilters`      | Category, sort, and type filter controls.                                              |
| `CategoryCard`       | Forum category card with thread count.                                                 |
| `MarkdownEditor`     | Markdown textarea with preview toggle.                                                 |
| `AcceptAnswerButton` | Accept/unaccept answer (thread author only).                                           |

### Hooks

| Hook                | Purpose                                                          |
| ------------------- | ---------------------------------------------------------------- |
| `useThreads`        | Cursor-based thread pagination with SWR-like caching.            |
| `useCommunityStats` | Fetch community stats for a user.                                |
| `useVote`           | Optimistic three-state vote management with rollback on failure. |

### XP Rewards

| Action          | XP  | Idempotency Key                |
| --------------- | --- | ------------------------------ |
| Create thread   | 5   | `thread:{threadId}`            |
| Post answer     | 10  | `answer:{answerId}`            |
| Answer accepted | 25  | `accept:{threadId}:{answerId}` |

Daily community XP cap: 50 XP (enforced by `award_xp()` SECURITY DEFINER function).

Re-accepting a different answer revokes the previous answerer's 25 XP via `revoke_community_xp()` before awarding the new one.

---

## 8. Gamification System

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

**Unlock logic is content, not TypeScript.** Each achievement doc in
`courses-academy` carries a declarative `award` rule (a Zod discriminated union,
`packages/content-schema/src/achievement.ts`). The app holds one predicate per
award _kind_ — not per achievement — in `PREDICATES`
(`lib/gamification/achievements.ts`):

```ts
export const PREDICATES = { ... } satisfies Record<AwardKind, Predicate>;
```

The `satisfies` makes a missing kind a **compile error**, and no course or path id
is hardcoded anywhere — every target is named by content.

The eight award kinds:

| `award.kind`                  | Unlocks when                                              |
| ----------------------------- | --------------------------------------------------------- |
| `lessons-completed`           | `completedLessons >= gte`                                 |
| `lessons-completed-in-course` | completed lessons in `course` >= `gte`                    |
| `course-completed`            | `course` is fully completed                               |
| `path-completed`              | every course in learning path `path` is completed         |
| `streak`                      | `currentStreak >= days`                                   |
| `user-number`                 | `userNumber <= lte` (early-adopter style)                 |
| `community-stat`              | a community stat (threads/answers/accepted) >= `gte`      |
| `manual`                      | never auto-fires — admin-granted only (e.g. `bug-hunter`) |

`checkNewAchievements(deployed, state, alreadyUnlocked)` evaluates the rule on each
not-yet-unlocked achievement against one fully-populated `UserState` (lessons,
courses, paths, streak, user number, community stats) built in a single pass by
`buildUserState()`.

The bundle currently carries **10** achievements. Their conditions are defined in
the content repo, not here — do not enumerate them in this doc.

> `perfect-score` was **dropped**: block results are transient by design, so there
> is no durable "passed on first try" signal to key it on.

The check runs after every lesson completion. New achievements are:

1. Recorded in Supabase via the `unlock_achievement()` SECURITY DEFINER function
2. Minted on-chain as Metaplex Core NFTs via `awardAchievement()` (non-fatal)

> **ID convention**: the achievement's full content `_id` (e.g.
> `achievement-first-steps`) is used **verbatim** as the on-chain PDA seed. Never
> strip the `achievement-` prefix — doing so derives the wrong PDA and the award
> fails silently.

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

## 9. API Routes

All routes are in `apps/web/src/app/api/`. **44 routes** as of the last sync.

> **How to re-derive this list** (do this rather than trusting the table):
>
> ```bash
> find apps/web/src/app/api -name route.ts \
>   | sed 's|apps/web/src/app/api/||; s|/route.ts||' | sort
> ```
>
> A route exists iff it has a `route.ts`. Anything in this table with no
> corresponding file is a doc bug — `/api/deploy/[uuid]` was exactly that.

"Admin" auth below means the same-origin + signed-`admin_session`-cookie check
(`requireAdminAuth`), **not** a bearer token.

### Content (public, serve the bundle to client components)

These exist because `lib/content/*` is `server-only` (the bundle holds answer keys
and solutions). They expose only summary-safe shapes — there is deliberately **no**
client-side route for a full lesson read.

| Route                            | Method | Auth | Purpose                                          |
| -------------------------------- | ------ | ---- | ------------------------------------------------ |
| `/api/content/courses`           | GET    | None | Course summaries by id                           |
| `/api/content/lessons-summary`   | GET    | None | Lesson summaries by id                           |
| `/api/content/recommended`       | GET    | None | Recommended courses (excluding given ids)        |
| `/api/content/tags`              | GET    | None | Course tags (cached, revalidated hourly)         |
| `/api/content/achievements`      | GET    | None | Achievement catalog (cached, revalidated hourly) |
| `/api/content/instructor-wallet` | GET    | None | Is this wallet an instructor?                    |

### Auth / core / community

| Route                             | Method   | Auth                  | Purpose                                                                                                                                                                             |
| --------------------------------- | -------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/auth/nonce`                 | GET      | None                  | Generate SIWS nonce (stored in `siws_nonces` table)                                                                                                                                 |
| `/api/auth/wallet`                | POST     | None                  | SIWS authentication (nonce + Ed25519 verification)                                                                                                                                  |
| `/api/auth/callback`              | GET      | None                  | Google/GitHub OAuth callback (code exchange)                                                                                                                                        |
| `/api/auth/link-wallet`           | POST     | Required              | Link wallet to existing account                                                                                                                                                     |
| `/api/auth/unlink`                | POST     | Required              | Unlink auth method (wallet/Google/GitHub)                                                                                                                                           |
| `/api/account/delete`             | POST     | Required              | Account deletion                                                                                                                                                                    |
| `/api/lessons/complete`           | POST     | Required              | Mark lesson complete, award XP, auto-finalize, auto-credential, check achievements                                                                                                  |
| `/api/lessons/validate-challenge` | POST     | Required              | Server-side challenge validation (UX pass/fail)                                                                                                                                     |
| `/api/leaderboard`                | GET      | None                  | XP rankings (alltime/weekly/monthly)                                                                                                                                                |
| `/api/certificates/metadata`      | GET      | None                  | Serve NFT metadata JSON by UUID                                                                                                                                                     |
| `/api/certificates/mint`          | POST     | Required              | Manual credential mint with retry queue                                                                                                                                             |
| `/api/build-program`              | POST     | Required              | Proxy Anchor build to build server                                                                                                                                                  |
| `/api/deploy/save`                | POST     | Required              | Save deployed program record. **The only route under `/api/deploy`** — the compiled `.so` comes back inline (base64) from `/api/build-program`, not from a separate download route. |
| `/api/rust/execute`               | POST     | Required              | Proxy basic Rust execution to Rust Playground                                                                                                                                       |
| `/api/quests/daily`               | GET/POST | Required              | Get daily quest state / award quest XP (on-chain minting via `reward_xp`)                                                                                                           |
| `/api/ai/partner`                 | POST     | Required              | AI lesson assistant (Gemini); rate-limited + input-capped                                                                                                                           |
| `/api/ai/partner/verify`          | POST     | Required              | Verify the sealed comprehension-check token                                                                                                                                         |
| `/api/teacher/courses/[id]/stats` | GET      | Required              | Read-only per-course stats for the instructor (`/teach`) viewer                                                                                                                     |
| `/api/community/*`                | Varies   | Varies                | 9 routes: threads (+delete), answers (+accept, +delete), votes, flags, search — see §7                                                                                              |
| `/api/webhooks/helius`            | POST     | HELIUS_WEBHOOK_SECRET | Process on-chain events (XP, achievements)                                                                                                                                          |

### Admin

| Route                           | Method   | Auth  | Purpose                                                                     |
| ------------------------------- | -------- | ----- | --------------------------------------------------------------------------- |
| `/api/admin/auth`               | POST     | None  | Exchange `ADMIN_SECRET` for the signed `admin_session` cookie               |
| `/api/admin/status`             | GET      | Admin | Program liveness, authority match, per-item deploy state (drives 2 screens) |
| `/api/admin/publish/pin`        | GET      | Admin | Pinned bundle SHA vs `courses-academy` HEAD + CI checks + drift verdict     |
| `/api/admin/content/drift`      | GET      | Admin | Bundle SHA vs HEAD, plus per-course chain drift (`content_tx_id == HEAD`)   |
| `/api/admin/courses/sync`       | POST     | Admin | Deploy course PDA + track collection on-chain, record it in Supabase        |
| `/api/admin/courses/deactivate` | POST     | Admin | Set course `is_active = false` (hides it from learners)                     |
| `/api/admin/courses/reactivate` | POST     | Admin | Set course `is_active = true`                                               |
| `/api/admin/achievements/sync`  | POST     | Admin | Deploy achievement type + collection on-chain                               |
| `/api/admin/flags`              | GET/POST | Admin | Pending moderation queue / resolve+dismiss a flag                           |
| `/api/admin/resync`             | POST     | Admin | Re-read on-chain state and backfill the Supabase mirror                     |

No admin route holds a content- or repo-write credential. `GITHUB_TOKEN` is
read-only; the publish flow's output is a **prefilled PR link**, not a write.

---

## 10. Database Schema

### Tables (21)

#### Core Tables (11)

| Table                 | Purpose                                  | Key Columns                                                        |
| --------------------- | ---------------------------------------- | ------------------------------------------------------------------ |
| `profiles`            | User identity                            | `id` (FK auth.users), `wallet_address`, `username`, `is_public`    |
| `enrollments`         | Course enrollment records                | `user_id`, `course_id`, `completed_at`, `tx_signature`             |
| `user_progress`       | Per-lesson completion                    | `user_id`, `lesson_id`, `completed`, `lesson_index`                |
| `user_xp`             | XP totals and streaks                    | `user_id`, `total_xp`, `level`, `current_streak`, `longest_streak` |
| `xp_transactions`     | XP award history                         | `user_id`, `amount`, `reason`, `tx_signature`                      |
| `user_achievements`   | Achievement unlock records               | `user_id`, `achievement_id`, `asset_address`                       |
| `certificates`        | Credential NFT records                   | `user_id`, `course_id`, `mint_address`, `credential_type`          |
| `nft_metadata`        | Full Metaplex metadata JSON              | `id`, `data` (JSONB)                                               |
| `siws_nonces`         | Nonce replay protection                  | `nonce`, `status`, `ip_address`, TTL-based cleanup                 |
| `deployed_programs`   | **Learner** practice program deployments | `user_id`, `program_id`, `network`                                 |
| `onchain_deployments` | **Platform** content → chain state       | `content_id` (PK), `kind`, `status`, `course_pda`, `is_active`, …  |

#### `onchain_deployments` — the visibility gate

The post-SP2 home of what used to be a CMS `onChainStatus` field. One row per synced
course (`course-*`) or achievement (`achievement-*`), keyed by the content `_id`
**used verbatim as the on-chain PDA seed**.

It is deliberately **not** `deployed_programs`: that table is per-learner practice
deploys (UUID pk, `user_id` FK, own-row RLS). This one is per-content platform
state (TEXT pk, no user). They never mix.

Security follows the house `public_user_xp` pattern — RLS is row-level, not
column-level, so the minimal public surface is a **view**:

- Base table: **RLS enabled, zero policies** → service_role only (which bypasses
  RLS). All four writer sites use `createAdminClient()`.
- `public_onchain_deployments` view: `SELECT` granted to `anon` + `authenticated`,
  exposing **only** `content_id, kind, status, is_active, achievement_pda`.
- **Invariant**: never add a raw pubkey, tx signature, or
  `track_collection_address` to that view — those are reward-path reads served via
  service_role only.

#### Community Tables (6)

| Table              | Purpose                  | Key Columns                                                                   |
| ------------------ | ------------------------ | ----------------------------------------------------------------------------- |
| `forum_categories` | Global forum sections    | `name`, `slug`, `description`, `sort_order`                                   |
| `threads`          | Discussion threads       | `author_id`, `category_id`, `title`, `body`, `course_id`, `lesson_id`, `tags` |
| `answers`          | Thread replies           | `thread_id`, `author_id`, `body`, `is_accepted`                               |
| `votes`            | Upvotes/downvotes        | `user_id`, `thread_id` or `answer_id`, `value` (+1/-1)                        |
| `flags`            | Content moderation flags | `reporter_id`, `thread_id` or `answer_id`, `reason`, `status`                 |
| `thread_views`     | Per-user view dedup      | `user_id`, `thread_id`                                                        |

#### Queue / Quest / Infra Tables (4)

| Table                     | Purpose                             | Key Columns                                                         |
| ------------------------- | ----------------------------------- | ------------------------------------------------------------------- |
| `pending_onchain_actions` | On-chain retry queue for failed TXs | `user_id`, `action_type`, `payload`, `attempts`, `status`           |
| `user_daily_quests`       | Daily quest completion tracking     | `user_id`, `quest_id`, `current_value`, `completed`, `period_start` |
| `challenge_assists`       | Per-user AI-assist budget           | `user_id`, `lesson_id`, assist counters                             |
| `rate_limits`             | Cross-instance API rate limiter     | key, window, count                                                  |

#### Views (3)

| View                         | Purpose                                                                      |
| ---------------------------- | ---------------------------------------------------------------------------- |
| `community_stats`            | Aggregated thread/answer/accepted counts per user (for profile display)      |
| `public_user_xp`             | Non-sensitive `user_id`/`total_xp`/`level` for public profiles + leaderboard |
| `public_onchain_deployments` | The 5-column public read surface of `onchain_deployments` (see above)        |

### Auto-Provisioning

The `on_auth_user_created` trigger fires `handle_new_user()` on every new auth.users insert:

1. Creates `profiles` row with username `user_{first_8_chars_of_id}`
2. Creates `user_xp` row initialized to 0 XP, level 0

### SECURITY DEFINER Functions

| Function                                         | Access                   | Purpose                                                                                  |
| ------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------- |
| `award_xp(user_id, amount, reason)`              | `service_role` only      | Insert XP transaction, update totals, manage streaks                                     |
| `unlock_achievement(user_id, achievement_id)`    | `service_role` only      | Record achievement (ON CONFLICT DO NOTHING for idempotency)                              |
| `get_leaderboard(timeframe, limit)`              | `authenticated` + `anon` | Leaderboard query (alltime uses `user_xp`, weekly/monthly uses `xp_transactions` window) |
| `get_daily_quest_state(p_user_id, p_quest_defs)` | `service_role` only      | Evaluate daily quest progress in a single pass, return quest states                      |

### Storage

- **avatars** bucket (public): Users can upload/update/delete their own avatar via `auth.uid()` folder path

---

## 11. Build Server Architecture

The build server is a standalone Rust/Axum service deployed on GCP Cloud Run for compiling student-authored Solana programs.

### Endpoints

| Route            | Method | Auth      | Rate Limit | Purpose                                 |
| ---------------- | ------ | --------- | ---------- | --------------------------------------- |
| `/build`         | POST   | X-API-Key | 5 req/min  | Compile Solana program                  |
| `/deploy/{uuid}` | GET    | X-API-Key | 20 req/min | Download compiled .so binary            |
| `/health`        | GET    | None      | None       | Health check with cache stats           |
| `/metrics`       | GET    | X-API-Key | None       | Build counts, durations, cache hit rate |

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

## 12. Key Design Decisions

### Hybrid On-Chain / Off-Chain Progress

On-chain state (Token-2022 XP, enrollment bitmap, Metaplex Core credentials) is the source of truth. Supabase mirrors this data for fast queries, streak tracking, and leaderboard display. The lesson completion API route writes on-chain first, then mirrors to Supabase. Mirror failures are non-fatal.

### Backend Signer Pattern

The backend server holds a rotatable keypair (`BACKEND_SIGNER_SECRET`, stored in Config PDA). Lesson completion, course finalization, and credential issuance are all backend-signed to prevent gaming. Enrollment and enrollment closure are learner-signed (personal commitment, no anti-cheat concern).

### Content as a Committed Artifact (no CMS)

Course content is authored in git (`solanabr/courses-academy`), compiled by
`compile-content.ts` at a SHA pinned in `apps/web/content.lock`, and **committed**
to this repo as typed JSON. The app never fetches content at runtime.

Why: content changes become reviewable diffs with CI gates; the read path has zero
network hops and cannot be broken by a third-party outage; and — because no
server-side content-write token exists anywhere in the app — there is no runtime
path by which content can be mutated. Publishing is a pull request. The cost is
that publishing requires a deploy, which is the intended trade.

### Content Gate (Supabase, not content)

Courses become visible to learners only when their `onchain_deployments` row is
`status == "synced"` **and** `coalesce(is_active, true)`. This keeps courses hidden
until they are actually deployed on-chain, and lets an admin hide one again without
destroying the PDA. Content with no row at all is hidden (fail-closed).

The gate is one function — `isSynced()` in `lib/content/deployments.ts`. The admin
console shows all content regardless of status.

### Browser-Side Code Execution

Challenge code runs via `new Function()` in the browser. Blocked patterns: `eval`, `Function`, `document`, `window`, `fetch`, `XMLHttpRequest`, `import()`. Mock console and mock Solana SDK provide isolation without server-side execution infrastructure.

### Dark Mode First

Solana brand colors (#9945FF, #14F195) contrast best against dark backgrounds. Developer tools are overwhelmingly used in dark mode.

---

_Last updated: 2026-07-12_
