# App Agent Instructions

## Current State

The app is a **scaffold** — infrastructure is wired but no application features exist yet. The single `/` route renders a shadcn component demo (`ComponentExample`). Priority is **feature completeness** before polish.

## Feature Status

### Done (Infrastructure)
- Wallet connection via Connector Kit (`@solana/connector`) with shadcn Dialog
- Providers: Solana Connector
- 16 shadcn UI primitives installed (radix-nova style, Phosphor icons)
- Tailwind v4 with oklch design tokens, dark mode support
- Zod env validation (`NEXT_PUBLIC_SOLANA_NETWORK`)
- Layout shell: header with logo + ConnectButton

### Not Started (Learner Features)
- Course catalog: browse/filter active courses (`program.account.course.all()`)
- Course detail page: lesson count, XP breakdown, difficulty, prerequisites
- Enrollment: learner signs `enroll` tx, prerequisite check
- Lesson progress: render `enrollment.lessonFlags` bitmap as progress bar
- XP balance: query Token-2022 ATA via `getTokenAccountBalance`
- Credentials: Helius DAS `getAssetsByOwner` filtered by track collection
- Achievements: display awarded achievements
- Learner dashboard: enrolled courses, XP, credentials, achievements
- Close enrollment / unenroll flow (24h cooldown for incomplete)

### Not Started (Admin Features — lower priority)
- Course management (create, update, deactivate)
- Minter management (register, revoke)
- Achievement management (create, deactivate)

## Stack

| Layer | Choice |
|-------|--------|
| Framework | Next.js 16 (App Router) |
| React | 19 |
| Styling | Tailwind v4 (CSS config, no JS config file) |
| Components | shadcn (radix-nova style) — add via `pnpm exec shadcn add <component>` |
| Icons | Phosphor (`@phosphor-icons/react`) |
| Wallet | Connector Kit (`@solana/connector`) |
| Solana | `@solana/kit` for RPC, transactions, signing |
| SDK | `@superteam/academy-sdk` (workspace package, Codama-generated) |
| Env | Zod validation in `lib/env.ts` |

## Rules

- **Commits** — Do not add `Co-authored-by`, "made with Cursor", or similar to commit messages.
- **shadcn only** for UI primitives — never hand-write a Dialog, Select, Button, etc. Run `pnpm exec shadcn add <component>` from the `app/` directory.
- **Tailwind only when required** — use shadcn component variants/props first, Tailwind for layout and composition. Avoid duplicating what shadcn already provides.
- **No `@solana/web3.js`** or `@solana/wallet-adapter-*` — use `@solana/kit` and Connector Kit.
- **No `process.env` directly** — use typed `env` export from `lib/env.ts`. Add new vars to the Zod schema.
- **Feature files go in `app/` routes** — use App Router conventions (`page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`).
- **Shared hooks in `lib/`** or `hooks/` — PDA derivation, account fetching, XP balance queries.
- **Remove demo files** (`component-example.tsx`, `example.tsx`) once real features replace them on the home page.
