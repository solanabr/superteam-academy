# apps/web — Next.js 14 App Router

API route reference lives in `src/app/api/CLAUDE.md` (loads when you work on routes).

## Middleware

The middleware (`src/middleware.ts`) chains two concerns:

1. **Supabase auth**: Creates server client, calls `getUser()` (may refresh tokens)
2. **next-intl**: Adds locale prefix to all routes (default: `en`)

**Auth-gated routes** (redirect to landing if unauthenticated): `/dashboard`, `/settings`, `/profile` (exact — own profile only)
**Public routes** (no auth required): `/` (landing), `/courses`, `/leaderboard`, `/community`, `/certificates`, `/profile/[username]`
**Admin routes**: Checked against HMAC-signed `admin_session` cookie (separate from Supabase auth). Sub-routes redirect to `/admin` login form if cookie is absent or expired.
**Excluded from middleware**: `/api/*`, `/_next`, `/_vercel`, static assets

## i18n Notes

- Root-level files (`not-found.tsx`, `error.tsx`) cannot use `next-intl` because they render outside the `[locale]` layout. They use inline translation objects with locale extracted from `usePathname()`.
- The `requestLocale` API is used in `lib/i18n/request.ts` (not the deprecated `locale` param).
- All 3 locale files (en.json, pt-BR.json, es.json) must have identical key structures. Missing keys cause `MISSING_MESSAGE` errors at runtime.

## Gamification

### XP Rewards

| Action                 | XP Range                 |
| ---------------------- | ------------------------ |
| Complete lesson        | 10-50 (by difficulty)    |
| Complete challenge     | 25-100 (by difficulty)   |
| Complete course        | 500-2000 (by difficulty) |
| Daily streak bonus     | 10                       |
| First daily completion | 25                       |

**Level formula**: `Level = floor(sqrt(totalXP / 100))`
**Server-side cap**: max 100 XP per lesson completion, max 2000 XP per generic award

### Achievements

The curated set (currently 10) lives in `solanabr/courses-academy` under `achievements/` — git is the source of truth; do not enumerate them here.

**Unlock logic is declarative, not a per-achievement map.** Each achievement doc carries an `award` rule (a discriminated union of `AwardKind`); `lib/gamification/achievements.ts` holds `PREDICATES satisfies Record<AwardKind, Predicate>` — one predicate per _kind_, so adding a kind without a predicate is a compile error, and no course/path id is ever hardcoded. Adding an achievement means adding a content doc, not code.

## Environment Variables

```bash
# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=         # PRIVATE — server-only, for admin operations

# Required — Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com   # PUBLIC browser RPC — no privileged key
SOLANA_RPC_URL=                    # SERVER-ONLY RPC (may carry the Helius key; required at boot)
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=            # Deployed program ID (used by webhook decoder + frontend)
NEXT_PUBLIC_XP_MINT_ADDRESS=       # XP mint pubkey (from initialize.ts output)

# Required — Admin & Backend (server-only, never NEXT_PUBLIC_)
ADMIN_SECRET=                      # Admin panel authentication secret (HMAC-signed cookies)
BUILD_SERVER_URL=                  # Cloud Run build server URL (server-only, proxied via /api)
BUILD_SERVER_API_KEY=              # Build server authentication key
GITHUB_TOKEN=                      # Fine-grained READ token for solanabr/courses-academy (public repo,
                                   # but the token is still required — unauthenticated GitHub is
                                   # 60 req/hr per IP and flakes on Vercel). Server-only. Powers
                                   # the publish-pin card (HEAD polling + ahead-by) and the
                                   # Checks API (blocked state); unset → those admin reads 503.
HELIUS_API_KEY=                    # Helius key for webhook management + DAS API (lib/helius)
HELIUS_WEBHOOK_SECRET=             # Helius webhook signature verification
BACKEND_SIGNER_SECRET=             # Rotatable backend co-signer keypair (completeLesson etc.)
XP_MINT_AUTHORITY_SECRET=          # XP mint authority keypair (JSON array of 64 keypair bytes)
PROGRAM_AUTHORITY_SECRET=          # Program authority keypair (JSON array of 64 keypair bytes)

# Optional — AI lesson assistant (server-only)
GEMINI_API_KEY=                    # Gemini key for /api/ai/* (omit to disable the assistant)
AI_PARTNER_SEAL_SECRET=            # Optional dedicated key for sealing the comprehension-check
                                    # token (lib/ai/check-seal.ts); if unset, derived from
                                    # SUPABASE_SERVICE_ROLE_KEY.
AI_PARTNER_DEBUG=                  # Set to "1" to log per-call prompt-cache token counts
                                    # from /api/ai/partner. Default off (quiet in production).

# Optional — Rust playground proxy (server-only)
RUST_PLAYGROUND_URL=               # /api/rust/execute upstream (default: play.rust-lang.org/execute)

# Optional — Permanent credential storage (server-only)
# Funds Irys uploads that pin credential metadata to Arweave at mint, so the
# on-chain asset URI resolves independently of app uptime. The uploader returns
# an Irys GATEWAY URL (https://gateway.irys.xyz/<id>) — NOT arweave.net — and
# that is what gets pinned on-chain; on mainnet the same <id> also resolves via
# https://arweave.net/<id> and ar://<id>. SOLANA keypair (JSON array of 64
# bytes, like BACKEND_SIGNER_SECRET) — funded with SOL, NOT an Arweave JWK.
# Unset → mint falls back to /api/certificates/metadata (warns).
# REQUIRED (funded on mainnet-beta via irys.xyz) for permanent mainnet creds.
ARWEAVE_UPLOADER_SECRET=

# Optional — Analytics (platform works without these)
NEXT_PUBLIC_GA4_MEASUREMENT_ID=
NEXT_PUBLIC_POSTHOG_KEY=
NEXT_PUBLIC_POSTHOG_HOST=https://app.posthog.com
NEXT_PUBLIC_SENTRY_DSN=            # Public DSN (safe to expose); drives client+server+edge Sentry
SENTRY_ORG=                        # Build-time source-map upload (CI/Vercel only)
SENTRY_PROJECT=
SENTRY_AUTH_TOKEN=

# Optional — App URL (for sitemap, OG tags)
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Dev

```bash
cd apps/web && pnpm dev
```

## Content Bundle (compile-content)

Course content ships as a **committed** bundle, not a live fetch. `scripts/compile-content.ts`
compiles the `solanabr/courses-academy` repo — pinned to the SHA in `apps/web/content.lock` —
into typed JSON under `src/content/generated/` plus assets under `public/content-assets/`.

```bash
pnpm --filter web compile-content   # from repo root (or: cd apps/web && pnpm compile-content)
```

- The generated dir is **committed** and prettier-ignored; output is a pure function of the
  locked SHA, so a recompile must be **byte-identical** — CI recompiles and `git diff --exit-code`s it.
- Do **not** hand-edit `src/content/generated/*`; an ESLint rule bans importing it outside
  `src/lib/content/`.
- **Publishing new content** = a PR that bumps `content.lock` to the new SHA **and** commits the
  regenerated bundle in the same change.
