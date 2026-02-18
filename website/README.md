# Superteam Academy — Web App

Next.js frontend for the Superteam Academy LMS (Solana). See repo root `docs/IMPLEMENTATION_PLAN_WEBSITE.md` for the full build plan.

## Setup

```bash
pnpm install   # or: npm install
cp .env.example .env   # then fill in env vars
pnpm dev       # or: npm run dev
```

## Scripts

- `pnpm dev` / `npm run dev` — start dev server
- `pnpm build` / `npm run build` — production build
- `pnpm start` / `npm start` — start production server

## Logo

Placeholder and branding assets live in `public/logo/`:

- **`logo-horizontal.svg`** — used in the header (horizontal “Superteam Academy” text). Replace with the official Superteam Brazil horizontal logo from `design_assets/superteam brazil assets/Logo/` when available (e.g. `HORIZONTAL/SVG/ST-EMERALD-GREEN-HORIZONTAL.svg` for dark backgrounds, or Off-White variant).
- For footer or other contexts, add `logo-vertical.svg` or other variants and reference them from the layout/footer components.

Copy from the design kit:

```bash
# From repo root, if design_assets is present:
cp "design_assets/superteam brazil assets/Logo/HORIZONTAL/SVG/ST-EMERALD-GREEN-HORIZONTAL.svg" app/public/logo/logo-horizontal.svg
```

## Env (see `.env.example`)

- **Supabase (reference_demo_project style):** `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (client/server), `SUPABASE_SERVICE_KEY` (server-only, elevated access). From Project Settings → API Keys (anon key + service_role key).
- **`DATABASE_URL`** — Postgres for Prisma. Easiest when **SSL enforcement is OFF** (Database → Settings → SSL Configuration): use **Direct** URI with `?sslmode=disable`, e.g. `postgresql://postgres:PASSWORD@db.PROJECT_REF.supabase.co:5432/postgres?sslmode=disable`. Copy the exact URI from Dashboard → **Connect** → **Direct connection** and replace the password.
- **Privy:** `NEXT_PUBLIC_PRIVY_APP_ID`, `PRIVY_APP_SECRET` (server-only). From [Privy Dashboard](https://dashboard.privy.io). If the app ID is unset, the app uses a test ID so build succeeds; set your own for production.
- **Sanity (Phase 2):** `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`. Create a project at [sanity.io](https://sanity.io), then add these to `.env`. Optional: `NEXT_PUBLIC_SANITY_API_VERSION` (default `2026-02-16`).
  - **Server-only write token:** `SANITY_API_TOKEN` (Editor role) is required for course creation/editing/publishing from the app’s API routes.
  - **In-app course management:** Professors/admins manage content from `/teach/courses` (no need to use `/studio` in normal flow). Only **published** courses appear on `/courses`.

### Privy (auth)

- **Dashboard:** In [Privy Dashboard](https://dashboard.privy.io) → **Authentication** → **Login methods**, enable **Email**, **Google**, and **GitHub**. Wallet login is enabled by default for Solana.
- **Phantom redirect:** The app configures Solana connectors (`toSolanaWalletConnectors`) and a `walletList` so Phantom (and other extensions) connect in-app instead of opening the install page. If Phantom still opens the install page, ensure the extension is installed and refresh.
- **Embedded wallet:** If a user logs in with **email**, **Google**, or **GitHub** and does **not** connect an external wallet, Privy automatically creates a **Solana embedded wallet** for them (`createOnLogin: 'users-without-wallets'`). So every logged-in user has a wallet address (either linked or embedded).
- **Email verification:** Privy’s email login uses a **one-time code (OTP)** sent to the user’s email; there is no option to skip this. To avoid any email step, use only Google or GitHub in the Dashboard.

#### GitHub OAuth: "redirect_uri is not associated with this application"

If you see this error when clicking **Connect with GitHub**, the **Authorization callback URL** in your [GitHub OAuth App](https://github.com/settings/developers) is wrong. GitHub must redirect to **Privy’s** callback, not your app.

1. In GitHub: **Settings → Developer settings → OAuth Apps** → your app (e.g. “superteam academy”).
2. Set **Authorization callback URL** to exactly:
   ```text
   https://auth.privy.io/api/v1/oauth/callback
   ```
   (Do **not** use `http://localhost:3000/dashboard` or any app URL here.)
3. **Homepage URL** can stay as your app (e.g. `http://localhost:3000` for local dev).
4. Save (Update application).

Privy’s docs: [Configure login methods](https://docs.privy.io/basics/get-started/dashboard/configure-login-methods) — “For all providers, during setup, specify Privy’s OAuth callback endpoint as your redirect URI: `https://auth.privy.io/api/v1/oauth/callback`.”

**First-time DB setup:** `pnpm prisma migrate dev` (creates tables using `DATABASE_URL`).

## Project structure and dependencies

- **`app/`** — Project root for this Next.js app (config, package.json, .env, prisma, public). Not the same as the App Router.
- **`app/src/`** — Next.js source: `src/app/` = App Router (routes, layouts), `src/components/`, `src/lib/`, `src/messages/`, etc. So “app” at root = project folder; “app” under src = Next.js App Router. No duplication.
- **i18n:** Single config at **`app/i18n/request.ts`** (used by next-intl when the plugin is enabled in `next.config.ts`). Messages live in `src/messages/*.json`.
- **Dependencies:** Use **pnpm** from the `app/` directory (`pnpm install`, `pnpm add <pkg>`). pnpm uses a content-addressable **store** (global by default, or a local `.pnpm-store` if configured); **`node_modules`** in `app/` is the symlink tree into that store. To avoid “linked to different store” errors, use one store. This app is configured to use the global pnpm store only (see `app/.npmrc`: `store-dir=~/Library/pnpm/store`). You do not need a repo-level `.pnpm-store`; only `app/node_modules` holds symlinks for this project. If `.pnpm-store` exists at repo root, delete it and run `pnpm install` from `app/` so installs stay consistent.

## Tech

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS v4 (design tokens in `src/app/globals.css`)
- shadcn/ui (Button + `cn` util); **next-intl** prepared (`src/messages/*.json`, `i18n/request.ts`, `LocaleSwitcher`) but plugin disabled: Next 16 + Turbopack has a [known issue](https://github.com/amannn/next-intl/issues/740) resolving the config during prerender. Re-enable in `next.config.ts` when using Next 15 or when next-intl supports Next 16 Turbopack.
- Supabase + Prisma, Privy (Solana) (Phase 1+)
