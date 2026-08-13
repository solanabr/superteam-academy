# Frontend API Routes

<!-- No route count here: it drifted (claimed 36 against 43 route.ts files) and
     the tables below have never been exhaustive. Trust the tree, not a number. -->

## Auth

| Route                   | Method | Auth     | Purpose                                                         |
| ----------------------- | ------ | -------- | --------------------------------------------------------------- |
| `/api/auth/nonce`       | GET    | None     | Generate SIWS nonce (stored in `siws_nonces` table)             |
| `/api/auth/wallet`      | POST   | None     | SIWS authentication (nonce + Ed25519 verification)              |
| `/api/auth/callback`    | GET    | None     | Google/GitHub OAuth callback (code exchange)                    |
| `/api/auth/dynamic`     | POST   | None     | Dynamic social sign-in → session for the matching email account |
| `/api/auth/link-wallet` | POST   | Required | Link wallet to existing account                                 |
| `/api/auth/unlink`      | POST   | Required | Unlink auth method (wallet/Google/GitHub)                       |

## Core Platform

| Route                             | Method   | Auth     | Purpose                                                                                                                                                                                                                                                                 |
| --------------------------------- | -------- | -------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/lessons/complete`           | POST     | Required | Mark lesson complete, award XP, auto-finalize, check achievements                                                                                                                                                                                                       |
| `/api/lessons/reflect`            | POST     | Required | Seal an `openEnded` reflection submission (attestation for `/api/lessons/complete`); best-effort AI reply                                                                                                                                                               |
| `/api/lessons/validate-challenge` | POST     | Required | Server-side challenge validation (UX pass/fail; completion gated in `/api/lessons/complete`)                                                                                                                                                                            |
| `/api/enroll/sponsor`             | POST     | Required | Backend-signed `enroll` tx — platform pays the fee + Enrollment PDA rent so a zero-SOL embedded wallet can enrol (#1004). Returns a partially-signed tx; the learner's wallet co-signs and submits. **The learner is read from the session's profile, never the body.** |
| `/api/leaderboard`                | GET      | None     | XP rankings (alltime/weekly/monthly)                                                                                                                                                                                                                                    |
| `/api/certificates/metadata`      | GET      | None     | Serve NFT metadata JSON by UUID                                                                                                                                                                                                                                         |
| `/api/certificates/mint`          | POST     | Required | Manual credential mint with retry queue                                                                                                                                                                                                                                 |
| `/api/build-program`              | POST     | Required | Proxy Anchor build to build server                                                                                                                                                                                                                                      |
| `/api/deploy/save`                | POST     | Required | Save deployed program record                                                                                                                                                                                                                                            |
| `/api/deploy/[uuid]`              | GET      | Required | Download compiled .so binary                                                                                                                                                                                                                                            |
| `/api/rust/execute`               | POST     | Required | Proxy basic Rust execution to Rust Playground                                                                                                                                                                                                                           |
| `/api/quests/daily`               | GET/POST | Required | Get daily quest state / award quest XP (on-chain minting)                                                                                                                                                                                                               |

## AI Lesson Assistant

| Route                    | Method | Auth     | Purpose                                                                                           |
| ------------------------ | ------ | -------- | ------------------------------------------------------------------------------------------------- |
| `/api/ai/partner`        | POST   | Required | AI Partner reply (Gemini); rate-limited **fail-closed** + input-capped; spends a paid assist      |
| `/api/ai/partner/log`    | GET    | Required | Persisted chat log + remaining paid-assist budget for the current user/lesson                     |
| `/api/ai/partner/verify` | POST   | Required | Grade a comprehension-check pick server-side (AES-GCM open + compare; no Gemini, no assist spent) |

## Content (committed bundle → client)

Public, read-only faces of the `server-only` content-bundle store (`lib/content/`).
All gated server-side on synced+active deployments; only summary-safe shapes cross
the boundary (never the full `Lesson` `blocks[]`, which carries solutions/tests).

| Route                            | Method | Auth | Purpose                                                                       |
| -------------------------------- | ------ | ---- | ----------------------------------------------------------------------------- |
| `/api/content/courses`           | GET    | None | Course summaries by id (dashboard/profile/certificates)                       |
| `/api/content/course-lessons`    | GET    | None | Ordered `{_id,title,slug}` lesson summaries per course (Continue card, LX-B2) |
| `/api/content/lessons-summary`   | GET    | None | Lesson summaries by id — `{_id,title,slug}` only (recent-activity titles)     |
| `/api/content/recommended`       | GET    | None | Next-course candidates for the Continue card; optional `exclude`              |
| `/api/content/achievements`      | GET    | None | Achievement catalog (name/icon/award rule/xp); statically cached, hourly      |
| `/api/content/tags`              | GET    | None | Course tags (profile skill radar); statically cached, hourly                  |
| `/api/content/lesson-skills`     | GET    | None | Per-lesson skill tags (profile Skills radar, #466 C3); cached, hourly         |
| `/api/content/is-instructor`     | GET    | None | Whether a wallet is a known instructor (header "Teach" nav gate)              |
| `/api/content/instructor-wallet` | GET    | None | Wallet → public academy profile for display (#478 B4)                         |

## Community Forum

| Route                                | Method   | Auth     | Purpose                                          |
| ------------------------------------ | -------- | -------- | ------------------------------------------------ |
| `/api/community/threads`             | GET/POST | Varies   | List threads (cursor pagination) / create thread |
| `/api/community/threads/[id]`        | GET      | None     | Thread detail with answers                       |
| `/api/community/threads/[id]/delete` | POST     | Required | Soft-delete own thread (author only)             |
| `/api/community/answers`             | POST     | Required | Post answer to a thread                          |
| `/api/community/answers/[id]/accept` | POST     | Required | Accept an answer (thread author only)            |
| `/api/community/answers/[id]/delete` | POST     | Required | Soft-delete own answer (author only)             |
| `/api/community/votes`               | POST     | Required | Upvote/downvote thread or answer                 |
| `/api/community/flags`               | POST     | Required | Flag content for moderation                      |
| `/api/community/search`              | GET      | None     | Full-text search across threads                  |

## Webhooks

| Route                  | Method | Auth                  | Purpose                                    |
| ---------------------- | ------ | --------------------- | ------------------------------------------ |
| `/api/webhooks/helius` | POST   | HELIUS_WEBHOOK_SECRET | Process on-chain events (XP, achievements) |

## Admin

| Route                                   | Method   | Auth         | Purpose                                                              |
| --------------------------------------- | -------- | ------------ | -------------------------------------------------------------------- |
| `/api/admin/auth`                       | POST     | ADMIN_SECRET | Admin authentication                                                 |
| `/api/admin/status`                     | GET      | ADMIN_SECRET | Platform status (program liveness, authority match)                  |
| `/api/admin/courses/sync`               | POST     | ADMIN_SECRET | Deploy course PDA + collection on-chain                              |
| `/api/admin/courses/deactivate`         | POST     | ADMIN_SECRET | Set course `is_active = false`                                       |
| `/api/admin/courses/reactivate`         | POST     | ADMIN_SECRET | Set course `is_active = true`                                        |
| `/api/admin/courses/recreate`           | POST     | ADMIN_SECRET | **DESTRUCTIVE** — close + recreate course PDA (create-only fields)   |
| `/api/admin/courses/recreate/preflight` | GET      | ADMIN_SECRET | Read-only preflight validation for the recreate execute route        |
| `/api/admin/achievements/sync`          | POST     | ADMIN_SECRET | Deploy achievement type + collection on-chain                        |
| `/api/admin/resync`                     | POST     | ADMIN_SECRET | Resync on-chain state to Supabase                                    |
| `/api/admin/flags`                      | GET      | ADMIN_SECRET | Pending community flags for the moderation queue                     |
| `/api/admin/freeze`                     | GET/POST | ADMIN_SECRET | Read/set the global deploy-window freeze (reset wave B2)             |
| `/api/admin/publish/pin`                | GET      | ADMIN_SECRET | Content pin: pinned bundle SHA + counts vs academy-courses HEAD      |
| `/api/admin/capstone-funnel`            | GET      | ADMIN_SECRET | Capstone credential funnel counters (#725)                           |
| `/api/admin/email/announce-course`      | POST     | ADMIN_SECRET | Send "new course available" email to marketing-opted-in users (#769) |

Content drift (bundle SHA vs `academy-courses` HEAD) and chain drift are folded
into `/api/admin/status`; the publish card reads `/api/admin/publish/pin`. There
is no separate drift route — one existed, was never wired to a UI, and was
deleted in #444.

## Email (#769, #869)

TWO independent consents, both opt-in-OFF by default (LGPD/GDPR/CAN-SPAM), both
written only through SECURITY DEFINER RPCs: **marketing** (`opt_in`, #769) and
**session-plan reminders** (`reminder_opt_in`, #869). Neither is ever inferred
from the other. The marketing send trigger is the Admin table's
`/api/admin/email/announce-course`; the reminder send is the cron route below.

| Route                         | Method   | Auth          | Purpose                                                                                                                                                                                                                                                                                                                     |
| ----------------------------- | -------- | ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/email/unsubscribe`      | GET/POST | Token         | One-click List-Unsubscribe by per-user token (GET renders a confirmation page; POST is the RFC 8058 one-click). No session — the email link carries none. `?kind=reminders` clears reminder consent only; anything else (incl. legacy no-kind links) clears marketing consent only.                                         |
| `/api/cron/session-reminders` | GET      | `CRON_SECRET` | Daily session-plan reminder send (#869). `Authorization: Bearer $CRON_SECRET`, timing-safe; **fails closed with 503 when `CRON_SECRET` is unset**. Schedule lives in `apps/web/vercel.json` (`0 11 * * *` = 08:00 America/Sao_Paulo). Idempotent per learner per São Paulo day — the claim RPC, not the route, enforces it. |

## Teacher preview (#828, #831)

Password-gated (`teach_preview_session` cookie, distinct from `admin_session`) preview of an
unpublished course from a `academy-courses` PR. Read-only: compiles the PR's head commit in
memory and renders it with the real course/lesson components. Nothing is written to the bundle,
`content.lock`, or the chain.

| Route                                      | Method   | Auth            | Purpose                                                                                                                                                                                                 |
| ------------------------------------------ | -------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/teach/preview/auth`                  | GET/POST | Shared password | `GET` probes the session; `POST` exchanges `TEACH_PREVIEW_PASSWORD` for an HMAC-signed cookie. Per-IP rate limited.                                                                                     |
| `/api/teach/preview`                       | POST     | Preview cookie  | `{ prUrl }` → compiled courses/lessons, or 422 with the content-lint issues CI would report.                                                                                                            |
| `/api/teach/preview/[pr]/assets/[...path]` | GET      | Preview cookie  | Serves a previewed PR's images from the in-memory bundle (#923). A previewed course's assets exist nowhere on disk; the compiled refs are rewritten to this route. Map lookup, never a filesystem read. |

## Health

| Route                | Method | Auth | Purpose                                                                                                                                                                                                                                                                                         |
| -------------------- | ------ | ---- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/api/health/schema` | GET    | none | Schema-expectation check (#731): 200 when every release-critical DB object exists, 503 naming the missing objects + their migrations. Detects the merge→apply gap; expectation list lives in `lib/supabase/schema-expectations.ts` — extend it when a migration adds a runtime-critical object. |

## Route Conventions

- Env var null guards on every route; generic error messages (no stack traces)
- `SECURITY DEFINER` Postgres functions (`award_xp()`, `unlock_achievement()`, `get_daily_quest_state()`) are callable only via `createAdminClient()` (`lib/supabase/admin.ts`)
- Server-side XP caps: max 100 XP per lesson completion, max 2000 XP per generic award
