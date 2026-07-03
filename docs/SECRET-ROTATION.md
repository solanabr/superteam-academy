# Prod Secret Hygiene & Rotation Plan (D-2)

> Resolves decision **D-2** (issue #104); the execution of this plan is gate **G-1** (#138).
> Glossary of task codes: [`docs/TASK-CODES.md`](./TASK-CODES.md).

## Problem

Every secret below was shared in `apps/web/.env.local` during development. The
canonical production deploy (**solarium.courses**, Vercel `credit-markets-team/lms`)
and local dev **currently point at the same Supabase project and reuse the same
secrets** — production data and credentials are **not isolated** from development.
Before mainnet, every prod secret must be **freshly minted, isolated from dev, and
stored outside the repo**.

## Decisions (D-2) — RATIFIED 2026-07-03

1. **Isolate prod from dev — a NEW dedicated production Supabase project.** Stand
   up a fresh prod Supabase project with its own `URL` / `anon` / `service_role`,
   apply the schema + all migrations, migrate/seed the data, and cut prod
   (solarium.courses) over to it. Retire the shared dev project as a prod source.
2. **Mint ALL prod credentials fresh** — new Helius API key + webhook secret, new
   Sanity tokens, new Gemini key, new `ADMIN_SECRET` / `BUILD_SERVER_API_KEY`, and
   new Supabase keys (from the new project). **No dev value is ever reused in prod.**
3. **Custody — the platform env store is the source of truth for app secrets.**
   Prod secrets live only in the **Vercel / Cloud Run encrypted env** (no separate
   password-manager vault). Because there is no offline master, treat an env wipe
   as "re-mint" for API-key-class secrets (all are re-issuable).
   **Exception (non-negotiable): on-chain keypairs.** A program-authority or
   `backend_signer` keypair must **NOT** live only in an env var — it is not
   re-issuable and its loss is unrecoverable. Those move to hardware / **Squads
   multisig** (G-7 #144), with `backend_signer` rotated to a distinct hot key at
   mainnet init (#118). **Nothing secret in the repo, ever.**

## Secret inventory & rotation

### Critical — server-only (rotate before mainnet; leak = high blast radius)

| Secret                      | Purpose                                          | Blast radius if leaked                                       | How to rotate                                                          |
| --------------------------- | ------------------------------------------------ | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY` | Bypasses RLS; all privileged DB writes           | Full DB read/write; forge any user's XP/progress/certs       | New prod project (pref.) or Supabase → rotate `service_role` JWT       |
| `BACKEND_SIGNER_SECRET`     | Keypair signing on-chain mint / credential ix    | Mint arbitrary XP + credentials to any wallet                | New keypair → `update_config` sets `Config.backend_signer` (**#118**)  |
| `PROGRAM_AUTHORITY_SECRET`  | Program upgrade + config authority               | Upgrade program, rewrite config, seize authority powers      | Move to **Squads multisig** at mainnet (**#144**); retire the hot JSON |
| `ADMIN_SECRET`              | HMAC-signs the `admin_session` cookie            | Admin panel: course/achievement sync, resync, deactivate     | Generate new 32-byte random → update env; invalidates live sessions    |
| `HELIUS_WEBHOOK_SECRET`     | Verifies Helius webhook signatures               | Forge on-chain events → fake enroll / XP / credential grants | Rotate in Helius webhook config **and** env together                   |
| `BUILD_SERVER_API_KEY`      | Authenticates `/build` calls to the build server | Submit arbitrary Anchor builds to the compile sandbox        | Rotate on the build server + env                                       |
| `SANITY_ADMIN_TOKEN`        | Sanity **write** token (course content)          | Modify / delete any course, lesson, answer key               | sanity.io/manage → revoke, issue new write token                       |
| `SANITY_API_TOKEN`          | Sanity read/API token                            | Read content (incl. hidden test answer keys)                 | sanity.io/manage → rotate                                              |
| `GEMINI_API_KEY`            | AI tutor / challenge suggest                     | Quota abuse, cost                                            | Google AI Studio → rotate                                              |

### Semi-sensitive (client-exposed, but abuse/quota risk)

| Secret                          | Purpose                 | Note                                                                                              |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_HELIUS_API_KEY`    | Client-side Helius RPC  | Public by design but quota-abusable; prefer a server proxy + a low-limit key, and rotate for prod |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | RLS-gated (not a secret), but changes with the new prod project                                   |
| `SENTRY_DSN`                    | Error reporting         | Safe to expose; rotate only on abuse                                                              |

### Config — not secret (change only when the underlying resource changes)

`NEXT_PUBLIC_BACKEND_SIGNER` (pubkey; changes when `BACKEND_SIGNER_SECRET` rotates),
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_XP_MINT_ADDRESS`,
`NEXT_PUBLIC_SOLANA_RPC_URL` / `SOLANA_RPC_URL`, `NEXT_PUBLIC_SOLANA_NETWORK`,
`NEXT_PUBLIC_SANITY_PROJECT_ID` / `_DATASET`, `NEXT_PUBLIC_GOOGLE_CLIENT_ID`,
`NEXT_PUBLIC_GA4_MEASUREMENT_ID`, `NEXT_PUBLIC_POSTHOG_KEY` / `_HOST`.

## Rotation procedure (order matters — avoid downtime)

1. **Provision** the new prod resource (Supabase project / Helius key / Sanity token).
2. **Stage** the new value in the platform env store (Vercel prod scope) _without_
   removing the old one where a dual-read window helps (e.g. deploy, verify, then revoke).
3. **Rotate on-chain last:** `backend_signer` via `update_config` (the app keeps
   working through the old signer until the new pubkey is set + redeployed).
4. **Revoke** the old credential at the provider once the new one is confirmed live.
5. **Verify:** `/api/auth/nonce` returns 200, a test enroll → webhook → DB sync works,
   an admin action authenticates, a challenge validates.
6. **Record** the rotation date + who rotated in a secure ops log (not here, not the repo).

## Cadence & triggers

- **On demand:** suspected compromise, a contributor offboarding, or any secret
  that ever touched the repo / a screen-share / a paste.
- **Periodic:** third-party API keys ≤ 90 days.
- **On-chain authority:** once under Squads multisig (#144), routine single-key
  rotation is unnecessary — key-holder changes go through the multisig.

## Definition of done

- [ ] New dedicated prod Supabase live; `service_role` isolated from dev.
- [ ] Helius, Sanity, Gemini, `ADMIN_SECRET`, `BUILD_SERVER_API_KEY` all freshly minted for prod.
- [ ] `backend_signer` rotated to a distinct hot key at mainnet init (**#118**).
- [ ] Program / mint authority under Squads multisig (**#144**).
- [ ] All prod secrets live only in the Vercel/Cloud Run encrypted env; on-chain keypairs in multisig/HW; repo clean.
- [ ] `.env.local` retired as any prod source.
