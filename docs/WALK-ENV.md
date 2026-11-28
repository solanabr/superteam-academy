# Walk environment

A local stack for browser walks of unmerged branches: a local Supabase, the app
on its own port, and a stub for the build server. The tooling is in
`apps/web/walk/`.

## Rules

- A walk never uses production: no production database, no production key, no
  mainnet. The walk stack is local and the chain is public devnet.
- A walk never uses the owner's env file. `walk dev` refuses to start when
  `apps/web` has `.env`, `.env.local`, `.env.development` or
  `.env.development.local` (a file or a link), because Next.js loads those by
  itself. Run walks from a git worktree, which has none of them.
- Put only test data in the walk stack. It uses the Supabase CLI's local demo
  keys, like every local Supabase stack.
- Stop the stack when the walk is done.

## Commands

Docker must be running (`colima start` with colima). Run `pnpm install` once in
the worktree.

```bash
pnpm --filter web walk up        # start Supabase, apply migrations, seed, write .env.walk
pnpm --filter web walk dev       # start the app and the build stub (Ctrl-C stops both)
pnpm --filter web walk smoke     # in a second terminal: check the walk app in a browser
pnpm --filter web walk session learner   # or admin: save a signed-in browser session
pnpm --filter web walk status    # is the stack up?
pnpm --filter web walk down      # stop the stack, keep its data
pnpm --filter web walk wipe      # stop the stack, delete its data and the generated files
```

`walk up` is safe to run again. It starts the stack when it is stopped, applies
the migrations the branch added, and seeds again. The first run pulls the
Postgres 15, auth, REST, gateway and storage images. The first page load in
`walk dev` compiles the page and can take a minute or more.

`walk seed`, `walk env` and `walk stub` run one step of the above alone.

## Ports

| What                  | Address                            |
| --------------------- | ---------------------------------- |
| App (`next dev`)      | `http://localhost:3210`            |
| Build stub            | `http://127.0.0.1:3211`            |
| Supabase API          | `http://127.0.0.1:55421`           |
| Postgres              | `127.0.0.1:55422`                  |
| Reserved, not started | `55420`, `55423`, `55424`, `55429` |

The Supabase project id is `academy-walk`. The id and the ports are different
from `supabase/config.toml` and from the Supabase defaults (5432x), so the walk
stack can run next to another local Supabase stack.

## Generated files

All are git-ignored. `walk wipe` deletes them.

- `apps/web/.walk/supabase/`: a copy of `supabase/config.toml` with the walk
  project id, ports and app URL, and a copy of `supabase/migrations/*.sql`. The
  repo's files are not changed.
- `apps/web/.env.walk`: the local Supabase URL and keys read from the running
  stack, public devnet RPC, the devnet program id, the deploy flag on, and the
  build stub's URL. The signer keypairs and the local secrets are made new on
  each `walk env`. The model, Sentry, PostHog, GA, Dynamic, Helius, email and
  GitHub values are blank, so the app reports to nobody.
- `apps/web/.walk/session-<role>.json`: a saved browser session.

`walk dev` passes only `.env.walk` and a few shell basics (`PATH`, `HOME`,
locale) to the app. A key exported in your shell does not reach it.

## Seed data

`walk seed` writes through the local service role only.

| User                       | Username       | Rows                                                                                                                 |
| -------------------------- | -------------- | -------------------------------------------------------------------------------------------------------------------- |
| `test-learner@example.com` | `test-learner` | A profile with a wallet address nobody holds the key for, and an `enrollments` row for `course-btc-to-sol-evolution` |
| `test-admin@example.com`   | `test-admin`   | A row in `admin_users`                                                                                               |

It also marks the course `btc-to-sol-evolution` as synced and active in
`onchain_deployments`. Without that row the course is hidden. Other courses stay
hidden until you add a row for them.

The pilot lesson is
`http://localhost:3210/en/courses/btc-to-sol-evolution/lessons/your-first-solana-program`.

## Signing in

Wallet, Google, GitHub and Dynamic sign-in do not work locally. `walk session`
signs the test user in with email and password against the local auth API and
saves the session as a Playwright storage state file. The password is derived
from the local stack's key and is never stored or printed.

The app reads the session from a cookie on the app origin. For the walk stack
its name is `sb-127-auth-token` and its value is `base64-` plus the base64url
of the session JSON. `@supabase/ssr` splits a long value into
`sb-127-auth-token.0`, `.1`. The script lets `@supabase/ssr` write the cookies,
so the format is the one the app reads.

```js
import { chromium } from "@playwright/test";

const browser = await chromium.launch();
const context = await browser.newContext({
  storageState: "apps/web/.walk/session-learner.json",
});
const page = await context.newPage();
await page.goto("http://localhost:3210/en/dashboard");
```

Or import `sessionCookies(role)` from `apps/web/walk/session.mjs` and pass the
result to `context.addCookies()`. `apps/web/walk/smoke.mjs` is a full example.
The access token lasts one hour. Run `walk session` again for a new one.

## Build stub

The stub answers `GET /health` and `POST /build` in the shape of
`docs/ARCHITECTURE.md` section 11. It compiles nothing. Every build fails. Put a
marker in the editor, above the verification harness, to pick the diagnostics:

| Marker in the code | Diagnostics                                                 |
| ------------------ | ----------------------------------------------------------- |
| none               | One error and one warning in `/src/lib.rs`                  |
| `// walk:verify`   | One error in the hidden verification file `/src/_verify.rs` |
| `// walk:both`     | The `lib.rs` error and warning, and the hidden-file error   |
| `// walk:none`     | A failed build with an empty `diagnostics` list             |

Add `// walk:slow` next to any of them to hold the answer for 15 seconds, so the
editor's in-flight state can be seen.

## What does not work in a walk

- On-chain writes (enroll, complete a lesson, mint XP or a credential, deploy a
  course). The signers in `.env.walk` are throwaway keypairs with no SOL and are
  not the program's signers. The seeded enrollment exists in the database only.
- A successful build, and so the in-lesson deploy. The stub only fails.
- The AI tutor, email, analytics and error reporting. Their keys are blank.
- Realtime updates. The realtime service is not started.

## For another session

The stack is one per machine: one project id and one set of ports. Run
`walk status` first. When the stack is up, another walk is in progress or was
not stopped.

- To use the running stack from your worktree, run `walk up`. It reuses the
  stack and writes your own `.env.walk`.
- When your branch has a different set of migrations, `walk up` stops with a
  message. Run `walk wipe`, then `walk up`. This deletes the other walk's data,
  so do it only when no other walk is in progress.
- Only one `walk dev` can run at a time, because the app port is fixed.

## Migrations on the local stack

All migrations in `supabase/migrations` apply without a change. The storage
service must be on: the baseline migration writes to `storage.buckets`, which
the storage service creates. With storage off, `supabase start` fails at
`20260624163347_baseline.sql` with `relation "storage.buckets" does not exist`.
