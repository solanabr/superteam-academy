# Staging Environment Guide

Readiness item **G8**. How to stand up a staging environment for Superteam
Academy that mirrors production topology (Vercel + Supabase + Sanity + Helius +
Cloud Run) without touching prod data, and how to run the read-path load test
against it.

Staging exists to rehearse deploys and run load tests **safely**. The golden
rule: **staging must never share a database, XP mint, program, or webhook with
production.** Everything points at **devnet** and a **separate Supabase**
project/branch.

- Full deploy reference: [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)
- Env-var placeholders: [`.env.staging.example`](../.env.staging.example)
- Load test: [`scripts/load/README.md`](../scripts/load/README.md)

---

## Topology at a glance

| Layer            | Production                         | Staging                                              |
| ---------------- | ---------------------------------- | ---------------------------------------------------- |
| Frontend         | Vercel Production deploy (`main`)  | Vercel **Preview** env (staging branch or PR)        |
| Database         | Supabase prod project              | Supabase **branch** _or_ a separate staging project  |
| CMS              | Sanity `production` dataset        | Same project; `production` (or a `staging` dataset)  |
| Chain            | mainnet-beta / devnet              | **devnet** always                                    |
| RPC + webhooks   | Helius (prod webhook)              | Helius (separate **devnet** webhook → staging URL)   |
| Build server     | Cloud Run (shared)                 | Same Cloud Run service (stateless) or a staging one  |

---

## 1. Supabase: branch or separate project

Two options — pick based on how isolated you need staging to be.

### Option A — Supabase branch (fast, ephemeral)

If the project is on a plan with [database branching](https://supabase.com/docs/guides/deployment/branching),
create a branch off the prod project. It clones the schema and gives you a
separate connection string, keys, and data namespace — ideal for short-lived
staging.

- Create the branch from the Supabase dashboard (Branches) or CLI.
- Grab the branch's Project URL + anon + service-role keys for the env vars in
  §4.

### Option B — Separate staging project (durable)

For a long-lived staging environment, create a **new** Supabase project
(`superteam-academy-staging`) and apply the same migrations:

```bash
# From supabase/ — apply the full schema to the staging project
supabase link --project-ref <STAGING_PROJECT_REF>
supabase db push        # or run supabase/schema.sql against the staging DB
```

Then, exactly as in [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) §Supabase Setup:

- **Verify RLS is enabled** on all tables (staging is still exposed to the
  internet — do not relax RLS).
- Add the staging Vercel URL to **Auth → Redirect URLs**.
- Enable the Google OAuth provider if you're testing sign-in (use a staging
  OAuth client, not the prod one).

> Do **not** copy production user data into staging. Seed with test content
> (`sanity/seed/`) and test accounts only.

---

## 2. Sanity: dataset

The simplest path is to reuse the existing Sanity project and its `production`
dataset (content is not user data). If you want editorial isolation, create a
`staging` dataset and set `NEXT_PUBLIC_SANITY_DATASET=staging`. Add the staging
Vercel URL to **Sanity → API → CORS origins** either way.

---

## 3. Solana + Helius: devnet only

Staging always runs against **devnet**:

- `NEXT_PUBLIC_SOLANA_NETWORK=devnet`
- `NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com` (or your Helius
  devnet RPC URL)
- `NEXT_PUBLIC_PROGRAM_ID` + `NEXT_PUBLIC_XP_MINT_ADDRESS` = the **devnet**
  program and mint (see [`docs/DEPLOY-PROGRAM.md`](./DEPLOY-PROGRAM.md)).

Create a **separate Helius webhook** for staging pointed at
`https://<staging-url>/api/webhooks/helius`, with its own
`HELIUS_WEBHOOK_SECRET`. Never repoint the production webhook at staging — that
would leak prod on-chain events into the staging DB (and vice versa).

---

## 4. Vercel: preview/staging deployment

Staging rides on Vercel's **Preview** environment.

1. **Push a staging branch** (or open a PR). Vercel auto-builds a Preview
   deployment for every branch/PR — that URL is your staging site. For a stable
   URL, keep a long-lived `staging` branch and use its Preview URL, or assign a
   custom domain (e.g. `academy-staging.example.com`) to it.
2. **Set Preview env vars**: Vercel → Project → Settings → Environment
   Variables, scope = **Preview**. Fill in every variable from
   [`.env.staging.example`](../.env.staging.example) with staging-scoped values:
   - `NEXT_PUBLIC_*` → devnet + the **staging** Supabase/Sanity project.
   - Server secrets (`SUPABASE_SERVICE_ROLE_KEY`, `*_AUTHORITY_SECRET`,
     `BACKEND_SIGNER_SECRET`, `XP_MINT_AUTHORITY_SECRET`, `ADMIN_SECRET`,
     `HELIUS_*`, `BUILD_SERVER_*`, `SANITY_ADMIN_TOKEN`) → staging values,
     **Preview-scoped so they never bleed into Production**.
   - `NEXT_PUBLIC_APP_URL` → the staging URL (drives sitemap + OG tags).
   - Leave analytics keys blank on staging to avoid polluting prod dashboards.

See the annotated variable list in [`docs/DEPLOYMENT.md`](./DEPLOYMENT.md)
§Environment Variables for what each one does and whether it's public.

---

## 5. Build server (Cloud Run)

The Anchor build server is stateless and auth-gated by `BUILD_SERVER_API_KEY`,
so staging can point `BUILD_SERVER_URL` at the **same** Cloud Run service as
prod. If you'd rather isolate build load, deploy a second Cloud Run service per
[`docs/DEPLOYMENT.md`](./DEPLOYMENT.md) §Build Server and use its URL + key.

---

## 6. Smoke-check staging

Before load-testing, confirm the deploy is healthy:

```bash
STAGING=https://academy-staging.example.com

curl -sS -o /dev/null -w "%{http_code}\n" "$STAGING/en"                    # landing -> 200
curl -sS -o /dev/null -w "%{http_code}\n" "$STAGING/en/courses"            # catalog -> 200
curl -sS -o /dev/null -w "%{http_code}\n" "$STAGING/api/leaderboard?timeframe=weekly"  # 200
curl -sS -o /dev/null -w "%{http_code}\n" "$STAGING/sitemap.xml"           # 200
```

---

## 7. Run the load test against staging

Once staging is green, run the read-path k6 test against it. It exercises
**public GET paths only** — no writes, no auth, no mint/chain calls.

```bash
BASE_URL=https://academy-staging.example.com k6 run scripts/load/load-test.js
```

Full instructions, install steps, and threshold meanings:
[`scripts/load/README.md`](../scripts/load/README.md).

> [!CAUTION]
> Run the load test against **staging or localhost only — never production.**
> The script guards against the known prod hosts, but the responsibility to
> point it at the right target is yours.

---

## Teardown

- **Supabase branch**: delete the branch when done (Option A).
- **Vercel Preview**: preview deploys are disposable; delete the staging branch
  or leave it — no Production impact.
- **Helius**: delete the staging devnet webhook so it stops consuming events.
- **Cloud Run**: nothing to tear down if you reused the prod service.
