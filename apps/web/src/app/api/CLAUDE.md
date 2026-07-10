# Frontend API Routes (36 routes)

## Auth

| Route                   | Method | Auth     | Purpose                                             |
| ----------------------- | ------ | -------- | --------------------------------------------------- |
| `/api/auth/nonce`       | GET    | None     | Generate SIWS nonce (stored in `siws_nonces` table) |
| `/api/auth/wallet`      | POST   | None     | SIWS authentication (nonce + Ed25519 verification)  |
| `/api/auth/callback`    | GET    | None     | Google/GitHub OAuth callback (code exchange)        |
| `/api/auth/link-wallet` | POST   | Required | Link wallet to existing account                     |
| `/api/auth/unlink`      | POST   | Required | Unlink auth method (wallet/Google/GitHub)           |

## Core Platform

| Route                             | Method   | Auth     | Purpose                                                                                      |
| --------------------------------- | -------- | -------- | -------------------------------------------------------------------------------------------- |
| `/api/lessons/complete`           | POST     | Required | Mark lesson complete, award XP, auto-finalize, check achievements                            |
| `/api/lessons/validate-challenge` | POST     | Required | Server-side challenge validation (UX pass/fail; completion gated in `/api/lessons/complete`) |
| `/api/leaderboard`                | GET      | None     | XP rankings (alltime/weekly/monthly)                                                         |
| `/api/certificates/metadata`      | GET      | None     | Serve NFT metadata JSON by UUID                                                              |
| `/api/certificates/mint`          | POST     | Required | Manual credential mint with retry queue                                                      |
| `/api/build-program`              | POST     | Required | Proxy Anchor build to build server                                                           |
| `/api/deploy/save`                | POST     | Required | Save deployed program record                                                                 |
| `/api/deploy/[uuid]`              | GET      | Required | Download compiled .so binary                                                                 |
| `/api/rust/execute`               | POST     | Required | Proxy basic Rust execution to Rust Playground                                                |
| `/api/quests/daily`               | GET/POST | Required | Get daily quest state / award quest XP (on-chain minting)                                    |

## AI Lesson Assistant

| Route             | Method | Auth     | Purpose                                                         |
| ----------------- | ------ | -------- | --------------------------------------------------------------- |
| `/api/ai/chat`    | POST   | Required | Lesson tutor chat (Gemini); rate-limited + input-capped         |
| `/api/ai/suggest` | POST   | Required | Challenge code suggestion (Gemini); rate-limited + input-capped |

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

| Route                           | Method | Auth         | Purpose                                                                         |
| ------------------------------- | ------ | ------------ | ------------------------------------------------------------------------------- |
| `/api/admin/auth`               | POST   | ADMIN_SECRET | Admin authentication                                                            |
| `/api/admin/status`             | GET    | ADMIN_SECRET | Platform status (program liveness, authority match)                             |
| `/api/admin/courses/sync`       | POST   | ADMIN_SECRET | Deploy course PDA + collection on-chain                                         |
| `/api/admin/courses/deactivate` | POST   | ADMIN_SECRET | Set course `is_active = false`                                                  |
| `/api/admin/courses/reactivate` | POST   | ADMIN_SECRET | Set course `is_active = true`                                                   |
| `/api/admin/achievements/sync`  | POST   | ADMIN_SECRET | Deploy achievement type + collection on-chain                                   |
| `/api/admin/resync`             | POST   | ADMIN_SECRET | Resync on-chain state to Supabase                                               |
| `/api/admin/content/sync`       | POST   | ADMIN_SECRET | Sync academy-courses@sha → Sanity (re-validate, PRESERVE, prune, content_tx_id) |
| `/api/admin/content/drift`      | GET    | ADMIN_SECRET | Three-way drift: content (repo→Sanity) + chain (Sanity→devnet)                  |

## Route Conventions

- Env var null guards on every route; generic error messages (no stack traces)
- `SECURITY DEFINER` Postgres functions (`award_xp()`, `unlock_achievement()`, `get_daily_quest_state()`) are callable only via `createAdminClient()` (`lib/supabase/admin.ts`)
- Server-side XP caps: max 100 XP per lesson completion, max 2000 XP per generic award
