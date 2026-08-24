# Superteam Academy

A Solana-native learning platform. Learners enroll in courses, complete lessons,
and earn credentials that live on-chain: soulbound XP as Token-2022, course
certificates as Metaplex Core NFTs. Built by [Superteam Brazil](https://superteam.fun).

Open source, MIT. Currently running on **devnet**.

## How it fits together

Four moving parts, each with a clear job:

| Part                 | What it is                                        | Where                                                                     |
| -------------------- | ------------------------------------------------- | ------------------------------------------------------------------------- |
| **Web app**          | Next.js 15 App Router on Vercel                   | `apps/web/`                                                               |
| **On-chain program** | Pinocchio (Rust), 18 instructions, 6 PDA types    | `onchain-academy/`                                                        |
| **Database**         | Supabase Postgres — 36 tables, RLS on all of them | `supabase/`                                                               |
| **Course content**   | A committed bundle, compiled from a separate repo | [`solanabr/academy-courses`](https://github.com/solanabr/academy-courses) |

On-chain state is the source of truth for XP balances, lesson completion (a
bitmap in the Enrollment PDA), and credentials. Supabase mirrors it for fast
queries, streaks, and leaderboards; mirror writes are non-fatal and rebuildable.

**There is no CMS.** Content is authored in git, compiled ahead of time by
`compile-content.ts`, and committed to this repo as typed JSON pinned to one
`academy-courses` commit (`apps/web/content.lock`). Nothing fetches content at
runtime, and no credential in the app can mutate it — publishing is a pull
request.

## What learners get

- **Soulbound XP** — Token-2022 with NonTransferable + PermanentDelegate. Minted
  by CPI on lesson completion; cannot be transferred or self-burned.
- **Credential NFTs** — Metaplex Core, frozen to the learner's wallet via
  PermanentFreezeDelegate, one collection per course track.
- **Interactive lessons** — a lesson is an ordered `blocks[]` page builder:
  prose, video, Monaco code challenges, quizzes, reflections, and Solana widgets
  (devnet airdrop, IDL program explorer, deployed-program card).
- **Rust/Anchor compilation** — `buildable` challenges and in-browser program
  deploys go through a Rust/Axum build server on Cloud Run.
- **AI lesson assistant** — Gemini-backed, with per-day spend caps enforced by a
  Postgres ledger.
- **Gamification** — 18 achievements (a course-agnostic ladder plus one course
  badge), 5 daily/multi-day quests, streaks, leagues, referrals, and a
  leaderboard. Level is `floor(sqrt(totalXP / 100))`.
- **Community forum** — threads, answers, voting, accepted answers, flags, and
  XP for participation with a daily cap.
- **Three languages** — English, Portuguese (pt-BR), Spanish.

## Getting it running

### Prerequisites

- Node.js >= 18 and pnpm 10 (the repo pins `packageManager`)
- A Supabase project (free tier is fine)
- For on-chain work: Rust, the Solana CLI, and `cargo build-sbf`. No Anchor CLI —
  the program is Pinocchio.

### Quickstart

```bash
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy
pnpm install

# Environment: copy the template and fill in real values.
cp .env.example apps/web/.env.local

# Database: migrations are the source of truth.
supabase link --project-ref <your-project-ref>
supabase db push

pnpm dev
```

Open <http://localhost:3000>.

The minimum to boot is `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `NEXT_PUBLIC_SOLANA_RPC_URL`, and `SOLANA_RPC_URL`.
On-chain features additionally need `NEXT_PUBLIC_PROGRAM_ID`,
`NEXT_PUBLIC_XP_MINT_ADDRESS`, `PROGRAM_AUTHORITY_SECRET`, and
`BACKEND_SIGNER_SECRET` — see [docs/DEPLOY-PROGRAM.md](docs/DEPLOY-PROGRAM.md).

The **authoritative, annotated env-var list** — every variable, what it does, and
what happens when it is unset — is the `## Environment Variables` block in
[`apps/web/CLAUDE.md`](apps/web/CLAUDE.md). `.env.example` is the copyable
template; treat CLAUDE.md as the explanation.

> **Nothing shows up on a fresh project.** Course visibility is gated on the
> Supabase `onchain_deployments` table (`status = "synced"` and active), which
> starts empty. Deploy courses from `/en/admin` — see [docs/ADMIN.md](docs/ADMIN.md).

Course content is already in the repo (`apps/web/src/content/generated/`) — there
is nothing to import. To rebuild it after bumping the pin:
`pnpm --filter web compile-content`.

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
│   ├── web/                      Next.js 15 app
│   │   ├── src/app/[locale]/     pages — (marketing), (platform), admin
│   │   ├── src/app/api/          72 API routes
│   │   ├── src/lib/              content, solana, auth, gamification, ai, helius…
│   │   ├── src/content/generated/  COMMITTED content bundle — never hand-edit
│   │   ├── src/messages/         en / pt-BR / es
│   │   └── content.lock          the academy-courses commit the bundle is pinned to
│   └── build-server/             Rust/Axum program compiler (Cloud Run)
├── onchain-academy/              Pinocchio program workspace + IDL + tests
├── packages/
│   ├── types/                    shared TypeScript interfaces
│   ├── content-schema/           Zod schemas for the content standard
│   ├── content-lint/             content linter — runs in academy-courses CI
│   ├── challenge-executor/       sandboxed challenge runner (QuickJS)
│   ├── deploy/                   browser-side Solana program deployment
│   └── config/                   shared ESLint / TS / Tailwind configs
├── supabase/                     migrations (source of truth) + schema snapshot
├── scripts/                      operator scripts
└── docs/                         the guides below
```

## Signing in

Three ways in, all of which end at a **server-set Supabase cookie session** —
nothing mints a session client-side:

- **SIWS with an external wallet** — the wallet signs a nonce; `/api/auth/wallet`
  verifies it. Always available; the guaranteed path.
- **Dynamic embedded wallets** — Google handshake and embedded-wallet ownership
  proven by Dynamic, exchanged at `/api/auth/dynamic`. Optional: unset
  `NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID` and it is simply off.
- **Supabase OAuth (Google / GitHub)** — the fallback and kill switch, via
  `/api/auth/callback`.

The full map, including the post-login rituals every rail must share, is
[docs/AUTH-FLOWS.md](docs/AUTH-FLOWS.md).

## On-chain program

Built with Pinocchio 0.11 (`#![no_std]`, `cargo build-sbf`). The Anchor
implementation it was ported from has been deleted — there is no `Anchor.toml`
and no Anchor CLI in the toolchain. The committed IDL at
`onchain-academy/idl/onchain_academy.json` is still Anchor IDL format, because
that is the wire contract every client decodes against.

- **18 instructions**, dispatched on the 8-byte `sha256("global:<name>")`
  sighash: initialize, config, course CRUD, enroll, complete lesson, finalize,
  credentials, minter roles, XP rewards, achievements.
- **6 PDA types**: Config, Course, Enrollment, MinterRole, AchievementType,
  AchievementReceipt.
- 37 program errors (6000+) and 18 events, emitted byte-identically to Anchor's
  `emit!` so existing indexers keep working.

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

`/{locale}/admin`, four screens: **Courses** (publish pin, on-chain deploy,
supporting content), **Moderation**, **Insights**, **Status**.

Access is your ordinary Supabase session checked against an `admin_users`
allowlist that only the service role can read. There is no admin password and no
login form — signed-in non-admins get a 404. See [docs/ADMIN.md](docs/ADMIN.md).

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

## Contributing

Branch, commit conventionally, open a PR:

```bash
git checkout -b feat/your-thing
git commit -m "feat: add quiz lesson type"
```

House rules that CI actually enforces: TypeScript strict with no `any`, all UI
strings through next-intl, server components by default, ESLint + Prettier on a
pre-commit hook, and a byte-comparison of the committed content bundle against a
fresh recompile.

## License

MIT.

Thanks to [Superteam Brazil](https://superteam.fun) and the
[Solana Foundation](https://solana.org).
