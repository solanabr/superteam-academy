<div align="center">
  <h1>Superteam Academy</h1>
  <p><strong>A Solana-native learning platform with on-chain credentials.</strong></p>
  <p>Learners enroll in courses, complete lessons, and earn credentials that live on-chain:<br />soulbound XP as Token-2022, course certificates as Metaplex Core NFTs.</p>
  <p>Built by <a href="https://superteam.fun">Superteam Brazil</a> &bull; MIT &bull; currently running on <strong>devnet</strong></p>

  <p>
    <a href="#how-it-fits-together">Architecture</a> &bull;
    <a href="#what-learners-get">Features</a> &bull;
    <a href="#tech-stack">Tech Stack</a> &bull;
    <a href="#getting-it-running">Quickstart</a> &bull;
    <a href="#environment-variables">Environment</a> &bull;
    <a href="#documentation">Docs</a>
  </p>
</div>

---

## How it fits together

Four moving parts, each with a clear job:

| Part                 | What it is                                        | Where                                                                     |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| **Web app**          | Next.js 15 App Router on Vercel                   | `apps/web/`                                                               |
| **On-chain program** | Pinocchio (Rust), 18 instructions, 6 PDA types    | `onchain-academy/`                                                        |
| **Database**         | Supabase Postgres — 36 tables, RLS on all of them | `supabase/`                                                               |
| **Course content**   | A committed bundle, compiled from a separate repo | [`solanabr/academy-courses`](https://github.com/solanabr/academy-courses) |

```
                      ┌──────────────────────────────┐
   learner's wallet ──│  Browser                     │
   (SIWS / embedded)  │  React · Monaco · QuickJS    │
                      └───────────────┬──────────────┘
                                      │
                      ┌───────────────▼──────────────┐
                      │  Next.js 15 (Vercel)         │
                      │  server components           │
                      │  72 API routes               │
                      │  ┌────────────────────────┐  │
                      │  │ committed content      │  │
                      │  │ bundle — no CMS        │  │
                      │  └────────────────────────┘  │
                      └───┬──────────┬───────────┬───┘
                          │          │           │
                 ┌────────▼──┐  ┌────▼─────┐  ┌──▼──────────┐
                 │ Supabase  │  │  Solana  │  │ Build server│
                 │ DB + Auth │  │  devnet  │  │  Cloud Run  │
                 └───────────┘  └────┬─────┘  └─────────────┘
                       ▲             │
                       └─────────────┘
                    Helius webhook replays
                    on-chain events into the mirror
```

Two invariants shape everything:

- **On-chain is the source of truth** for XP balances, lesson completion (a bitmap
  in the Enrollment PDA), and credentials. Supabase mirrors it for fast queries,
  streaks, and leaderboards; mirror writes are non-fatal and rebuildable.
- **There is no CMS.** Content is authored in git, compiled ahead of time by
  `compile-content.ts`, and committed to this repo as typed JSON pinned to one
  `academy-courses` commit (`apps/web/content.lock`). Nothing fetches content at
  runtime, and no credential in the app can mutate it — publishing is a pull
  request.

## What learners get

**On-chain credentials**

- **Soulbound XP** — Token-2022 with NonTransferable + PermanentDelegate. Minted
  by CPI on lesson completion; cannot be transferred or self-burned.
- **Credential NFTs** — Metaplex Core, frozen to the learner's wallet via
  PermanentFreezeDelegate, one collection per course track.
- **On-chain lesson tracking** — a 256-bit bitmap in the Enrollment PDA, one bit
  per lesson slot.

**Interactive learning**

- A lesson is an ordered `blocks[]` page builder: prose, video, Monaco code
  challenges, quizzes, reflections, and Solana widgets (devnet airdrop, IDL
  program explorer, deployed-program card).
- `buildable` Rust/Anchor challenges and in-browser program deploys compile
  through a Rust/Axum build server on Cloud Run.
- An AI lesson assistant (Gemini-backed) with per-day spend caps enforced by a
  Postgres ledger.

**Gamification**

- 18 achievements — a course-agnostic ladder plus one course badge — with unlock
  rules declared in content, not code.
- 5 daily/multi-day quests, streaks with freezes, leagues, referrals, and a
  leaderboard (all-time, weekly, monthly, cohort).
- Level is `floor(sqrt(totalXP / 100))`. Reward popups are queued and capped at
  three cards per moment.

**Community and platform**

- Forum threads, answers, voting, accepted answers, a flag queue, and XP for
  participation with a daily cap.
- Three languages: English, Portuguese (pt-BR), Spanish.
- Dark/light mode on the "ink" visual system.
- An admin console for publishing content pins, deploying courses on-chain,
  moderation, and insights.

## Tech stack

| Layer            | Technology                                                            |
| ---------------- | --------------------------------------------------------------------- |
| Frontend         | Next.js 15 (App Router), React 18, Tailwind CSS, shadcn/ui + Radix UI |
| Content          | Committed bundle compiled from the `academy-courses` git repo         |
| Database / Auth  | Supabase (Postgres, RLS, Auth)                                        |
| On-chain program | Solana, Pinocchio 0.11 (Rust, `cargo build-sbf`)                      |
| XP tokens        | Token-2022 (NonTransferable + PermanentDelegate)                      |
| Credential NFTs  | Metaplex Core (soulbound via PermanentFreezeDelegate)                 |
| Auth             | SIWS + Dynamic embedded wallets + Supabase OAuth (Google, GitHub)     |
| i18n             | next-intl (EN, PT-BR, ES)                                             |
| Code editor      | Monaco Editor, QuickJS sandbox for the challenge runner               |
| Build server     | Rust/Axum on GCP Cloud Run                                            |
| AI assistant     | Gemini over raw REST, spend-metered in Postgres                       |
| RPC / indexing   | Helius (DAS API, webhooks)                                            |
| Storage          | Arweave via Irys (permanent credential metadata)                      |
| Analytics        | GA4, PostHog, Sentry (all optional)                                   |
| Monorepo         | Turborepo + pnpm 10                                                   |
| Deployment       | Vercel (web) + GCP Cloud Run (build server)                           |

## Getting it running

### Prerequisites

- [Node.js](https://nodejs.org) >= 18 and [pnpm](https://pnpm.io) 10 (the repo
  pins `packageManager`)
- A [Supabase](https://supabase.com) project (free tier is fine)
- A Solana wallet ([Phantom](https://phantom.app) works)

For on-chain work you also need [Rust](https://rustup.rs), the
[Solana CLI](https://docs.solanalabs.com/cli/install), and `cargo build-sbf`.
**No Anchor CLI** — the program is Pinocchio.

### Quickstart

```bash
# 1. Clone and install
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy
pnpm install

# 2. Configure the environment
cp .env.example apps/web/.env.local
# .env.example holds illustrative defaults, not working credentials — replace
# every placeholder. Minimum to boot: NEXT_PUBLIC_SUPABASE_URL,
# NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY,
# NEXT_PUBLIC_SOLANA_RPC_URL, SOLANA_RPC_URL.

# 3. Set up the database — migrations are the source of truth
supabase link --project-ref <your-project-ref>
supabase db push        # applies supabase/migrations/ in order
# supabase/schema.sql is a generated snapshot for diffing — never run it directly.

# 4. Content — nothing to import.
# The bundle is already committed at apps/web/src/content/generated/.
# To rebuild it after bumping the pin:
#   pnpm --filter web compile-content

# 5. Start the dev server
pnpm dev
```

Open <http://localhost:3000>.

> **Nothing shows up on a fresh project.** Course visibility is gated on the
> Supabase `onchain_deployments` table (`status = "synced"` and active), which
> starts empty. Deploy courses from `/en/admin` — see [docs/ADMIN.md](docs/ADMIN.md).

Full on-chain features additionally need `NEXT_PUBLIC_PROGRAM_ID`,
`NEXT_PUBLIC_XP_MINT_ADDRESS`, `PROGRAM_AUTHORITY_SECRET`, and
`BACKEND_SIGNER_SECRET` — see [docs/DEPLOY-PROGRAM.md](docs/DEPLOY-PROGRAM.md)
for the deploy-and-initialize workflow.

### Commands

```bash
pnpm dev          # Next.js dev server
pnpm build        # production build (Turborepo)
pnpm lint         # ESLint
pnpm typecheck    # tsc
pnpm format       # Prettier
```

## Repository map

```
superteam-academy/
├── apps/
│   ├── web/                      # Next.js 15 app
│   │   ├── src/app/[locale]/     #   pages — (marketing), (platform), admin
│   │   ├── src/app/api/          #   72 API routes
│   │   ├── src/lib/              #   content, solana, auth, gamification, ai, helius…
│   │   ├── src/content/generated/#   COMMITTED content bundle — never hand-edit
│   │   ├── src/messages/         #   i18n catalogs (en, pt-BR, es)
│   │   ├── scripts/              #   compile-content.ts (content repo → bundle)
│   │   └── content.lock          #   the academy-courses commit the bundle is pinned to
│   └── build-server/             # Rust/Axum program compiler (Cloud Run)
├── onchain-academy/              # Pinocchio program workspace + IDL + tests
├── packages/
│   ├── types/                    # shared TypeScript interfaces
│   ├── content-schema/           # Zod schemas for the content standard
│   ├── content-lint/             # content linter — runs in academy-courses CI
│   ├── challenge-executor/       # sandboxed challenge runner (QuickJS)
│   ├── deploy/                   # browser-side Solana program deployment
│   └── config/                   # shared ESLint / TS / Tailwind configs
├── supabase/                     # migrations (source of truth) + schema snapshot
├── scripts/                      # operator scripts
├── wallets/                      # keypairs (gitignored)
└── docs/                         # the guides listed below
```

Course **content** lives in a separate repo:
[`solanabr/academy-courses`](https://github.com/solanabr/academy-courses).

## Environment variables

Copy `.env.example` to `apps/web/.env.local` and fill in values. Required
variables are validated at boot — a missing one fails loudly rather than
degrading silently.

> **The authoritative, annotated list** — every variable, what it does, and what
> happens when it is unset — is the `## Environment Variables` block in
> [`apps/web/CLAUDE.md`](apps/web/CLAUDE.md). The tables below are the shape of
> it, not a replacement.

### Required

| Variable                        | Scope      | Description                                                                               |
| ------------------------------- | ---------- | ----------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SUPABASE_URL`      | Client     | Supabase project URL                                                                      |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client     | Public anon key (safe for the browser)                                                    |
| `SUPABASE_SERVICE_ROLE_KEY`     | **Server** | Service role key. Never exposed to the browser; also gates admin auth                     |
| `NEXT_PUBLIC_SOLANA_RPC_URL`    | Client     | Browser RPC. Must carry **no** privileged key, or a domain-restricted Helius key          |
| `SOLANA_RPC_URL`                | **Server** | Server RPC — **this** is the one that may carry an unrestricted Helius key                |
| `NEXT_PUBLIC_APP_URL`           | Client     | Base URL for sitemap, OG tags, and NFT metadata URIs. A production build fails without it |

### On-chain features

| Variable                      | Scope      | Description                                                                   |
| ----------------------------- | ---------- | ----------------------------------------------------------------------------- |
| `NEXT_PUBLIC_PROGRAM_ID`      | Client     | Deployed program id                                                           |
| `NEXT_PUBLIC_XP_MINT_ADDRESS` | Client     | XP mint pubkey, from the `initialize` output                                  |
| `NEXT_PUBLIC_SOLANA_NETWORK`  | Client     | Network name (`devnet`)                                                       |
| `PROGRAM_AUTHORITY_SECRET`    | **Server** | Authority keypair (JSON array of 64 bytes) — the one that signed `initialize` |
| `BACKEND_SIGNER_SECRET`       | **Server** | Rotatable backend co-signer. On devnet, the same as the authority             |
| `XP_MINT_AUTHORITY_SECRET`    | **Server** | XP mint authority. Omit to disable XP minting                                 |

There is **no admin password**. Admin access is the caller's Supabase session
checked against the `admin_users` allowlist; the old `ADMIN_SECRET` is retired.

### Optional — each one switches a feature on

| Set these for…           | Variables                                                                                                         |
| ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| Helius event ingestion   | `HELIUS_API_KEY`, `HELIUS_WEBHOOK_SECRET`                                                                         |
| The admin publish card   | `GITHUB_TOKEN` — **read scope only**; unset ⇒ that card 503s                                                      |
| Rust builds and deploys  | `BUILD_SERVER_URL`, `BUILD_SERVER_API_KEY`, `RUST_PLAYGROUND_URL`                                                 |
| The AI lesson assistant  | `GEMINI_API_KEY`, `AI_PARTNER_SEAL_SECRET`, the `AI_SPEND_*` caps, the `AI_MODEL_*` overrides                     |
| Embedded wallets         | `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`                                                                              |
| Permanent credentials    | `ARWEAVE_UPLOADER_SECRET` — a **Solana** keypair funding Irys, not an Arweave JWK                                 |
| Outbound email + cron    | `RESEND_API_KEY`, `EMAIL_FROM`, `CRON_SECRET` — fail-closed: unset means nothing is sent                          |
| Moderation notifications | `MODERATION_WEBHOOK_URL`                                                                                          |
| Teacher course preview   | `TEACH_PREVIEW_PASSWORD` — unset disables the preview                                                             |
| Analytics                | `NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `NEXT_PUBLIC_SENTRY_DSN` |

> `NEXT_PUBLIC_*` values are inlined at **build** time. Changing one requires a
> redeploy with "Use existing Build Cache" disabled — a cache-reusing redeploy
> keeps the old value baked into the served chunks.

## Signing in

Three ways in, all of which end at a **server-set Supabase cookie session** —
nothing mints a session client-side:

| Rail                         | What proves the user                                   | Exchanged at         | Optional?                                        |
| ---------------------------- | ------------------------------------------------------ | -------------------- | ------------------------------------------------ |
| **SIWS, external wallet**    | The wallet signs a server-issued nonce                 | `/api/auth/wallet`   | No — the guaranteed path and the kill switch     |
| **Dynamic embedded wallets** | Dynamic proves the Google handshake + wallet ownership | `/api/auth/dynamic`  | Yes — unset `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` |
| **Supabase OAuth**           | Google or GitHub, through Supabase Auth                | `/api/auth/callback` | Yes — the fallback rail                          |

The full map, including the post-login rituals every rail must share, is
[docs/AUTH-FLOWS.md](docs/AUTH-FLOWS.md).

## On-chain program

Built with Pinocchio 0.11 (`#![no_std]`, `cargo build-sbf`). The Anchor
implementation it was ported from has been deleted — there is no `Anchor.toml`
and no Anchor CLI in the toolchain. The committed IDL at
`onchain-academy/idl/onchain_academy.json` is still Anchor IDL format, because
that is the wire contract every client decodes against.

| Surface      | Count | Detail                                                                          |
| ------------ | ----- | ------------------------------------------------------------------------------- |
| Instructions | 18    | dispatched on the 8-byte `sha256("global:<name>")` sighash                      |
| PDA types    | 6     | Config, Course, Enrollment, MinterRole, AchievementType, AchievementReceipt     |
| Errors       | 37    | 6000+, mapped back to i18n keys client-side                                     |
| Events       | 18    | emitted byte-identically to Anchor's `emit!`, so existing indexers keep working |

The instruction set covers the whole learning lifecycle: initialize and config,
course CRUD, enroll and close enrollment, complete lesson, finalize course, issue
and upgrade credential, register/update/revoke minter, reward XP, and the
achievement type/award pair.

The program id is baked at compile time in two flavors. The default build carries
the upstream id `7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V` (what the IDL
declares); `--features fresh-id` carries
`Dsro2Cd9Mhgk8L71imh3LLPwYU5PU8hvBY5HEcPrcx5u`, the self-owned devnet instance
that is actually deployed and initialized. Clients read the id from
`NEXT_PUBLIC_PROGRAM_ID` and throw if it is unset.

Byte-level layouts, validation order, and every invariant:
[docs/SPEC.md](docs/SPEC.md). Deploying your own instance:
[docs/DEPLOY-PROGRAM.md](docs/DEPLOY-PROGRAM.md).

## Admin console

**URL**: `/{locale}/admin` (e.g. `/en/admin`)
**Auth**: your ordinary Supabase session, checked against an `admin_users`
allowlist that only the service role can read. There is no admin password and no
login form — signed-in non-admins get a 404.

| Screen         | What it does                                                                                                                         |
| -------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Courses**    | The content pin vs `academy-courses` HEAD, a prefilled publish PR link, on-chain course/achievement deploys, and activate/deactivate |
| **Moderation** | The pending community-flag queue                                                                                                     |
| **Insights**   | Platform-behaviour aggregates — AI-tutor usage, spend, lesson funnel                                                                 |
| **Status**     | Program liveness, authority match, deploy counts, and on-chain → Supabase resync                                                     |

Publishing is a **pull request** — the console holds no write token and cannot
mutate content. Deploys are recorded in `onchain_deployments`, which **is** the
learner-visibility gate. See [docs/ADMIN.md](docs/ADMIN.md).

## Documentation

| Doc                                                   | What it covers                                           |
| ----------------------------------------------------- | -------------------------------------------------------- |
| [ARCHITECTURE.md](docs/ARCHITECTURE.md)               | System design, data flows, service interfaces, DB schema |
| [AUTH-FLOWS.md](docs/AUTH-FLOWS.md)                   | Every way into a session, mapped from the code           |
| [SPEC.md](docs/SPEC.md)                               | Authoritative on-chain program specification             |
| [DEPLOYMENT.md](docs/DEPLOYMENT.md)                   | Vercel, Supabase, Cloud Run, cron, analytics             |
| [DEPLOY-PROGRAM.md](docs/DEPLOY-PROGRAM.md)           | Build, deploy, and initialize the program on devnet      |
| [ADMIN.md](docs/ADMIN.md)                             | The admin console, screen by screen                      |
| [CUSTOMIZATION.md](docs/CUSTOMIZATION.md)             | Theming, i18n, extending content and gamification        |
| [PINOCCHIO-MIGRATION.md](docs/PINOCCHIO-MIGRATION.md) | What changed in the Anchor → Pinocchio port              |
| [DB-MIGRATION-LEDGER.md](docs/DB-MIGRATION-LEDGER.md) | Filename ↔ prod migration-ledger reconciliation          |
| [CLAUDE.md](CLAUDE.md)                                | Codebase conventions, security model, env-var reference  |

## Contributing

Branch, commit conventionally, open a PR:

```bash
git checkout -b feat/your-thing
git commit -m "feat: add quiz lesson type"
```

House rules that CI actually enforces:

- TypeScript strict, zero `any`
- All UI strings through next-intl — never hardcoded in components
- Server components by default; client components only where needed
- ESLint + Prettier on a pre-commit hook
- A byte-comparison of the committed content bundle against a fresh recompile

## License

MIT.

Thanks to [Superteam Brazil](https://superteam.fun) and the
[Solana Foundation](https://solana.org).
