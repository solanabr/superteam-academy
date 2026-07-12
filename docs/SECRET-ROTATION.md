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

> **Correction (2026-07-09):** the canonical production deploy is
> **superteam-academy-web.vercel.app** (Vercel `stbr-true`), which auto-deploys from
> `main`. References to `solarium.courses` / `credit-markets-team/lms` in this
> document are a parallel red herring, not prod — the rotation decisions below still
> apply, but to the `stbr-true` deploy.
>
> **Update (2026-07-12):** the dedicated production Supabase project (D-2 item 1) is
> **live: `pywhtmidcrptomrabbrw`**. The previously shared project
> (`obqlljsagzslxarwphxv`) is **retired as a prod source** — do not point anything
> new at it. The remaining D-2 work is credential minting + on-chain custody.

## Decisions (D-2) — RATIFIED 2026-07-03

1. **Isolate prod from dev — a NEW dedicated production Supabase project.** Stand
   up a fresh prod Supabase project with its own `URL` / `anon` / `service_role`,
   apply the schema + all migrations, migrate/seed the data, and cut prod
   (solarium.courses) over to it. Retire the shared dev project as a prod source.
2. **Mint ALL prod credentials fresh** — new Helius API key + webhook secret, a new
   Gemini key, a new `GITHUB_TOKEN` (read-only), new `ADMIN_SECRET` /
   `BUILD_SERVER_API_KEY`, and new Supabase keys (from the new project). **No dev
   value is ever reused in prod.**
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

> **How this inventory was derived** — re-run this before trusting it. An omission
> here is a secret nobody rotates, so the list is derived from the code, not from
> the previous version of this doc:
>
> 1. `apps/web/src/lib/env.ts` — the validated **public** schema (4 vars).
> 2. `apps/web/src/lib/env.server.ts` — the validated **server** schema (11 vars).
> 3. `apps/web/next.config.mjs` — build-time reads the schemas don't cover
>    (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`).
> 4. `turbo.json` `env` — build-cache keys (catches build-time vars).
> 5. `.env.example` — the documented surface.
> 6. Backstop, catches anything the above miss:
>    ```bash
>    grep -rhoE "process\.env\.[A-Z_0-9]+" apps/web/src apps/web/next.config.mjs \
>      | sed 's/.*process\.env\.//' | sort -u
>    ```
>
> Vars 3 and 6 are the ones that bite: a var read directly via `process.env` is
> **not** in either Zod schema, so schema-only derivation silently misses it. That
> is how `SENTRY_AUTH_TOKEN` was missed once already.
>
> **Union as of 2026-07-12: 30 real variables.** Anything in an env store that is
> not below is **dead** — delete it, don't rotate it.

### Critical — server-only (rotate before mainnet; leak = high blast radius)

| Secret                       | Purpose                                                        | Blast radius if leaked                                                                                                                              | How to rotate                                                                          |
| ---------------------------- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| `SUPABASE_SERVICE_ROLE_KEY`  | Bypasses RLS; all privileged DB writes                         | Full DB read/write; forge any user's XP/progress/certs                                                                                              | New prod project (pref.) or Supabase → rotate `service_role` JWT                       |
| `BACKEND_SIGNER_SECRET`      | Keypair signing on-chain mint / credential ix                  | Mint arbitrary XP + credentials to any wallet                                                                                                       | New keypair → `update_config` sets `Config.backend_signer` (**#118**)                  |
| `PROGRAM_AUTHORITY_SECRET`   | Program upgrade + config authority                             | Upgrade program, rewrite config, seize authority powers                                                                                             | Move to **Squads multisig** at mainnet (**#144**); retire the hot JSON                 |
| `XP_MINT_AUTHORITY_SECRET`   | XP mint authority (wallet link/unlink XP moves)                | Mint/burn XP tokens directly                                                                                                                        | New keypair; must match the mint's authority on-chain                                  |
| `ARWEAVE_UPLOADER_SECRET`    | Funds Irys uploads pinning credential metadata                 | Drains the funded upload wallet                                                                                                                     | New Solana keypair; re-fund; old one keeps only residual balance                       |
| `ADMIN_SECRET`               | HMAC-signs the `admin_session` cookie                          | Admin console: deploy/deactivate content, resync, moderate                                                                                          | Generate new 32-byte random → update env; invalidates live sessions                    |
| `HELIUS_WEBHOOK_SECRET`      | Verifies Helius webhook signatures                             | Forge on-chain events → fake enroll / XP / credential grants                                                                                        | Rotate in Helius webhook config **and** env together                                   |
| `HELIUS_API_KEY`             | Helius DAS API + webhook management (server)                   | Quota abuse, cost; read of on-chain indexes                                                                                                         | Helius dashboard → rotate                                                              |
| **`SOLANA_RPC_URL`**         | **Server** RPC endpoint — **embeds the Helius key in prod**    | Same as `HELIUS_API_KEY`: the key is _in the URL_. Quota abuse + cost.                                                                              | **Rotate WITH `HELIUS_API_KEY` — they are one secret in two places.**                  |
| `BUILD_SERVER_API_KEY`       | Authenticates `/build` calls to the build server               | Submit arbitrary Anchor builds to the compile sandbox                                                                                               | Rotate on the build server + env                                                       |
| `GEMINI_API_KEY`             | AI lesson assistant (`/api/ai/*`)                              | Quota abuse, cost                                                                                                                                   | Google AI Studio → rotate                                                              |
| `AI_PARTNER_SEAL_SECRET`     | Seals the comprehension-check token                            | Forge comprehension-check passes                                                                                                                    | New random value (falls back to `SUPABASE_SERVICE_ROLE_KEY` if unset)                  |
| **`MODERATION_WEBHOOK_URL`** | Slack/Discord incoming webhook — first flag on a post pings it | **The URL _is_ the credential.** Anyone holding it can post arbitrary messages into the admin channel (phishing/social-engineering the moderators). | Delete the incoming webhook in Slack/Discord → create a new one → update env           |
| **`SENTRY_AUTH_TOKEN`**      | Build-time source-map upload (`next.config.mjs:171`)           | Write to the Sentry org: upload/alter releases + source maps, read project data                                                                     | Sentry → revoke the token, issue a new one. **CI/Vercel only** — not needed at runtime |
| `GITHUB_TOKEN`               | **Read-only** poll of `courses-academy` HEAD/CI                | **Low** — read-only, and the repo is public. Worst case: rate-limit abuse                                                                           | GitHub → revoke, issue a new fine-grained read token                                   |

> **`SOLANA_RPC_URL` is secret-bearing, not config.** `env.server.ts` says it plainly:
> "this is the one that may carry a privileged Helius API key". Treating it as
> config is how a Helius key leaks into a screenshot. Its **public** sibling
> `NEXT_PUBLIC_SOLANA_RPC_URL` must carry **no** key — it is inlined into the
> browser bundle.

> **There is no content-write secret.** The app cannot mutate course content at
> runtime under any credential — content is a committed bundle and publishing is a
> pull request. Any `SANITY_*` variable found in an env store is **dead** and should
> be **deleted**, not rotated.

### Semi-sensitive (client-exposed, but abuse/quota risk)

| Secret                          | Purpose                 | Note                                                                                                                         |
| ------------------------------- | ----------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SOLANA_RPC_URL`    | Browser RPC endpoint    | **Must carry no privileged key** — it is inlined into the client bundle. The Helius-keyed endpoint goes in `SOLANA_RPC_URL`. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | RLS-gated (not a secret), but changes with the new prod project                                                              |
| `NEXT_PUBLIC_SENTRY_DSN`        | Error reporting         | Safe to expose by design; rotate only on abuse                                                                               |

### Config — not secret (change only when the underlying resource changes)

`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_XP_MINT_ADDRESS`,
`NEXT_PUBLIC_SOLANA_NETWORK`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`,
`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`, `BUILD_SERVER_URL`,
`RUST_PLAYGROUND_URL`, `SENTRY_ORG`, `SENTRY_PROJECT`.

(Every name is written out in full — no `_HOST`-style shorthand — so the
grep-the-doc-against-the-code check above actually works.)

Google OAuth has **no** app-side env var — the client ID/secret live in the Supabase
dashboard (Authentication → Providers → Google).

### Known drift in the env surface (not secrets — clean these up)

| Var                                                                                                     | Where                            | Status                                                                                                              |
| ------------------------------------------------------------------------------------------------------- | -------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`, `NEXT_PUBLIC_SANITY_DATASET`, `SANITY_API_TOKEN`, `SANITY_ADMIN_TOKEN` | `turbo.json` `env` (lines 12-15) | **DEAD.** Read nowhere in the codebase. Delete from `turbo.json` and from every env store.                          |
| `NEXT_PUBLIC_HELIUS_API_KEY`                                                                            | `turbo.json` `env`               | **PHANTOM.** Declared as a build-cache key but read nowhere. Helius is server-side only (`HELIUS_API_KEY`). Delete. |
| `GITHUB_TOKEN`, `MODERATION_WEBHOOK_URL`                                                                | absent from `.env.example`       | **UNDOCUMENTED.** Both are live in `env.server.ts`. Add them to `.env.example`.                                     |

Google OAuth has **no** app-side env var — the client ID/secret live in the Supabase
dashboard (Authentication → Providers → Google).

## Rotation procedure (order matters — avoid downtime)

1. **Provision** the new prod resource (Supabase project / Helius key / Gemini key).
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

- [x] New dedicated prod Supabase live (`pywhtmidcrptomrabbrw`); `service_role` isolated from dev.
- [ ] Helius (`HELIUS_API_KEY` **+ `SOLANA_RPC_URL` together**), Gemini, `GITHUB_TOKEN`, `ADMIN_SECRET`, `BUILD_SERVER_API_KEY`, `SENTRY_AUTH_TOKEN`, `MODERATION_WEBHOOK_URL` all freshly minted for prod.
- [ ] `AI_PARTNER_SEAL_SECRET` set explicitly in prod (not derived from `SUPABASE_SERVICE_ROLE_KEY`, so rotating the DB key doesn't silently invalidate live check tokens).
- [ ] `ARWEAVE_UPLOADER_SECRET` is a dedicated, funded keypair — never reused as a signer.
- [ ] Dead `SANITY_*` + phantom `NEXT_PUBLIC_HELIUS_API_KEY` deleted from `turbo.json` and every env store (Vercel prod + preview, local).
- [ ] `GITHUB_TOKEN` + `MODERATION_WEBHOOK_URL` added to `.env.example`.
- [ ] `NEXT_PUBLIC_SOLANA_RPC_URL` verified to carry **no** API key (it ships in the browser bundle).
- [ ] `backend_signer` rotated to a distinct hot key at mainnet init (**#118**).
- [ ] Program / mint authority under Squads multisig (**#144**).
- [ ] All prod secrets live only in the Vercel/Cloud Run encrypted env; on-chain keypairs in multisig/HW; repo clean.
- [ ] `.env.local` retired as any prod source.
