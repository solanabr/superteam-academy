# Secret rotation

How to rotate each secret the app and its services use. Record every rotation
(date, who, which secret) in the ops log, which lives outside the repo.

## Rules

- Production and development never share a value. Each environment has its own
  Supabase project and its own minted credentials.
- Secrets live only in the platform env stores (Vercel, Cloud Run, GitHub
  Actions environments). Nothing secret goes in the repo, a screenshot or a paste.
- API keys can be re-issued, so losing one means minting a new one. On-chain
  keypairs can't be re-issued: keep a backup of each one outside the env store.
- `NEXT_PUBLIC_SOLANA_RPC_URL` is inlined into the browser bundle. It carries no
  key, or a domain-restricted Helius key that is a separate key from the one in
  `SOLANA_RPC_URL`.

## Finding every secret

Derive the list from the code before trusting the tables below. A secret missing
here is a secret nobody rotates.

1. `apps/web/src/lib/env.ts`: the validated public schema.
2. `apps/web/src/lib/env.server.ts`: the validated server schema.
3. `apps/web/next.config.mjs`: build-time reads the schemas don't cover
   (`SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN`).
4. `apps/web/scripts/`: build scripts that take env as a parameter
   (`BLOB_READ_WRITE_TOKEN` in `sync-content-assets.ts`).
5. `turbo.json` `env`: build-cache keys.
6. `.github/workflows/`: every `secrets.*` reference.
7. `apps/build-server/src/config.rs`: the build server's own env.
8. `.env.example`: the documented surface.
9. The backstop, for anything read straight from `process.env`:

   ```bash
   grep -rhoE "process\.env\.[A-Z_0-9]+" apps/web/src apps/web/scripts \
     apps/web/next.config.mjs --exclude-dir=generated \
     | sed 's/.*process\.env\.//' | sort -u
   ```

A var read directly from `process.env` is in neither Zod schema, so a list built
from the schemas alone misses it. Anything in an env store that the code doesn't
read is dead: delete it, don't rotate it. That includes any `SANITY_*` value,
`NEXT_PUBLIC_HELIUS_API_KEY` and `ADMIN_SECRET`.

## Server-only secrets

| Secret                            | Purpose                                                   | If leaked                                                               | How to rotate                                                                                                                                                                  |
| --------------------------------- | --------------------------------------------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `SUPABASE_SERVICE_ROLE_KEY`       | Bypasses RLS; all privileged DB writes                    | Full DB read/write; forge any user's XP, progress or certificates       | Supabase → Project settings → API → rotate the `service_role` key. Set `AI_PARTNER_SEAL_SECRET` first (see its row).                                                           |
| `BACKEND_SIGNER_SECRET`           | Co-signs every XP mint, lesson completion and credential  | Mint XP within the minter caps and issue credentials to any wallet      | New keypair, then [Rotating an on-chain keypair](#rotating-an-on-chain-keypair). Backend-signed writes fail from the `update_config` call until the new env value is deployed. |
| `PROGRAM_AUTHORITY_SECRET`        | `Config.authority`: courses, minters, config, kill-switch | Register an uncapped minter, rewrite config, rotate the backend         | New keypair, then [Rotating an on-chain keypair](#rotating-an-on-chain-keypair). Admin course writes fail from the rotation until the new env value is deployed.               |
| `XP_MINT_AUTHORITY_SECRET`        | Signs XP token mints (`lib/solana/xp-mint.ts`)            | Mint XP tokens directly                                                 | New keypair; it must match the mint's authority on-chain.                                                                                                                      |
| `SPONSOR_SECRET`                  | Pays fees and rent for learner usage                      | Drains the sponsor wallet                                               | New funded keypair; swap the env value and redeploy. Nothing on-chain names it. Keep the old wallet: rent from enrollments it paid returns there on close.                     |
| `ARWEAVE_UPLOADER_SECRET`         | Funds the Irys uploads that pin credential metadata       | Drains the upload wallet                                                | New Solana keypair, funded; move or abandon the old wallet's remaining balance. Never reuse it as a signer.                                                                    |
| `HELIUS_WEBHOOK_SECRET`           | Verifies Helius webhook signatures                        | Forged on-chain events: fake enrollments, XP or credential grants       | Change it in the Helius webhook config and the env store together.                                                                                                             |
| `HELIUS_API_KEY`                  | Webhook management (`scripts/helius-webhook-config.ts`)   | Quota abuse and cost                                                    | Helius dashboard → rotate.                                                                                                                                                     |
| `SOLANA_RPC_URL`                  | Server RPC endpoint; the server Helius key is in the URL  | Same as a leaked Helius key                                             | Rotate it with the Helius key it embeds: they are one secret in two places.                                                                                                    |
| `BUILD_SERVER_API_KEY`            | Authenticates `/build` calls to the build server          | Submit arbitrary Anchor builds to the compile sandbox                   | Set the new value as `ACADEMY_API_KEY` on the build server and as `BUILD_SERVER_API_KEY` in the app env, then redeploy both.                                                   |
| `GEMINI_API_KEY`                  | AI lesson assistant (`/api/ai/*`)                         | Quota abuse and cost                                                    | Google AI Studio → rotate.                                                                                                                                                     |
| `AI_PARTNER_SEAL_SECRET`          | Seals the comprehension-check token                       | Forged comprehension-check passes                                       | New random value. Set it explicitly: unset, it falls back to `SUPABASE_SERVICE_ROLE_KEY`, so rotating the DB key would invalidate live check tokens.                           |
| `TEACH_PREVIEW_PASSWORD`          | Gates the teacher preview of `academy-courses` PRs        | Anyone can make the server download and compile PR tarballs             | New random value; share it with teachers out of band.                                                                                                                          |
| `CRON_SECRET`                     | Bearer secret Vercel Cron sends to `/api/cron/*`          | Trigger the scheduled mail and queue jobs at will                       | New random value in the Vercel env; Vercel Cron picks it up on the next deploy.                                                                                                |
| `RESEND_API_KEY`                  | Sends marketing and reminder email                        | Send mail as the academy domain                                         | Resend → API keys → create a new key, swap it, delete the old one.                                                                                                             |
| `MODERATION_WEBHOOK_URL`          | Slack/Discord webhook pinged by the first flag on a post  | The URL is the credential: anyone holding it can post into that channel | Delete the incoming webhook in Slack/Discord, create a new one, update the env.                                                                                                |
| `GITHUB_TOKEN`                    | Read-only polling of `academy-courses` HEAD and CI        | Low: read-only on a public repo; rate-limit abuse                       | GitHub → revoke, issue a new fine-grained read token.                                                                                                                          |
| `SENTRY_AUTH_TOKEN`               | Build-time source-map upload (`next.config.mjs`)          | Upload or alter releases and source maps, read project data             | Sentry → revoke the token, issue a new one. Build env only; the runtime doesn't need it.                                                                                       |
| `BLOB_READ_WRITE_TOKEN`           | Uploads course images to Vercel Blob at build time        | Overwrite or delete course images                                       | Vercel → Storage → the Blob store: issue a new read-write token, update the env, redeploy.                                                                                     |
| `CONTENT_RELEASE_APP_PRIVATE_KEY` | GitHub App key the content-release workflow uses          | Act as the app, with its permissions, in every repo it's installed on   | GitHub App settings → generate a new private key → update the `content-release` environment secret → delete the old key.                                                       |

Admin access has no secret. The admin console checks the user's Supabase session
against the service-role-only `admin_users` allowlist. To revoke an admin,
`DELETE FROM admin_users WHERE user_id = …` as service role; it takes effect
immediately.

There is no content-write secret either. Content is a committed bundle and
publishing is a pull request, so the app can't change course content at runtime
under any credential.

## Client-exposed values

| Value                           | Purpose                 | Note                                                                       |
| ------------------------------- | ----------------------- | -------------------------------------------------------------------------- |
| `NEXT_PUBLIC_SOLANA_RPC_URL`    | Browser RPC endpoint    | Carries no privileged key (see Rules). Rotate its key if it's ever abused. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Supabase client | RLS-gated, not a secret. Changes when the Supabase project changes.        |
| `NEXT_PUBLIC_SENTRY_DSN`        | Error reporting         | Safe to expose by design; rotate only on abuse.                            |

## Config, not secret

Change these only when the resource behind them changes:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_PROGRAM_ID`, `NEXT_PUBLIC_XP_MINT_ADDRESS`,
`NEXT_PUBLIC_SOLANA_NETWORK`, `NEXT_PUBLIC_APP_URL`, `NEXT_PUBLIC_GA4_MEASUREMENT_ID`,
`NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST`,
`NEXT_PUBLIC_DYNAMIC_ENVIRONMENT_ID`, `BUILD_SERVER_URL`, `RUST_PLAYGROUND_URL`,
`EMAIL_FROM`, `SENTRY_ORG`, `SENTRY_PROJECT`.

Every name is written out in full so the derivation check above can grep this
file against the code.

Google and GitHub OAuth have no app-side env var: their client IDs and secrets
live in the Supabase dashboard (Authentication → Providers). Rotate them at the
provider, then paste the new pair there.

## Rotation procedure

For API keys and other off-chain secrets:

1. **Provision** the new credential at the provider.
2. **Stage** the new value in the env store and deploy. Where the provider allows
   two live credentials, keep the old one until the new one is verified.
3. **Revoke** the old credential once the new one is confirmed live.
4. **Verify:** `/api/auth/nonce` returns 200, a test enrollment syncs through the
   webhook to the DB, an admin action authenticates, and a challenge validates.
5. **Record** the rotation in the ops log.

### Rotating an on-chain keypair

The program accepts `BACKEND_SIGNER_SECRET` only while it equals
`Config.backend_signer`, and `PROGRAM_AUTHORITY_SECRET` only while it equals
`Config.authority`. There is no overlap: the old key is refused the moment the
on-chain change lands, and the app keeps signing with the old key until the new
env value is deployed. Keep that gap to minutes.

1. Generate the new keypair and back it up outside the env store.
2. Backend signer only: register the new key as a minter first
   (`pnpm tsx scripts/init-program.ts register-minter` with the new key in
   `BACKEND_SIGNER_SECRET`). `register_minter` doesn't need the key to be the
   backend signer yet, and `reward_xp` needs the role as soon as it is.
3. Stage the new value in the Vercel env. It takes effect on the next deploy, not
   before.
4. Optionally freeze the platform (`POST /api/admin/freeze` with
   `{ "frozen": true }`). Lesson completion and certificate minting then return
   503, and queued on-chain writes are deferred without spending their retry
   budget.
5. Send the on-chain change, signed by the current authority:
   - Backend signer: `update_config` with `new_backend_signer`, passing the old
     backend's `["minter", old_backend]` PDA as the first remaining account. The
     same call deactivates the old role.
   - Authority: `onchain-academy/scripts/rotate-config-authority.ts <NEW_PUBKEY>`
     (dry run, then `--yes`). It's one-step and irreversible, so check the key
     twice.
6. Redeploy immediately, so the app signs with the new key.
7. Clear the freeze if you set one, then run the checks above plus one lesson
   completion and one admin course sync.

Without a freeze, every write signed with the rotated key fails between steps 5
and 6. Lesson completions return an error and the learner has to submit again.
Writes that go through the retry queue (finalize, credentials, achievements, XP
mints) back off at 5, 20, 80 and 320 minutes and are abandoned after the fifth
failure.
For the authority, admin course writes fail.

The program upgrade authority is separate from `Config.authority`: move it with
`solana program set-upgrade-authority`. Mainnet authority changes need the
owner's explicit confirmation, and program writes go through a Helius RPC (see
the root `CLAUDE.md`).

## When to rotate

- **On demand:** suspected compromise, a contributor offboarding, or any secret
  that touched the repo, a screen share or a paste.
- **Periodically:** third-party API keys every 90 days or sooner.
- **On-chain keypairs:** on suspected compromise or a change of key holder.
