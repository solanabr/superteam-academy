# RECTOR Academy — Design Spec

**Date:** 2026-06-16
**Status:** Design approved — pending implementation plan
**Maintainer:** RECTOR

## 1. Overview

Revive the archived `superteam-academy` LMS as **RECTOR Academy** — a fully
de-branded, rectorspace.com-styled, polished clickable demo deployed to
`academy.rectorspace.com` as a portfolio piece in the RECTOR LABS ecosystem.

This is **one project**. The public launch happens only when the redesign is
pixel-perfect — there is no incremental public ship (redesign-first sequencing).
A *private* Vercel preview is used throughout to de-risk the deploy pipeline.

## 2. Locked Decisions

| Topic | Decision |
|-------|----------|
| Positioning | Rebrand fully as own; remove ALL Superteam IP |
| Brand | **RECTOR Academy**, folded into the RECTOR LABS ecosystem |
| Functional bar | Polished clickable demo (seed data, devnet wallet, OAuth/CMS/credential-minting hidden) |
| Reskin depth | Full bespoke redesign to the rectorspace.com aesthetic |
| Sequencing | One project; redesign-first; attach the public domain only when pixel-perfect |
| Baseline | From HEAD `4147f28`; discard the uncommitted formatting churn |
| Repo | Fresh, unarchived `RECTOR-LABS/rector-academy`; keep the old archived repo as history |
| Hosting | Fresh `rector-academy` Vercel project; domain `academy.rectorspace.com` |

## 3. Foundation (what stays)

The existing app is complete and Lighthouse-audited — it is the **foundation,
not a rebuild** (rebuilding would be wasteful / Israf).

- Next.js 15 (App Router), TypeScript strict, in `app/` (the deploy root; no root `package.json`)
- next-intl (en / pt / es), shadcn/ui, Tailwind v4, Monaco editor
- Solana wallet adapter, Sanity (seed-data mode)
- Package manager: **pnpm** (`app/pnpm-lock.yaml`)
- Anchor program in `onchain-academy/` — present but **NOT deployed** (out of scope)

**Stabilization (the first implementation work):**
- Discard the 304-file formatting churn (a verified single→double-quote reformat,
  not logic); baseline from HEAD `4147f28`.
- Reinstall dependencies (`app/node_modules` dates to March); confirm a clean
  `pnpm build`.
- Triage the 9 untracked files (Lighthouse reports, `take-screenshots.mjs`, the
  nested `onchain-academy/onchain-academy/` dirs, `CLAUDE.md`, `LICENSE`) — keep
  or remove each deliberately.

## 4. De-brand → RECTOR Academy

Remove ALL Superteam intellectual property:
- Rename "Superteam Academy" → "RECTOR Academy" across UI copy, the **en/pt/es
  next-intl message catalogs**, `<title>`/metadata, `package.json` name, README.
- Remove the Superteam logo, partner badges, and any Superteam marks; add a
  RECTOR Academy wordmark/logo in the RECTOR LABS style.
- Strip Superteam-specific copy ("Superteam Brazil", partner references, any
  remaining bounty language).
- New OG image + favicon (RECTOR Academy).
- Scrub residual bounty artifacts from the repo.

## 5. Design System — rectorspace.com

Remap the shadcn/ui CSS variables (currently Inter + standard shadcn tokens) to
the RECTOR LABS system (reference: the `core` repo's `globals.css` `@theme` +
`docs/DESIGN_SYSTEM.md`):
- **Palette:** cream `#FFF7E1` (bg), brown `#3B2C22` (text), sky `#41CFFF`, warm
  yellow `#F9C846`, clay `#E58C2E`, leaf green `#A8E063`, muted red `#C75A44`.
- **WCAG-AA readable-text tokens:** `--color-link #0D7390`, `--color-green-deep
  #3C6A12`, `--color-clay-deep #8A4A12`; the bright tokens are for decorative
  fills only (backgrounds, borders, rings).
- **Font:** JetBrains Mono (already present as `--font-jetbrains-mono`) as the
  primary; drop Inter.
- **Themes:** the **light theme becomes the RECTOR LABS cream look** (primary);
  the dark theme is retained as a secondary option.

## 6. Redesign Scope — Tiering

**Tier 1 — full bespoke redesign** (visitor-facing showcase, ~12 screens):
landing (marketing), courses, course detail, lesson view, challenge (per course),
challenges, challenges/library, dashboard, leaderboard, profile (+ `/[wallet]`),
credentials (+ `/[assetId]`), certificates/`[id]`.

**Tier 2 — token reskin only** (brand-consistent, not individually redesigned):
the 6 admin pages (admin, achievements, analytics, config, courses, users),
creator, onboarding, community (+ thread), settings, and the Sanity studio.

Any Tier-2 page can be promoted to Tier-1 later.

## 7. Demo Polish (the "feels real, nothing broken" bar)

- Seed data fills every Tier-1 page — **no empty states** (courses, lessons, the
  100 challenges, leaderboard, profiles, credentials).
- Wallet-connect works on Solana **devnet**.
- **Hidden / removed** (would need secrets or a backend): Google/GitHub OAuth
  sign-in, real on-chain credential minting, live Sanity CMS (use seed data).
  GA4 / Clarity / Sentry stay silently disabled (no env vars set).
- Every nav target resolves; **zero dead buttons, zero 401s**.

## 8. Deployment

- Fresh Vercel project **`rector-academy`** (root directory = `app/`, pnpm).
- **Minimal env:** devnet RPC (Helius project key) + seed-mode flags. No OAuth /
  Sanity / signer secrets.
- **Domain:** `academy.rectorspace.com` — a CNAME on RECTOR's personal Cloudflare
  account → Vercel, added as a domain on the Vercel project; SSL via Vercel.
- Private Vercel preview deploys throughout to de-risk the pipeline; the public
  domain is attached **only at the end** (redesign-first sequencing).

## 9. Repository

- The current repo `RECTOR-LABS/superteam-academy` is **archived**; the local
  remote points to the redirected `rz1989s/superteam-academy`.
- Create a fresh, unarchived **`RECTOR-LABS/rector-academy`** repo and push the
  de-branded + redesigned code.
- Keep the old archived repo as a historical record.

## 10. Out of Scope (future follow-ups)

Real auth (OAuth), live Sanity CMS, real on-chain credential minting, the
`onchain-academy` Anchor program deployment, and new course-content authoring.

## 11. Risks / Notes

- **Scope is large:** ~11 bespoke pages plus 144 components touched by the token
  layer. The implementation plan MUST break this into per-page tasks with a clear
  ordering (suggest: design system + shared shell first, then page by page).
- The 304 dirty files were confirmed (via sampled diff) to be a quote-style
  reformat, not logic — safe to discard.
- `core` (rectorspace.com) is the canonical design reference; reuse its
  `globals.css` `@theme` tokens and `DESIGN_SYSTEM.md` rather than reinventing.
- The Anchor program (`onchain-academy/`) stays in the repo but is not built or
  deployed for this project.
