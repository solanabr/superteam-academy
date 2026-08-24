> Last synced: 2026-08-24

# Architecture Reference

System architecture, data flows, and service interfaces for Superteam Academy.

Two invariants shape everything below:

- **On-chain is the source of truth** for XP balances, lesson completion, and
  credentials. Supabase mirrors them for fast queries; mirror writes are
  non-fatal and rebuildable.
- **There is no CMS.** Course content is authored in a git repo, compiled ahead
  of time, and committed to this repo as typed JSON. Nothing fetches content at
  runtime.

Companion docs: [SPEC.md](./SPEC.md) is the authoritative on-chain program
specification; [AUTH-FLOWS.md](./AUTH-FLOWS.md) is the authoritative map of
sign-in. This document does not duplicate either — it says how they connect.

---

## Contents

| §                                                          | What is in it                                                     |
| ---------------------------------------------------------- | ----------------------------------------------------------------- |
| [1. The shape of the system](#1-the-shape-of-the-system)   | Topology diagram, monorepo layout, deployment model               |
| [2. Page structure](#2-page-structure)                     | Route tree, component groups, client vs server                    |
| [3. Data flow](#3-data-flow)                               | Content pipeline, visibility gate, lesson completion, retry queue |
| [4. Service layer](#4-service-layer)                       | `lib/content`, `lib/solana`, `lib/ai`                             |
| [5. On-chain integration](#5-on-chain-integration)         | Instruction signers, PDAs, XP and credentials, trust boundary     |
| [6. Authentication](#6-authentication)                     | The three session rails, middleware, admin authorization          |
| [7. Database](#7-database)                                 | 36 tables, views, the RLS access pattern                          |
| [8. Gamification](#8-gamification-as-shipped)              | XP, levels, streaks, achievements, quests, reward popups          |
| [9. Community forum](#9-community-forum)                   | Threads, votes, flags, community XP                               |
| [10. API routes](#10-api-routes)                           | The 72 routes, grouped                                            |
| [11. Build server](#11-build-server)                       | The Rust/Axum compile pipeline and its sandbox                    |
| [12. Design decisions](#12-design-decisions-worth-knowing) | Why the system is shaped this way                                 |

---

## 1. The shape of the system

```
┌─────────────────────────────────────────────────────────────────────┐
│  BROWSER                                                            │
│  React 18 · wallet-adapter (external wallets) · Dynamic (embedded)  │
│  Monaco (code challenges) · QuickJS sandbox (challenge runner)      │
└──────────┬──────────────────────────────┬───────────────────────────┘
           │ fetch / POST                 │ wallet signs (enroll, close)
┌──────────▼──────────────────────────────▼───────────────────────────┐
│  NEXT.JS 15 App Router (Vercel)                                     │
│  Server Components · 72 API routes · middleware (auth + i18n + CSP) │
│                                                                     │
│  ┌───────────────────────────────────────────────────────────────┐  │
│  │ COMMITTED CONTENT BUNDLE  src/content/generated/*.json        │  │
│  │ compiled from solanabr/academy-courses @ content.lock sha     │  │
│  │ statically imported — no runtime fetch, no CMS                │  │
│  └───────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  Holds: BACKEND_SIGNER_SECRET · PROGRAM_AUTHORITY_SECRET            │
│         SUPABASE_SERVICE_ROLE_KEY · GEMINI_API_KEY · RESEND_API_KEY │
│         GITHUB_TOKEN (read-only)                                    │
└────────┬─────────────┬─────────────┬────────────────┬───────────────┘
         │             │             │                │
         ▼             ▼             ▼                ▼
   ┌──────────┐  ┌──────────┐  ┌────────────┐  ┌────────────────┐
   │ Supabase │  │  Solana  │  │ Build svr  │  │ Gemini, Resend │
   │  DB+Auth │  │  devnet  │  │ Cloud Run  │  │ Helius, Irys   │
   │ 36 tables│  │Token-2022│  │ Rust/Axum  │  └────────────────┘
   │  RLS on  │  │ MPL Core │  └────────────┘
   └──────────┘  └──────────┘
        ▲
        │ Helius webhook → /api/webhooks/helius → DB credit
        └── on-chain events replayed into the mirror
```

Build-time only, not a runtime dependency:

```
solanabr/academy-courses ──► compile-content.ts ──► committed bundle
      (git = source of truth)   (pinned by apps/web/content.lock)
```

### Monorepo layout

| Directory                      | Purpose                                                             |
| ------------------------------ | ------------------------------------------------------------------- |
| `apps/web/`                    | Next.js 15 app — pages, API routes, components, service layer       |
| `apps/build-server/`           | Rust/Axum SBF compiler on Cloud Run                                 |
| `onchain-academy/`             | Pinocchio program workspace, committed IDL, Rust + LiteSVM tests    |
| `packages/types/`              | Shared TypeScript interfaces                                        |
| `packages/content-schema/`     | Zod schemas for the content standard                                |
| `packages/content-lint/`       | Content linter — the gate in `academy-courses` CI                   |
| `packages/challenge-executor/` | Sandboxed challenge runner shared by the app and the linter         |
| `packages/deploy/`             | Browser-side Solana program deployment (BPF loader chunking)        |
| `packages/config/`             | Shared ESLint, TypeScript, Tailwind configs                         |
| `supabase/`                    | 60 migrations (source of truth) + a generated `schema.sql` snapshot |

### Deployment model

| Service          | Host              | Notes                                                    |
| ---------------- | ----------------- | -------------------------------------------------------- |
| Web app          | Vercel            | Root directory `apps/web`, auto-deploys from `main`      |
| Database + Auth  | Supabase          | RLS everywhere, SECURITY DEFINER functions, service_role |
| Content          | Committed to repo | No hosted service, no runtime credential                 |
| On-chain program | Solana devnet     | Pinocchio 0.11, Token-2022, Metaplex Core                |
| Build server     | GCP Cloud Run     | Docker, `X-API-Key` at the app layer, scale-to-zero      |
| Scheduled jobs   | Vercel Cron       | Two email jobs, declared in `apps/web/vercel.json`       |

---

## 2. Page structure

```
app/layout.tsx
  └── [locale]/  (ThemeProvider + wallet providers + reward overlays)
       ├── (marketing)/       landing, /start onboarding intake
       ├── (platform)/        header + sidebar chrome
       │    ├── dashboard/    auth-gated: enrolled courses, XP, streak, quests
       │    ├── courses/[slug]/lessons/[id]
       │    ├── community/[category]/[thread]
       │    ├── leaderboard/  all-time, weekly, monthly, cohort
       │    ├── certificates/[id]
       │    ├── profile/[username]
       │    ├── review/       spaced repetition
       │    ├── teach/        instructor course stats + PR preview
       │    └── settings/
       └── admin/             courses · moderation · insights · status
```

Auth-gated: `/dashboard`, `/settings`, `/teach`, `/review`, and `/profile`
exactly. Everything else on the platform is publicly readable — a signed-out
visitor can read a lesson, they just cannot complete one.

`/start` (under `(marketing)`, ISR at 300s) is the onboarding intake: a few taps
map the learner to one of three segments and route them at an entry lesson. The
route resolution is sync-gated — an unsynced entry course falls back to
`/courses` rather than a 404ing lesson page.

### Component groups

`apps/web/src/components/` is grouped by surface, not by type:

| Group                                                          | What lives there                                                               |
| -------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| `ui/`                                                          | shadcn/Radix primitives — the only group nothing else may bypass               |
| `layout/`, `landing/`, `onboarding/`                           | Chrome, the marketing surface, and the `/start` intake                         |
| `auth/`, `wallet/`                                             | Sign-in rails, wallet connect/link, session-bound gates                        |
| `courses/`, `course/`, `lessons/`, `editor/`                   | Catalog, course detail, the `blocks[]` renderer, Monaco + the runner           |
| `dashboard/`, `profile/`, `settings/`, `review/`               | The learner's own surfaces                                                     |
| `gamification/`, `leaderboard/`, `referrals/`, `certificates/` | Levels, achievement patches, reward popups, cohort ranking, credential display |
| `community/`                                                   | Threads, answers, voting, flagging                                             |
| `deploy/`                                                      | Browser-side program deployment UI                                             |
| `admin/`                                                       | The four admin screens                                                         |
| `analytics/`, `icons/`                                         | Provider wrappers and iconography                                              |

### Client vs server

Server components are the default; `"use client"` is the exception and has to
earn itself. The always-client set is small and predictable:

| Must be client                | Why                                                          |
| ----------------------------- | ------------------------------------------------------------ |
| Wallet + Dynamic providers    | Browser-only SDKs, context at the `[locale]` layout root     |
| Monaco + the challenge runner | `dynamic()` with `ssr: false` — a 4 MB+ SSR bundle otherwise |
| Reward popups, confetti       | Event-bus subscribers with animation state                   |
| Forms, votes, filters         | Interactive state and optimistic updates                     |

Everything read-only — catalog, lesson prose, leaderboard, profiles — renders on
the server, so those routes ship no client JS for their data.

---

## 3. Data flow

### Four data sources

| Source            | Data                                                  | Access                                                |
| ----------------- | ----------------------------------------------------- | ----------------------------------------------------- |
| Committed bundle  | Courses, lessons, blocks, achievements, quests, paths | Static import at build time, `server-only`            |
| Supabase Postgres | User data + on-chain deployment status                | Anon key + RLS for reads; service_role via API routes |
| Solana            | Token-2022 XP, Enrollment PDAs, credential NFTs       | Backend signer writes; RPC + Helius webhook reads     |
| Build server      | Compiled `.so` binaries                               | `POST /build`, returned inline as base64              |

### Content: git to page

```
solanabr/academy-courses     course.yaml, lesson.yaml, achievements/,
        │                    quests/, paths/, skills/, slots.lock.json
        │  pinned to ONE commit by apps/web/content.lock
        ▼
apps/web/scripts/compile-content.ts
        │  fetch tarball @ locked SHA → Zod-validate every doc (fail-closed)
        │  → project → emit deterministic JSON (sorted keys, no timestamps)
        ▼
apps/web/src/content/generated/*.json    COMMITTED, prettier-ignored
apps/web/public/content-assets/*         COMMITTED
        │
        ▼ static import (server-only)
lib/content/store.ts ──► lib/content/queries.ts ──► Server Components
```

The bundle currently carries 4 courses, 23 lessons, 18 achievements, 5 quests,
and 1 learning path (see `meta.json`).

What this buys:

- **Determinism** — output is a pure function of the locked SHA. CI recompiles
  and fails on a single byte of drift, catching both a stale bundle after a lock
  bump and a hand-edit of the generated files.
- **No runtime dependency** — a content-repo outage cannot affect the site.
- **No content-write credential exists.** Publishing is a PR that bumps
  `content.lock` and commits the regenerated bundle. `GITHUB_TOKEN` is read-only
  and only polls HEAD and CI state for the admin publish card.

`lib/content/store.ts` is `server-only` **by necessity**: the bundle holds quiz
answer keys, code solutions, and hidden tests, so a client value-import must be a
build error. Client components read the safe subset through `/api/content/*`.

### The visibility gate

A course is visible to learners **iff its Supabase deployment row says so**:

```
visible  ⇔  onchain_deployments.status == "synced"  AND  coalesce(is_active, true)
```

It lives in exactly one function — `isSynced()` in `lib/content/deployments.ts` —
and is applied to every public read. Content with **no** deployment row is hidden
(fail-closed). `is_active` is tri-state; `NULL` coalesces to `true`, so
deactivation is opt-in.

Two read paths:

| Function                 | Client                                                                 | Used by                         |
| ------------------------ | ---------------------------------------------------------------------- | ------------------------------- |
| `getActiveDeployments()` | Cookieless anon read of `public_onchain_deployments`, `unstable_cache` | Public catalog and lesson reads |
| `getDeploymentById(id)`  | service_role, uncached, full row                                       | Reward paths and admin reads    |

The cookieless anon path is what keeps catalog and lesson routes static/ISR; an
admin sync purges the `courses` tag via `revalidateTag`.

### Lesson slots — the bit that bites

**A learner's on-chain progress bit is the lesson's SLOT from `slots.lock.json`,
never its position in `course.yaml`.** `getLessonSlot()`
(`lib/courses/lesson-slot.ts`) resolves it and **fails closed** — an unslotted
lesson id throws rather than guessing, because a wrong slot corrupts on-chain
state. `findLessonIndex()` is the array position and is display-only; conflating
the two was a real incident. `deriveActiveMask()` builds the on-chain
`active_lessons` mask from the same lock, and CI gate-3 in `content-lint` fails
any `academy-courses` PR that moves a surviving slot, reuses a retired one, or
walks `next` backwards.

### Lesson completion (the critical path)

`POST /api/lessons/complete` orchestrates the whole learning loop:

```
1.  Auth ── Supabase session                            → 401
2.  Enrollment check (Supabase)                          → 403
3.  Idempotency: user_progress.completed                 → early return
4.  Wallet + program liveness — no wallet or no program? skip chain, keep going
5.  On-chain bitmap idempotency: isLessonComplete()      → skip the TX
6.  complete_lesson — backend signer, XP minted by CPI   → 500 on TX failure
7.  Re-fetch enrollment, test the mask for completion
8.  finalize_course if complete — bonus XP + creator XP  (non-fatal)
9.  issue_credential if finalized and no credential      (non-fatal)
10. Supabase writes: user_progress (required), award_xp  (non-fatal)
11. Achievement check against the content award rules    (non-fatal)
12. Response → client enqueues reward popups
```

**The "non-fatal" pattern**: mirror writes and on-chain achievement mints are
wrapped in try/catch. A failure is logged and queued, never a 500. On-chain state
is the truth; the mirror is rebuildable from `/admin/status`.

### The retry queue

`pending_onchain_actions` holds anything the chain leg could not finish:
`achievement | certificate | course_finalize | xp | quest_xp | quest_xp_mint |
enroll`.

Written from three places: Postgres itself (`get_daily_quest_state` inserts a
`quest_xp` row **in the same transaction** that flips `xp_granted`, so a quest can
never be marked granted without a durable pending row), the Helius event
handlers, and the mint/quest API routes.

Drained by `retryPendingOnchainActions()` (`lib/solana/onchain-queue.ts`) at the
**three login chokepoints** — `/api/auth/callback`, `/api/auth/wallet`,
`/api/auth/dynamic` — each inside `after()`, never a bare floating promise: the
drain does per-row RPC reads and on-chain sends, and a detached promise can be
killed mid-write when the response is flushed. Pass 1 settles DB-only `quest_xp`
credits; pass 2 does on-chain work and needs a linked wallet. The whole pass
defers when the platform freeze is on. `lib/dashboard/loaders.ts` runs a narrower
quest-XP sweep for learners who never log out.

### Helius webhook → DB credit

`POST /api/webhooks/helius` is the read-back path that keeps the mirror honest
when the app is not the one that observed the transaction.

```
Helius → Bearer compare (timing-safe, HELIUS_WEBHOOK_SECRET) → 1 MB body cap
  → decodeEventsFromTransaction (Anchor event decode against the IDL)
  → normalizeEventData → switch on event name
```

| Event                | Credit                                                           |
| -------------------- | ---------------------------------------------------------------- |
| `Enrolled`           | upsert `enrollments`                                             |
| `EnrollmentClosed`   | update `enrollments`                                             |
| `LessonCompleted`    | upsert `user_progress`, then `award_xp()`                        |
| `CourseFinalized`    | `award_xp()` for the learner **and** the creator; referral point |
| `CredentialIssued`   | Irys/Arweave metadata upload + `nft_metadata` + `certificates`   |
| `AchievementAwarded` | `unlock_achievement()` + `award_xp()`, deduped                   |
| `XpRewarded`         | `award_xp()`                                                     |

Handler errors are logged and swallowed so the remaining events in a batch still
process — the route never 500s at Helius. Anything that fails lands in
`pending_onchain_actions`.

### Reward-XP idempotency

`reward_xp` has **no receipt PDA**, so the chain cannot reject a duplicate — the
caller must guarantee at-most-once itself. The pattern is reserve-then-send:
`buildSignedRewardXpTx()` returns a signed transaction whose signature is known
before anything is broadcast, the drainer reserves that signature in
`xp_transactions.tx_signature` with a conditional update, and then
`sendSignedTransaction()` broadcasts those exact bytes. Re-sending identical
signed bytes is idempotent on Solana. **Never rebuild the transaction to retry
it** — a fresh blockhash means a fresh signature, which mints again.

---

## 4. Service layer

### `lib/content/*` — the content read layer

All server-only. Composes three seams: the bundle, Supabase deployment status,
and projectors.

| Module                 | Purpose                                                                          |
| ---------------------- | -------------------------------------------------------------------------------- |
| `store.ts`             | Static imports into id/slug-keyed maps. The `server-only` marker is load-bearing |
| `queries.ts`           | The query API; owns `COURSES_CACHE_TAG`                                          |
| `deployments.ts`       | The visibility gate: `getActiveDeployments`, `getDeploymentById`, `isSynced`     |
| `deployment-writes.ts` | The service_role upserts into `onchain_deployments`                              |
| `project.ts`           | Projectors from raw bundle docs to app types                                     |
| `meta.ts`              | `contentMeta` + `SYNCED_SHA`, a build-time constant                              |
| `client-queries.ts`    | Browser fetch wrappers over `/api/content/*`, same signatures as the server ones |
| `compile/*`            | Compiler internals, shared with `scripts/compile-content.ts`                     |

### `lib/solana/*` — the chain layer

| Module                                        | Purpose                                                                          |
| --------------------------------------------- | -------------------------------------------------------------------------------- |
| `academy-program.ts`                          | Server-only backend-signed instructions (complete lesson, finalize, credential)  |
| `admin-signer.ts`                             | Server-only authority-signed instructions (course + achievement deploys)         |
| `academy-reads.ts`                            | Account decoding. Course decode is **length-dispatched**: 224 → v1, 253 → v-next |
| `instructions.ts`                             | Client-side builders for the learner-signed instructions (`enroll`, `close`)     |
| `pda.ts`                                      | All six PDA derivations; `getProgramId()` throws when the env var is unset       |
| `bitmap.ts`                                   | `lesson_flags` / `active_lessons` encode and decode                              |
| `onchain-queue.ts`                            | The retry-queue drainer                                                          |
| `xp-mint.ts`                                  | Raw Token-2022 mint/burn for the wallet link/unlink flow                         |
| `sponsor-enroll.ts`                           | Backend-sponsored enroll (payer split from learner)                              |
| `verify-program-deploy.ts`                    | BPF Upgradeable Loader parsing to verify program id + upgrade authority          |
| `parse-program-error.ts`, `program-errors.ts` | Custom error code → IDL error → i18n key                                         |

Everything encodes through `@coral-xyz/anchor`'s `BorshCoder`, not a hand-rolled
encoder — the IDL stays the single wire contract even though no Anchor crate
produces it any more.

### `lib/ai/*` — the lesson assistant

Gemini over raw REST (no SDK). Per-action model routing lives in `models.ts`:
cheap models for hints and Socratic turns, the larger model for ask/propose/
review. Spend is metered in micro-USD into the `ai_spend_ledger` table across
three dimensions (account, IP, global) with soft and hard caps per
America/São_Paulo day. Over a soft cap the tutor degrades to a shorter output
budget; over a hard cap it denies with a 503. Unlike the rate limiter, the spend
ledger **fails closed** — a ledger error denies rather than allows.

---

## 5. On-chain integration

The program is Pinocchio 0.11, 18 instructions, 6 PDA types, 37 errors, 18
events. [SPEC.md](./SPEC.md) is authoritative for layouts and validation order;
what follows is only how the app touches it.

| Instruction                                                                    | Signer            | Called from                        |
| ------------------------------------------------------------------------------ | ----------------- | ---------------------------------- |
| `initialize`, `update_config`, `close_course`                                  | Authority         | operator scripts                   |
| `create_course`, `update_course`                                               | Authority         | `admin-signer.ts` (admin sync)     |
| `create_achievement_type`, `deactivate_achievement_type`                       | Authority         | `admin-signer.ts` / scripts        |
| `register_minter`, `update_minter`, `revoke_minter`                            | Authority         | operator scripts                   |
| `enroll`                                                                       | Learner + payer   | `/api/enroll/sponsor` + client sig |
| `close_enrollment`                                                             | Learner           | `instructions.ts`                  |
| `complete_lesson`, `finalize_course`, `issue_credential`, `upgrade_credential` | Backend signer    | `academy-program.ts`               |
| `reward_xp`, `award_achievement`                                               | Registered minter | quest drainer, achievement award   |

### PDAs

| PDA                | Seeds                                                | Size  |
| ------------------ | ---------------------------------------------------- | ----- |
| Config             | `["config"]`                                         | 113 B |
| Course             | `["course", course_id]`                              | 253 B |
| Enrollment         | `["enrollment", course_id, learner]`                 | 127 B |
| MinterRole         | `["minter", minter]`                                 | 110 B |
| AchievementType    | `["achievement", achievement_id]`                    | 338 B |
| AchievementReceipt | `["achievement_receipt", achievement_id, recipient]` | 49 B  |

Config is the singleton root: it holds `authority`, the rotatable
`backend_signer`, `xp_mint`, and the `paused` kill switch, and it is the update
authority for every Metaplex Core collection. Enrollment holds the 256-bit
`lesson_flags` bitmap, `completed_at`, and `credential_asset`.
AchievementReceipt is a thin existence-proof PDA — a second award collides on
init and errors.

> **ID convention**: the content `_id` (`course-*`, `achievement-*`) is the PDA
> seed, used **verbatim**. Stripping the prefix derives a different PDA and the
> deploy or award silently targets a non-existent account.

### XP and credentials

**XP** is a Token-2022 mint created during `initialize`, owned by the Config PDA,
0 decimals, with NonTransferable (cannot move between wallets) and
PermanentDelegate (the platform can burn without an owner signature). Minted by
CPI in `complete_lesson` and `finalize_course`, and by `reward_xp` /
`award_achievement` for the extensible paths.

**Credentials** are Metaplex Core assets, made soulbound by a
`PermanentFreezeDelegate { frozen: true }` plugin applied at creation, with an
Attributes plugin carrying `track_id`, `track_level`, `courses_completed`, and
`total_xp`. One collection per course track. `enrollment.credential_asset == None`
triggers a create; `Some(pubkey)` triggers an update.

### Trust boundary

The backend signer is a **trusted off-chain authority**, and its co-signature is
an _authorization_ boundary, not a _proof of merit_. The program verifies
structure only: the lesson bit was not already set, the course finalizes at most
once, supply and minter caps hold, the kill switch is off, and every account
matches its PDA. It does **not** verify that the learner completed the lesson —
that check happens off-chain before the co-signature. A compromised backend key
can therefore mint XP and credentials at will, bounded by minter caps and the
pause flag; the mitigation is rotation via `update_config`.

---

## 6. Authentication

[AUTH-FLOWS.md](./AUTH-FLOWS.md) is the authoritative map. The architectural
invariant, in one line:

> An external prover proves things (Dynamic for Google handshakes and
> embedded-wallet ownership, wallet-adapter for external-wallet ownership,
> Supabase OAuth for the fallback); **Supabase owns identity**; every proof is
> exchanged **server-side** for a Supabase cookie session.

```
  prover                        exchange (server)              identity
  ──────                        ─────────────────              ────────
  wallet signs a nonce   ──►    /api/auth/wallet        ┐
  Dynamic JWT + JWKS     ──►    /api/auth/dynamic       ├──►  Supabase
  Supabase OAuth         ──►    /api/auth/callback      ┘     cookie session
                                       │
                                       └── four post-login rituals
```

| Rail                 | What it verifies                                | Optional?                                        |
| -------------------- | ----------------------------------------------- | ------------------------------------------------ |
| `/api/auth/wallet`   | SIWS signature over a server-issued nonce       | No — the guaranteed path and the kill switch     |
| `/api/auth/dynamic`  | A Dynamic JWT against the per-environment JWKS  | Yes — unset `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` |
| `/api/auth/callback` | A Supabase OAuth code exchange (Google, GitHub) | Yes — the fallback rail                          |

The three share four post-login rituals: tombstone refusal on
`profiles.deleted_at`, placeholder-username replacement, the
`pending_onchain_actions` drain, and first-login avatar adoption. Add a new way
in, add all four.

Dynamic is entirely optional: unset `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` and no
provider mounts, no SDK loads, no network call happens. SIWS with an external
wallet is the guaranteed path and the kill switch.

### Middleware

`src/middleware.ts` chains three concerns: a per-request CSP nonce, Supabase auth
via `getClaims()` (local JWT verification against a cached JWKS — no per-request
DB query), then next-intl with `localePrefix: "always"`. Server components share
one claims read per request through `getAuthClaims()` (`lib/auth/dal.ts`, React
`cache()`).

Soft-deleted accounts are refused at the login chokepoints rather than on every
request; every `profiles.deleted_at` writer pairs with session revocation, so a
stale session dies at its next token refresh.

### Admin authorization

There is **no admin password and no login form**. Access is the caller's ordinary
Supabase session checked against the `admin_users` allowlist — a table with RLS
on and _zero_ policies plus explicit REVOKEs, readable only by the service role.
`requireAdmin()` (`lib/admin/auth.ts`) verifies the user server-side via
`auth.getUser()` (never a client-supplied id) and fails closed on everything: no
session, DB error, missing env. Signed-in non-admins get a **404**, so the panel's
existence is not revealed. `requireAdminAuth()` adds a same-origin CSRF check on
state-changing methods.

The retired `ADMIN_SECRET` / HMAC-cookie system is gone from all runtime code.

---

## 7. Database

**36 tables, RLS enabled on all of them.** Migrations in `supabase/migrations/`
are the source of truth (60 of them); `supabase/schema.sql` is a generated
snapshot kept for diffing.

| Group                | Tables                                                                                                                                                            |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Core (10)            | `profiles`, `enrollments`, `user_progress`, `user_xp`, `xp_transactions`, `user_achievements`, `certificates`, `nft_metadata`, `siws_nonces`, `deployed_programs` |
| Community (6)        | `forum_categories`, `threads`, `answers`, `votes`, `flags`, `thread_views`                                                                                        |
| Gamification (5)     | `user_daily_quests`, `challenge_assists`, `streak_freezes_used`, `review_items`, `review_schedule`                                                                |
| Leagues (3)          | `league_cohorts`, `league_members`, `league_tiers`                                                                                                                |
| Referrals (2)        | `referral_events`, `referral_seasons`                                                                                                                             |
| AI (1)               | `ai_spend_ledger`                                                                                                                                                 |
| Email (2)            | `email_subscriptions`, `email_reminder_log`                                                                                                                       |
| Moderation/admin (2) | `moderation_actions`, `admin_users`                                                                                                                               |
| Infra/queue (5)      | `pending_onchain_actions`, `rate_limits`, `course_changelog`, `onchain_deployments`, `platform_freeze`                                                            |

Views: `public_user_xp`, `public_profiles`, `community_stats`,
`public_onchain_deployments`.

### The access pattern

RLS is row-level, not column-level, so wherever a table needs a _narrower public
surface_ the answer is a **view**, not a policy. Both `user_xp` and
`onchain_deployments` follow that shape:

- Users SELECT/INSERT/UPDATE only their own rows, verified through `auth.uid()`.
- `user_xp`, `xp_transactions`, `user_achievements`, `certificates`, and
  `nft_metadata` have no user INSERT/UPDATE policies at all — every write goes
  through a SECURITY DEFINER function.
- Those functions (`award_xp`, `unlock_achievement`, `get_daily_quest_state`,
  and ~55 more) are **REVOKE**d from `authenticated`, `anon`, and `public`, and
  **GRANT**ed only to `service_role`. API routes call them via
  `createAdminClient()`.
- `onchain_deployments` has RLS on with **zero policies** — service_role only.
  Anon and authenticated read the `public_onchain_deployments` view, which
  exposes only `content_id, kind, status, is_active, achievement_pda`. Never add
  a raw pubkey, tx signature, or `track_collection_address` to that view.
- Community data (categories, threads, answers, votes) has public SELECT.
- Leaderboards go through `get_leaderboard()` and the `public_user_xp` view, not
  a broad SELECT policy on `user_xp`.

`handle_new_user()` fires on every `auth.users` insert and provisions the
`profiles` and `user_xp` rows.

> **Migration ledger caveat.** Migrations applied through the Supabase MCP get an
> MCP-stamped version that diverges from the repo filename, so
> `schema_migrations` does not match `supabase/migrations/`. Read
> [DB-MIGRATION-LEDGER.md](./DB-MIGRATION-LEDGER.md) before any `supabase db
push` or `migration list`.

---

## 8. Gamification, as shipped

### XP and levels

XP is dual-tracked: Token-2022 on-chain (truth) plus a Supabase mirror (speed).

| Action                  | XP                                                      |
| ----------------------- | ------------------------------------------------------- |
| Complete lesson         | 10–50 by difficulty (`xp_per_lesson` on the Course PDA) |
| Complete course (bonus) | `floor(xp_per_lesson * lesson_count / 2)`               |
| Creator reward          | `creator_reward_xp` on finalize                         |
| Community               | thread 5, answer 10, accepted answer 25                 |

**Level** is `floor(sqrt(totalXP / 100))` — 100 XP for L1, 400 for L2, 10 000 for
L10. The same formula is implemented in `award_xp()` in SQL; both must move
together. Community XP is capped at 50/day inside `award_xp()`; API routes cap
per-call awards independently (100 per lesson, 2000 per generic award).

### Streaks

Handled entirely inside `award_xp()`: yesterday's activity increments, today's is
a no-op, a gap longer than a day resets to 1, and `longest_streak` is a running
`GREATEST`. Streak freezes (`streak_freezes_used`) can cover missed days.

### Achievements — content, not code

Each achievement doc in `academy-courses` carries a declarative `award` rule (a
Zod discriminated union). The app holds one predicate per award **kind** — not
per achievement — in `PREDICATES satisfies Record<AwardKind, Predicate>`
(`lib/gamification/achievements.ts`). The `satisfies` makes a missing kind a
compile error, and no course or path id is hardcoded anywhere.

The eight kinds: `lessons-completed`, `lessons-completed-in-course`,
`course-completed`, `path-completed`, `streak`, `user-number`, `community-stat`,
`manual`.

The bundle currently carries **18** achievements: a course-agnostic progress
ladder (1/3/5/10/25/50 lessons), a streak ladder (3/7/14/30/100 days), three
community achievements, one path completion, **`speedrunner` as the only
course-specific badge**, and two `manual` ones (`bug-hunter` and `early-adopter`,
the latter retired from auto-award to admin grant). Do not enumerate them here —
the content repo is the source of truth.

`buildUserState()` assembles lessons, courses, paths, streak, user number, and
community stats in one pass; `checkNewAchievements()` evaluates every
not-yet-unlocked rule against it after each lesson completion.

### Quests

Five quests in the bundle, four active: complete a lesson (20 XP), two lessons
(40), a module (60), a 3-day login streak (50 XP, multi-day). **`quest-challenge`
is `active: false`.** Evaluation is server-side through the
`get_daily_quest_state` RPC — idempotent under `WHERE xp_granted = false`, keyed
on the UTC date — fired off the response path via `after()` and swept by
`retryQuestXpForUser`. Quest XP mints on-chain through the reserve-then-send
pattern described in §3.

### Reward popups

One FIFO queue for level-ups, quest completions, and achievements, 3.5s per card.
After **two individual cards**, any remaining rewards collapse into a single
summary card — a **3-card ceiling**, roughly seven seconds per moment, at most
one level-up card. The queue length is published to a module store so the
certificate popup and its full confetti burst **wait for the queue to drain**
rather than playing underneath it.

Confetti is deliberately scarce: full tier for a credential mint, medium for a
successful program deploy, and none at all for level-ups, achievements, or
quests. Everything respects `prefers-reduced-motion`. **There is no surprise
bonus** — the feature was removed; only historical `surprise_bonus` XP rows in
the activity feed remain.

---

## 9. Community forum

Threads and answers with three-state voting, accepted answers, full-text search
over a tsvector, and a flag queue feeding `/admin/moderation`.

Nine routes under `/api/community/*`: threads (list, detail, create, delete),
answers (create, accept, delete), votes, flags, search. Writes are authenticated
and rate-limited; votes and thread/answer creation go through SECURITY DEFINER
functions.

| Enforced by               | What it enforces                                              |
| ------------------------- | ------------------------------------------------------------- |
| Database trigger          | No self-voting, no self-flagging                              |
| Database trigger          | Denormalized `vote_score` and `answer_count` — never app code |
| SECURITY DEFINER function | Vote writes, thread/answer creation, XP award and revoke      |
| RLS policy                | Public SELECT on categories, threads, answers, votes          |

| Action          | XP  | Idempotency key                |
| --------------- | --- | ------------------------------ |
| Create a thread | 5   | `thread:{id}`                  |
| Post an answer  | 10  | `answer:{id}`                  |
| Answer accepted | 25  | `accept:{threadId}:{answerId}` |

Community XP is capped at 50/day inside `award_xp()`. Re-accepting a different
answer revokes the previous answerer's 25 XP through `revoke_community_xp()`
before awarding the new one.

---

## 10. API routes

**72 routes** under `apps/web/src/app/api/`. Re-derive rather than trusting any
table:

```bash
find apps/web/src/app/api -name route.ts \
  | sed 's|apps/web/src/app/api/||; s|/route.ts||' | sort
```

The per-route reference — auth, rate limits, and failure modes — lives in
`apps/web/src/app/api/CLAUDE.md`, which is maintained alongside the routes. The
grouping:

| Group               | Count | Notable                                                         |
| ------------------- | ----- | --------------------------------------------------------------- |
| Auth                | 6     | `wallet`, `dynamic`, `callback`, `nonce`, link/unlink           |
| Admin               | 16    | sync, publish pin, insights, flags, freeze, resync, recreate    |
| Content (public)    | 9     | bundle projections, deployment-gated                            |
| Lessons + learning  | 7     | `complete`, `reflect`, `reveal-solution`, review, test-out      |
| AI                  | 4     | tutor turn, log, reset, comprehension-check seal                |
| Gamification/social | 6     | quests, leaderboards, referrals                                 |
| Community           | 9     | see §9                                                          |
| Chain + credentials | 5     | mint, metadata, sponsored enroll, Helius webhook, schema health |
| Code exec + deploy  | 3     | build proxy, deploy record, Rust playground proxy               |
| Teacher/preview     | 4     | PR preview, instructor stats                                    |
| Cron/email/account  | 4     | two cron jobs, unsubscribe, account delete                      |

No admin route holds a write credential for the content repo. `GITHUB_TOKEN` is
read-only and the publish flow's output is a prefilled PR link, not a write.

---

## 11. Build server

A standalone Rust/Axum service on Cloud Run that compiles learner-authored Solana
programs.

| Route            | Auth      | Purpose                     |
| ---------------- | --------- | --------------------------- |
| `/build`         | X-API-Key | Compile, returns the binary |
| `/deploy/{uuid}` | X-API-Key | Fetch a cached artifact     |
| `/health`        | —         | Health + cache stats        |
| `/metrics`       | X-API-Key | Counts, durations, hit rate |

The pipeline:

```
POST /build
  → X-API-Key (constant-time compare) + 512 KB body cap + exact-origin CORS
  → path/size validation — /src/*.rs only
  → source scan: reject std::process, std::fs, std::net, Command::new, proc_macro
  → content hash → LRU cache lookup ─── hit ──► return the cached .so
  → concurrency semaphore
  → cargo-build-sbf --offline against a pre-cached crate set
  → .so returned inline as base64
```

Defense in depth: SBF is the compile target, so the output cannot touch the host
even if the source scan is beaten, and the container runs non-root.

---

## 12. Design decisions worth knowing

| Decision                        | The trade                                                           |
| ------------------------------- | ------------------------------------------------------------------- |
| Hybrid on-chain / off-chain     | Verifiable truth, at the cost of a mirror that can lag              |
| Backend signer for progress     | Anti-cheat before the chain, at the cost of a trusted off-chain key |
| Content as a committed artifact | Zero runtime dependency, at the cost of a deploy to publish         |
| Visibility gated in Supabase    | Reversible hiding, at the cost of one more thing to sync            |
| Sandboxed challenge execution   | No server execution to secure, at the cost of a JS-only runner      |
| Ink over gradient               | A distinct identity, at the cost of the recognizable Solana palette |

### Hybrid on-chain / off-chain progress

Chain first, mirror second, mirror failures non-fatal. The alternative — writing
Supabase first — would make the mirror authoritative in exactly the failure cases
where it must not be.

### Backend signer, not learner signer, for progress

Lesson completion, finalization, and credential issuance are backend-signed so
eligibility is checked before the chain is touched. Enrollment and closure stay
learner-signed: they are personal commitments with no anti-cheat concern.

### Content as a committed artifact

Content changes become reviewable diffs with CI gates, the read path has zero
network hops, and no runtime path can mutate content because no write token
exists. The cost is that publishing needs a deploy — the intended trade.

### Visibility gated in Supabase, not in content

Courses stay hidden until they actually exist on-chain, and an admin can hide one
again without destroying the PDA. Fail-closed: no row means hidden.

### Sandboxed challenge execution

Challenge code runs in a QuickJS sandbox in the browser with a mock console — no
DOM, no network, no module imports, and no server-side execution infrastructure
to secure.

### Ink over gradient

The visual system is a dark-green/mint "ink" construction with outlined chips and
pressed-key affordances, not the Solana purple-to-teal gradient, which is now
reserved for credentials. See [CUSTOMIZATION.md](./CUSTOMIZATION.md).
