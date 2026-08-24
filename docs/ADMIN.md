> Last synced: 2026-08-24

# Admin Console Guide

The admin console is a four-screen panel for operating the platform: the
**Courses** screen (publish content, deploy it on-chain, and the supporting
quest/achievement/path tables — three steps, one screen), **Moderation** of the
community forum, **Insights**, and platform **Status**.

It is **not** a CMS. Course content is authored in the
[`solanabr/academy-courses`](https://github.com/solanabr/academy-courses) git
repo and ships to the app as a **committed, compiled bundle**. The console holds
**no content-write token** and cannot mutate content — publishing is a pull
request. See [Publishing content](#1-publish--pin-the-content-bundle).

## Access

The console lives at `/{locale}/admin` (e.g. `/en/admin`).

**There is no admin password and no login form.** Access is your ordinary
Supabase session, checked against the `admin_users` allowlist table. Grant
yourself access by inserting your `auth.users` id into `admin_users` — that table
has RLS on with **zero policies** plus explicit REVOKEs, so only the service role
can read or write it, and no `ADMIN_SECRET`-style shared credential exists.

How it is enforced, in layers:

- Middleware redirects a session-less `/admin` to the localized landing.
- `requireAdmin()` (`lib/admin/auth.ts`) verifies the user server-side via
  `supabase.auth.getUser()` — never a client-supplied id — then checks the
  allowlist with the service-role client. It fails closed on everything: no
  session, expired session, DB error, missing env.
- Both `admin/layout.tsx` and `admin/page.tsx` call it and `notFound()` on
  failure, so a signed-in non-admin gets a **404** and the panel's existence is
  not revealed. A new admin sub-page that does its own server-side private fetch
  must call `requireAdmin()` itself — Next renders segments in parallel, so the
  layout's check does not gate a sibling's data fetch.
- Every `/api/admin/*` route calls `requireAdminAuth()`, which adds a same-origin
  CSRF check (`Sec-Fetch-Site`, falling back to `Origin`) on state-changing
  methods and returns the acting admin's id for attribution.

> The old `ADMIN_SECRET` / HMAC-`admin_session`-cookie system is **retired** and
> can be deleted from your Vercel environment. One straggler: the operator script
> `scripts/init-program.ts` still reads `ADMIN_SECRET` as a bearer token for its
> admin API calls, and is therefore broken against the current routes.

## Required environment variables

Admin **auth** needs no environment variable at all. These are what the admin
_operations_ need:

| Variable                    | Required for                                                                                                                                                                                         |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | The `admin_users` allowlist read, `onchain_deployments` writes, and the moderation queue. Without it every admin check fails closed.                                                                 |
| `PROGRAM_AUTHORITY_SECRET`  | The `Config.authority` keypair. Signs `create_course`, `update_course`, `create_achievement_type` from the **Courses** screen.                                                                       |
| `BACKEND_SIGNER_SECRET`     | The keypair registered in `Config.backend_signer`. Signs lesson/credential instructions from the learner-facing API routes.                                                                          |
| `SOLANA_RPC_URL`            | Server-only RPC (may carry the Helius key). Required at boot — every admin screen reads chain state through it.                                                                                      |
| `GITHUB_TOKEN`              | Fine-grained **read** token for `solanabr/academy-courses`. Powers the publish card's HEAD polling + CI-checks lookup. Unset → Publish shows "drift unavailable" (503); everything else still works. |
| `RESEND_API_KEY`            | The course-announcement send. Unset ⇒ nothing is ever sent (fail-closed).                                                                                                                            |

`GITHUB_TOKEN` is read-only by design. **No admin route holds a GitHub write
token** — nothing in the app can push a commit or open a PR on your behalf.

---

## The four screens

| Screen         | Route               | What it does                                                                    |
| -------------- | ------------------- | ------------------------------------------------------------------------------- |
| **Courses**    | `/admin/courses`    | Publish (step 1), deploy (step 2), supporting content (step 3) — see below      |
| **Moderation** | `/admin/moderation` | The pending community-flag queue (resolve / dismiss)                            |
| **Insights**   | `/admin/insights`   | Platform-behaviour aggregates: AI-tutor usage, spend, lesson funnel             |
| **Status**     | `/admin/status`     | Network, program liveness, authority match, deploy counts, on-chain → DB resync |

Two admin capabilities have no nav entry of their own:

- **Platform freeze** (`/api/admin/freeze`) — a global deploy-window kill switch.
  While it is on, the `pending_onchain_actions` drain defers wholesale rather
  than writing to a chain that is mid-migration. The freeze route is
  deliberately not itself freeze-gated, so it can always be turned back off.
- **Course recreate** (`/api/admin/courses/recreate`) — **destructive**: it
  closes and recreates a Course PDA. Always run
  `/api/admin/courses/recreate/preflight` (read-only) first.

The nav rail is persistent (left rail on desktop, tabs on mobile). The
**Moderation** tab carries a badge with the pending-flag count.

`/admin/publish`, `/admin/deploy` and `/admin/content` were separate screens;
they are now steps of Courses, and all three old routes redirect to
`/admin/courses`.

### Publish vs deploy — they are not the same step

Getting a course to learners takes **two** steps, in order:

1. **Publish — does the app _have_ this course?** Content lives in
   `solanabr/academy-courses`; the app ships a compiled bundle pinned to one
   commit in `apps/web/content.lock`. Publishing is a **human PR** that bumps
   the pin and commits the rebuilt bundle. The screen writes nothing — it shows
   pin-vs-HEAD drift and hands you a prefilled PR link (no GitHub write token,
   deliberately).
2. **Deploy — is the course _on chain_, and can learners see it?** Bundled
   content stays invisible until the course has a Course PDA and its
   `onchain_deployments` row is `synced` + `is_active`. Deploy creates/updates
   that.

**Editing lesson content does not require a deploy.** Lesson prose, code,
quizzes, the title and tags are not on-chain fields: they ship with the publish
PR alone and correctly show nothing to deploy. Only `xpPerLesson`,
`creatorRewardXp`, `minCompletionsForReward`, `lessonCount` and the immutable
set (creator, difficulty, track, track level, prerequisite) move the deploy
side. The screen carries a legend for every badge state.

---

## 1. Publish — pin the content bundle

### How content actually ships

```
solanabr/academy-courses  (git = source of truth: course.yaml, lesson.yaml, achievements/, …)
        │
        │  pinned to ONE commit by apps/web/content.lock
        ▼
apps/web/scripts/compile-content.ts   (fetch tarball @ SHA → Zod-validate → project → emit)
        │
        ▼
apps/web/src/content/generated/*.json   (COMMITTED bundle)
apps/web/public/content-assets/*        (COMMITTED assets)
        │
        ▼
the running app reads the bundle at build time — no runtime CMS fetch
```

Publishing new content is therefore **a pull request against this repo**, not a
button. The publish card exists to tell you _whether_ a bump is needed and to
hand you the exact diff.

### The "Content pin" card

`GET /api/admin/publish/pin` returns the pinned SHA (read from the committed
bundle's `meta.json`, which the compiler writes from `content.lock`), the
`academy-courses` HEAD SHA, HEAD's combined CI state, and a drift verdict:

| Verdict      | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `up_to_date` | Pin == HEAD. Nothing to publish.                                        |
| `behind`     | HEAD has moved. The card shows **N commits behind** and a compare link. |
| `unknown`    | GitHub unreachable (503) — the card degrades to "drift unavailable".    |

When drifted **and HEAD's CI is not green**, the card raises `warnRedHead` and
discourages the bump. Bumping to a red HEAD is possible but is a bad idea: the
`academy-courses` CI gate (the content linter + executor gate) is what certifies
that a tree is publishable, and `compile-content` does **not** re-run the
executor gate.

### Bumping the pin (the actual workflow)

1. Open `/admin/courses` and confirm the publish verdict is `behind` with a green HEAD.
2. Create a branch (the card suggests `chore/content-pin-<short-sha>`).
3. Edit `apps/web/content.lock` — set `"sha"` to the new HEAD.
4. Regenerate the bundle:
   ```bash
   pnpm --filter web compile-content
   ```
5. Commit **both** `apps/web/content.lock` **and** the regenerated
   `apps/web/src/content/generated/` (and `apps/web/public/content-assets/` if
   assets changed).
6. Push and open the PR — the card's button opens GitHub's PR form with the
   title and body prefilled. **The button performs no write**; it just opens the
   form.
7. Merge. Vercel redeploys from `main` with the new bundle.

### Why CI catches a bad bump

`compile-content` output is a **pure function of the locked SHA** — sorted keys,
no wall-clock timestamps, assets left as repo-relative paths. CI recompiles the
bundle and fails if the result differs by a single byte from what is committed
(the "Content bundle freshness" step in `.github/workflows/ci.yml`). That catches
both a stale bundle after a lock bump _and_ a hand-edit of the generated files.

> Never hand-edit `apps/web/src/content/generated/*`. An ESLint rule also bans
> importing it anywhere outside `src/lib/content/`.

---

## 2. Deploy — put content on-chain

A course is **invisible to learners** until it is deployed. The visibility gate
is a Supabase row, not a content field:

```
visible  ⇔  onchain_deployments.status == "synced"  AND  coalesce(is_active, true)
```

That gate lives in exactly one function — `isSynced()` in
`lib/content/deployments.ts` — and is applied to every public read. Content that
has no deployment row is **hidden** (fail-closed).

### Course table

Each row joins the bundle's course doc to its `onchain_deployments` row and to
live chain state, and shows one of:

| State            | Meaning                                                          |
| ---------------- | ---------------------------------------------------------------- |
| `missing_fields` | The content doc lacks a field the on-chain `create_course` needs |
| `not_deployed`   | No Course PDA on chain yet                                       |
| `synced`         | PDA exists and matches the recorded `course_pda`                 |
| `out_of_sync`    | A PDA exists but differs from the recorded one                   |

Actions:

- **Deploy** — `POST /api/admin/courses/sync`. Signs `create_course` with
  `PROGRAM_AUTHORITY_SECRET`, creates the course's Metaplex Core track
  collection, then upserts `onchain_deployments` (status `synced`, `course_pda`,
  `tx_signature`, `track_collection_address`) and purges the `courses` cache tag
  so the catalog picks the course up.
- **Deactivate** — `POST /api/admin/courses/deactivate`. Sets the on-chain
  Course `is_active = false` and mirrors it to `onchain_deployments.is_active`,
  which hides the course from learners without deleting the PDA.
- **Reactivate** — `POST /api/admin/courses/reactivate`. The inverse.

The `is_active` column is deliberately **tri-state**: `NULL` means "no explicit
flag" and the gate coalesces it to `true`. Deactivation is opt-in.

The table shows the **authoritative on-chain `is_active`** (decoded from the
account it already fetched), not the Supabase mirror — so a failed write-back
still surfaces the real deactivated state and offers Reactivate.

### Achievement table

Same shape. **Deploy** (`POST /api/admin/achievements/sync`) signs
`create_achievement_type` and creates the achievement's Metaplex Core collection,
then records `achievement_pda` + `collection_address` in `onchain_deployments`.

> **ID convention**: the content `_id` (`course-*`, `achievement-*`) is used
> **verbatim** as the on-chain PDA seed. Never strip the prefix anywhere —
> stripping it derives a different PDA and the award/deploy silently targets a
> non-existent account.

---

## 3. Moderation — the flag queue

`/admin/moderation` lists **pending** community flags (`GET /api/admin/flags`),
each resolved to a preview of the flagged thread/answer and a link to it.

`POST /api/admin/flags { flagId, action }` takes one of:

- `resolve` — the flag was valid; the content is actioned.
- `dismiss` — the flag was not valid.

Both transition the flag out of `pending`, which drops it from the queue and
decrements the nav badge.

If `MODERATION_WEBHOOK_URL` is set, the **first** flag on a post pings that
Slack/Discord-compatible webhook so admins know to check the queue. Unset → no
notification; the queue still fills normally.

---

## 4. Status — platform health

`GET /api/admin/status` drives this screen (and the Courses screen — they share
the `useAdminStatus` hook, so it is one fetch).

**Program status bar**

- Whether the on-chain program is live (the Config PDA resolves).
- Whether the local `PROGRAM_AUTHORITY_SECRET` matches the on-chain
  `Config.authority` (`verifyAuthorityMatchesConfig`). A mismatch here is why a
  deploy will fail with a constraint error.
- Whether the admin signer loaded at all (`isAdminSignerReady`).

**Deploy counts** — how many courses/achievements are in each state.

**Data resync** — `POST /api/admin/resync` re-reads on-chain state (enrollment
bitmaps, Token-2022 XP balances, achievement receipts) and backfills the Supabase
mirror tables. Use it after a Supabase mirror write failed behind a successful
on-chain transaction. On-chain is the source of truth; the mirror is rebuildable.

---

## Troubleshooting

| Symptom                                     | Check                                                                                                                                     |
| ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| **404 on `/admin` while signed in**         | Your user id is not in `admin_users`. Insert it with the service role. A 404 rather than a 403 is deliberate.                             |
| **401 on an admin API route**               | No Supabase session, or the request was cross-origin — both are rejected by design. `SUPABASE_SERVICE_ROLE_KEY` unset fails the same way. |
| **Publish card says "drift unavailable"**   | `GITHUB_TOKEN` unset or GitHub unreachable. The route 503s rather than crashing. Unauthenticated GitHub is 60 req/hr per IP.              |
| **Course not visible to learners**          | Its `onchain_deployments` row must be `status = "synced"` and `is_active` not `false`. Deploy it from `/admin/courses`.                   |
| **New lesson not showing up**               | The bundle is pinned. Bump `content.lock` and recompile — merging content to `academy-courses` alone changes nothing in the app.          |
| **"Transaction failed" on Deploy**          | Verify `PROGRAM_AUTHORITY_SECRET` is the real `Config.authority` (the Status screen's authority match tells you) and is funded with SOL.  |
| **CI fails with "Content bundle is stale"** | You bumped `content.lock` without recompiling, or hand-edited the generated bundle. Run `pnpm --filter web compile-content` and commit.   |

---

## Security notes

- Admin access is a row in `admin_users`, not a shared secret. Revoking someone
  is a `DELETE`; there is no password to rotate and nothing to leak.
- `PROGRAM_AUTHORITY_SECRET` and `BACKEND_SIGNER_SECRET` must never reach the
  browser. Every admin route and signer module is `import "server-only"`.
- The `onchain_deployments` base table has **RLS on with no policies** —
  service_role only. Public reads go through the `public_onchain_deployments`
  view, which exposes only `content_id, kind, status, is_active,
achievement_pda`. Raw pubkeys, signatures, and `track_collection_address` are
  never in the public surface.
- The console is for internal use. Do not expose it publicly without additional
  authentication in front of it.
