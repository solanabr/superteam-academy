# Superteam Academy

Production-ready Solana LMS built for the Superteam Brazil grant.  
This monorepo contains:

- The Anchor on-chain program (`onchain-academy/`)
- The web application (`app/`) with API routes, gamification, editor, i18n, and wallet flows
- Backend service contracts (`backend/`) for clean on-chain/off-chain abstraction boundaries
- An optional isolated runner service for playground tasks (`runner/`)

## Monorepo Structure

```text
superteam-academy/
├── app/                    # Next.js 14+ frontend + server routes
├── backend/                # Backend contracts and integration boundaries
├── onchain-academy/        # Anchor program workspace
├── runner/                 # Optional remote runner service
├── docs/                   # Program docs (SPEC/INTEGRATION/ARCHITECTURE)
├── ARCHITECTURE.md         # App architecture and data flow
├── CMS_GUIDE.md            # CMS integration and content workflow
├── CUSTOMIZATION.md        # Theme/i18n/gamification extension guide
└── VERCEL.md               # Deployment checklist for Vercel
```

## Grant Scope Coverage

The app implements the LMS surface and integrations requested in the bounty:

- Interactive courses, lesson view, challenge/editor flows
- Wallet auth + multi-wallet adapter
- XP, level, streak, achievements, dashboard, leaderboard UX
- Devnet on-chain reads for XP and credentials
- Wallet-signed Devnet enrollment with explicit course and lesson gates
- Course-filtered leaderboard, profile radar/social links, downloadable certificate image
- i18n with PT-BR, ES, EN (plus extra locales)
- Light/dark theming and responsive UI

On-chain write paths intended for backend signing are abstracted through service interfaces and can be swapped to direct program integrations incrementally.

## Tech Stack

### Frontend / App
- Next.js 14 (App Router)
- React 18 + TypeScript (strict)
- Tailwind CSS + Radix/shadcn-style primitives
- NextAuth (wallet + OAuth providers)
- Prisma + PostgreSQL
- Monaco Editor
- next-intl

### On-chain / Solana
- Anchor 0.31+
- Rust 1.82+
- Token-2022 XP mint model
- Metaplex Core credential model
- Helius DAS for credentials/leaderboard indexing

## Local Development

### 1) Install dependencies

```bash
pnpm install
```

### 2) Configure app environment

```bash
cp app/.env.example app/.env.local
```

At minimum, set:

- `DATABASE_URL`
- `NEXTAUTH_URL`
- `NEXTAUTH_SECRET`

Recommended for devnet flows:

- `NEXT_PUBLIC_SOLANA_RPC_URL`
- `NEXT_PUBLIC_SUPERTEAM_ACADEMY_PROGRAM_ID`
- `NEXT_PUBLIC_XP_MINT_ADDRESS`
- `HELIUS_API_KEY`

### 3) Prepare database

```bash
pnpm -C app db:generate
pnpm -C app db:push
```

### 4) Run the app

```bash
pnpm -C app dev
```

Optional runner service:

```bash
pnpm -C runner dev
```

## Build and Test

```bash
pnpm -C app typecheck
pnpm -C app lint
pnpm -C app test
pnpm -C app build
```

E2E (optional):

```bash
pnpm -C app test:e2e
```

## On-Chain Program (Anchor)

Program workspace lives in `onchain-academy/`.

```bash
cd onchain-academy
yarn install
anchor build
anchor test
```

Current devnet addresses:

- Program: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- XP mint: `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`

See `docs/INTEGRATION.md` and `docs/SPEC.md` for PDA derivation, instructions, and account model details.

## Deployment

Primary deployment target is Vercel with `app` as project root.

Use the step-by-step checklist in [VERCEL.md](./VERCEL.md).

## Additional Documentation

- [ARCHITECTURE.md](./ARCHITECTURE.md)
- [CMS_GUIDE.md](./CMS_GUIDE.md)
- [CUSTOMIZATION.md](./CUSTOMIZATION.md)
- [docs/SPEC.md](./docs/SPEC.md)
- [docs/INTEGRATION.md](./docs/INTEGRATION.md)

## License

[MIT](./LICENSE)
