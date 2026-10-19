# API routes

No route inventory here: `find src/app/api -name route.ts` is the list, and a table drifts.

## Conventions

- Guard every env var a route needs and return a generic error. Never return a stack trace or an
  upstream error body.
- The learner is whoever the session says. Never take a user id, wallet or learner pubkey from the
  request body for anything the platform pays for or trusts.
- SECURITY DEFINER functions (`award_xp()`, `unlock_achievement()`, `get_daily_quest_state()` and
  similar) are called only through `createAdminClient()` (`lib/supabase/admin.ts`). XP caps are
  enforced inside `award_xp()`; don't award XP around it.
- Admin routes call `requireAdmin()` (`lib/admin/auth.ts`) first. It checks the session against the
  service-role-only `admin_users` allowlist and fails closed. There is no admin password.
- Cron routes (`/api/cron/*`) go through `lib/cron/guard.ts`: a timing-safe `CRON_SECRET` bearer
  check, failing closed with 503 when the secret is unset. Schedules live in `apps/web/vercel.json`.
- Rate-limit anything that spends money or calls Gemini (`lib/rate-limit.ts`). The limiter fails
  open by default; cost-critical callers pass `failClosed: true`.
- Content routes (`/api/content/*`) return summary-safe shapes only. A full lesson `blocks[]`
  carries solutions and hidden tests and never crosses to the client.
- Email consent (`opt_in` for marketing, `reminder_opt_in` for reminders) is off by default and
  written only through SECURITY DEFINER RPCs. Neither is inferred from the other.
- When a migration adds an object a route can't run without, add it to
  `lib/supabase/schema-expectations.ts`. `/api/health/schema` then reports the merge-to-apply gap.
- Learner on-chain progress uses the slot lock (`getLessonSlot()`), never the lesson's array
  index. See `.claude/rules/onchain-client.md`.

## Sensitive routes (high risk in `REVIEW.md`)

- Destructive admin: `admin/courses/recreate` (plus `preflight`), `admin/courses/deactivate`,
  `admin/courses/reactivate`, `admin/courses/sync`, `admin/achievements/sync`, `admin/resync`,
  `admin/freeze`, `admin/publish/pin`, `admin/email/announce-course`. A recreate wipes enrolled
  learners' progress in that course, and on mainnet it must refuse once anyone has enrolled.
- Platform-paid or minting: `enroll/sponsor` (the platform pays the fee and rent; the learner comes
  from the session), `certificates/mint`, `lessons/complete` (on-chain completion and XP),
  `quests/daily` (quest XP), `ai/partner` (paid Gemini calls).
- Identity: `auth/*` (SIWS nonce, wallet, OAuth callback redirect sanitizing, Dynamic, link and
  unlink), `account/delete`.
- Inbound: `webhooks/helius` (verifies `HELIUS_WEBHOOK_SECRET`), `teach/preview/*` (password-gated,
  read-only, compiles a PR in memory; never fetch a host derived from user input).
