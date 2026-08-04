# apps/web — Next.js 15 App Router

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

The curated set (currently 10) lives in `solanabr/academy-courses` under `achievements/` — git is the source of truth; do not enumerate them here.

**Unlock logic is declarative, not a per-achievement map.** Each achievement doc carries an `award` rule (a discriminated union of `AwardKind`); `lib/gamification/achievements.ts` holds `PREDICATES satisfies Record<AwardKind, Predicate>` — one predicate per _kind_, so adding a kind without a predicate is a compile error, and no course/path id is ever hardcoded. Adding an achievement means adding a content doc, not code.

## Environment Variables

```bash
# Required — Supabase
NEXT_PUBLIC_SUPABASE_URL=          # Project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=     # Public anon key (safe for browser)
SUPABASE_SERVICE_ROLE_KEY=         # PRIVATE — server-only, for admin operations

# Required — Solana
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com   # PUBLIC browser RPC — keyless, or a Helius key DOMAIN-RESTRICTED to the app's origins
SOLANA_RPC_URL=                    # SERVER-ONLY RPC — a SEPARATE, unrestricted Helius key (never NEXT_PUBLIC_); required at boot
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_PROGRAM_ID=            # Deployed program ID (used by webhook decoder + frontend)
NEXT_PUBLIC_XP_MINT_ADDRESS=       # XP mint pubkey (from initialize.ts output)

# Required — Admin & Backend (server-only, never NEXT_PUBLIC_)
ADMIN_SECRET=                      # Admin panel authentication secret (HMAC-signed cookies)
BUILD_SERVER_URL=                  # Cloud Run build server URL (server-only, proxied via /api)
BUILD_SERVER_API_KEY=              # Build server authentication key
GITHUB_TOKEN=                      # Fine-grained READ token for solanabr/academy-courses (public repo,
                                   # but the token is still required — unauthenticated GitHub is
                                   # 60 req/hr per IP and flakes on Vercel). Server-only. Powers
                                   # the publish-pin card (HEAD polling + ahead-by) and the
                                   # Checks API (blocked state); unset → those admin reads 503.
HELIUS_API_KEY=                    # Helius key for webhook management + DAS API (lib/helius) — server-only, unrestricted, distinct from the browser key
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

# Optional — AI tutor daily spend caps (#591). Whole/decimal USD, per
# America/Sao_Paulo day, enforced by the ai_spend_ledger (lib/ai/spend-ledger).
# Derived DOWNWARD from the $500/mo sponsor commitment (O-1); config, not
# constants — bump when the commitment moves. Over a SOFT cap the tutor degrades
# (shorter output budget); only a HARD cap denies (503, fail-closed). Defaults
# shown; unset/"" uses the default.
AI_SPEND_GLOBAL_SOFT_USD=          # Global degrade threshold      (default 14)
AI_SPEND_GLOBAL_HARD_USD=          # Global hard deny              (default 25)
AI_SPEND_ACCOUNT_SOFT_USD=         # Per-account degrade           (default 0.5)
AI_SPEND_ACCOUNT_HARD_USD=         # Per-account hard deny         (default 1.5)
AI_SPEND_IP_SOFT_USD=              # Per-IP degrade                (default 2)
AI_SPEND_IP_HARD_USD=              # Per-IP hard deny              (default 5)
AI_SPEND_INPUT_USD_PER_MTOK=       # EMERGENCY all-models price override, $/1M tok input.
AI_SPEND_OUTPUT_USD_PER_MTOK=      # …and output (thinking bills here). UNSET by default:
                                    # since #868 the ledger prices each call at its ROUTED
                                    # model's rates (MODEL_RATES in lib/ai/models). Set these
                                    # only to answer a provider price move before a deploy.

# Optional — per-action Gemini model routing (#868). Defaults live in code
# (lib/ai/models): hint → gemini-3.5-flash-lite; ask/propose/review →
# gemini-3.6-flash; any Socratic-tier hint/ask turn → gemini-3.5-flash-lite; the
# openEnded reflection reply → gemini-3.5-flash-lite. These vars are an escape
# hatch for a price move or a model deprecation. A value outside the priced model
# set (gemini-3.6-flash | gemini-3.5-flash-lite | gemini-3.5-flash) is IGNORED
# with a warning — routing to an unpriced model would break the ledger's billing.
AI_MODEL_HINT=                     # Override the `hint` action's model
AI_MODEL_ASK=                      # Override the `ask` action's model
AI_MODEL_PROPOSE=                  # Override the `propose` action's model
AI_MODEL_REVIEW=                   # Override the `review` action's model
AI_MODEL_SOCRATIC=                 # Override the Socratic-tier hint/ask model
AI_MODEL_REFLECTION=               # Override the openEnded reflection-reply model
OPENENDED_AI_REPLY=                # Best-effort AI reply on /api/lessons/reflect (openEnded
                                    # reflections). Default ON since #848 — set to "0" to disable.
                                    # The reflection SEAL is always returned regardless; the reply
                                    # is enrichment only (rate-limited, #591 spend-ledger gated,
                                    # never blocks). Requires GEMINI_API_KEY — unset key = no reply.

# Optional — Teacher course preview (#828), server-only
#                                  # Needs no GITHUB_TOKEN: academy-courses is public, so the
#                                  # preview reads it anonymously (#830). A token is used when
#                                  # set, purely to lift the 60 req/hr anonymous rate limit.
TEACH_PREVIEW_PASSWORD=            # Shared password for /teach/preview. NO default —
                                   # unset = preview disabled (/api/teach/preview/auth 503s).
                                   # Gates read-only rendering of unpublished course PRs only:
                                   # never on-chain writes, never the admin surface (separate
                                   # cookie from admin_session, so it cannot satisfy admin auth).

# Optional — Phantom Connect embedded wallets (#983/#984)
# Public, domain-bound client id from Phantom Portal (https://phantom.com/portal/).
# It ships in the client bundle by design; Portal's allowed-domains list is what
# scopes it, so it is configuration, not a secret. Unset = embedded wallets OFF,
# exactly like the analytics keys — SIWS stays the guaranteed way in, and no
# build or page render may depend on this being present.
# Portal must list the production origin AND http://localhost:3000 for dev.
# Read ONLY through lib/phantom/config.ts (isPhantomConnectEnabled/getPhantomAppId).
# NOTE: we integrate via @phantom/browser-sdk, not @phantom/react-sdk — the
# latter needs React >=19.0.1 and this app is on React 18.3.1 (#989).
NEXT_PUBLIC_PHANTOM_APP_ID=

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

# Required — App URL (sitemap, OG tags, email links, on-chain metadata URIs).
# Validated in lib/env.ts: dev/test default to http://localhost:3000, a
# PRODUCTION build with it unset fails at boot — an empty value would pin a
# RELATIVE metadata URI into an immutable credential NFT (unfixable after mint).
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Dev

```bash
cd apps/web && pnpm dev
```

## Content Bundle (compile-content)

Course content ships as a **committed** bundle, not a live fetch. `scripts/compile-content.ts`
compiles the `solanabr/academy-courses` repo — pinned to the SHA in `apps/web/content.lock` —
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
