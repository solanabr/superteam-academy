# Deployment Guide

This document covers everything needed to deploy Superteam Academy from a fresh clone to a running production instance on Vercel. Follow each section in order for a first-time deployment.

---

## Prerequisites

| Tool | Version | Required | Notes |
|---|---|---|---|
| Node.js | 20+ | Yes | Check with `node -v` |
| npm | bundled with Node | Yes | Check with `npm -v` |
| Git | any | Yes | For cloning and pushing |
| Vercel CLI | latest | Optional | For CLI-based deploys |
| Solana CLI | 1.18+ | Optional | Only needed to generate the backend signer keypair if you do not already have one |

Install the Vercel CLI globally if you prefer CLI-based deployments:

```bash
npm install -g vercel
```

Install the Solana CLI if you need to generate a keypair:

```bash
sh -c "$(curl -sSfL https://release.solana.com/stable/install)"
```

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development, or configure these variables in your Vercel project dashboard for production.

```bash
cp .env.example .env.local
```

Variables prefixed with `NEXT_PUBLIC_` are embedded into the client bundle and are visible in the browser. All other variables are server-only and are never sent to the client.

### Solana

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Helius RPC endpoint URL including your API key | [helius.dev](https://helius.dev) — create a project, copy the devnet RPC URL |
| `NEXT_PUBLIC_SOLANA_NETWORK` | Yes | `devnet` or `mainnet-beta` | Set to `devnet` for all non-production deployments |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | The deployed on-chain program address | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` (devnet) — replace with your own if you redeploy the program |
| `NEXT_PUBLIC_XP_MINT` | Yes | Token-2022 XP mint address | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` (devnet) — must match the mint configured in the on-chain `Config` PDA |
| `BACKEND_SIGNER_KEYPAIR` | Yes | JSON byte array of the backend authority keypair — **server-only, never expose client-side** | Generate with `solana-keygen new --outfile backend-signer.json`, then paste the contents of the file as a JSON array |
| `HELIUS_API_KEY` | Yes | Helius API key used server-side for DAS queries (leaderboard, credential NFTs, XP balances) | [helius.dev/dashboard](https://helius.dev/dashboard) |

**Important:** `BACKEND_SIGNER_KEYPAIR` must be a JSON byte array (e.g., `[12,34,56,...]`), not a base58 private key. The value is loaded by `BackendSignerService` and must match the `backend_signer` field in the on-chain `Config` account. If there is a mismatch, all lesson completion and course finalization transactions will fail on-chain.

### Authentication (NextAuth v5)

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `AUTH_SECRET` | Yes | Random secret used to sign JWT session cookies | Generate with `openssl rand -base64 32` |
| `AUTH_GOOGLE_ID` | Yes | Google OAuth 2.0 client ID | Google Cloud Console (see Auth Setup below) |
| `AUTH_GOOGLE_SECRET` | Yes | Google OAuth 2.0 client secret | Google Cloud Console (see Auth Setup below) |
| `AUTH_GITHUB_ID` | Yes | GitHub OAuth App client ID | GitHub Developer Settings (see Auth Setup below) |
| `AUTH_GITHUB_SECRET` | Yes | GitHub OAuth App client secret | GitHub Developer Settings (see Auth Setup below) |

### Sanity CMS

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Sanity project ID — public, safe to expose in the browser | [sanity.io/manage](https://sanity.io/manage) — shown on the project overview page |
| `NEXT_PUBLIC_SANITY_DATASET` | Yes | Sanity dataset name, typically `production` | Set in the Sanity project settings; use `production` unless you created a named dataset |
| `SANITY_API_TOKEN` | Yes | Sanity API token with read/write permissions — **server-only** | [sanity.io/manage](https://sanity.io/manage) — API tab → Add API token |

### Analytics

All analytics variables are optional. The app functions fully without them.

| Variable | Required | Description | Where to get it |
|---|---|---|---|
| `NEXT_PUBLIC_GA4_MEASUREMENT_ID` | No | Google Analytics 4 measurement ID (format: `G-XXXXXXXXXX`) | [analytics.google.com](https://analytics.google.com) — Admin → Data Streams → Web stream details |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | PostHog project API key (format: `phc_XXXXXXXXXX`) | [app.posthog.com](https://app.posthog.com) — Project Settings → Project API Key |
| `NEXT_PUBLIC_POSTHOG_HOST` | No | PostHog ingestion host | `https://us.i.posthog.com` for US region; `https://eu.i.posthog.com` for EU |
| `NEXT_PUBLIC_CLARITY_ID` | No | Microsoft Clarity project ID | [clarity.microsoft.com](https://clarity.microsoft.com) — Settings → Overview |

---

## Local Development

### 1. Install dependencies

From the `app/` directory:

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in at minimum the required variables: Solana RPC, program ID, XP mint, backend signer keypair, Helius API key, NextAuth secret and OAuth credentials, and Sanity project ID/dataset/token.

### 3. Start the development server

```bash
npm run dev
```

The app runs at [http://localhost:3000](http://localhost:3000). The root URL automatically redirects to `/pt-BR` (the default locale). To access the English interface, navigate to [http://localhost:3000/en](http://localhost:3000/en).

### 4. Access Sanity Studio

The embedded Sanity Studio is available at:

```
http://localhost:3000/studio
```

You must be logged in to your Sanity account in the browser. See the [CMS Guide](./CMS_GUIDE.md) for authoring workflows.

### 5. Verify the build before deploying

```bash
npm run build
npm run lint
```

Both must pass with no errors before deploying to production.

---

## Vercel Deployment

### Step 1: Import the repository

1. Go to [vercel.com/new](https://vercel.com/new).
2. Connect your GitHub account and import the `superteam-academy` repository.
3. When prompted for the **Root Directory**, set it to `app` (the Next.js project lives in the `app/` subdirectory of the monorepo).
4. Vercel automatically detects Next.js — no custom build command or output directory is required.

### Step 2: Configure environment variables

In the Vercel project dashboard, go to **Settings > Environment Variables** and add every variable from the table above. For production, scope them to the **Production** environment. For preview branches, scope them to **Preview** as well.

You can also use the Vercel CLI to pull/push environment variables:

```bash
vercel env pull .env.local         # pull production env vars locally
vercel env add BACKEND_SIGNER_KEYPAIR production   # add a specific var
```

### Step 3: Configure OAuth redirect URIs for production

Before deploying, add your Vercel production domain to the allowed redirect URIs in both Google and GitHub OAuth apps (see Auth Setup below). NextAuth will fail to authenticate if the redirect URI is not whitelisted.

### Step 4: Deploy

Push to your `main` branch, or trigger a manual deploy from the Vercel dashboard:

```bash
git push origin main
```

Vercel runs `npm run build` automatically.

### Step 5: Set the production URL (if needed)

If you are running on a custom domain or a non-Vercel platform that requires explicit URL configuration, set:

```
NEXTAUTH_URL=https://your-production-domain.com
```

On Vercel, this variable is auto-detected from the deployment URL and is not required unless you have a custom domain configured separately.

---

## Sanity CMS Setup

### Step 1: Create a Sanity project

1. Go to [sanity.io/manage](https://sanity.io/manage).
2. Click **New project**.
3. Name the project (e.g., `superteam-academy`).
4. Choose a plan — the free plan is sufficient for development.
5. Note the **Project ID** shown on the project overview page. This is your `NEXT_PUBLIC_SANITY_PROJECT_ID`.

### Step 2: Create a dataset

A default dataset named `production` is created automatically. Use this unless you need a separate staging dataset.

Set `NEXT_PUBLIC_SANITY_DATASET=production` (or the name of your dataset).

### Step 3: Generate an API token

1. In the Sanity project, go to **API > Tokens**.
2. Click **Add API token**.
3. Name it `superteam-academy-server`.
4. Set permissions to **Editor** (needed for mutations from the Studio and draft access).
5. Copy the token — it is shown only once.
6. Set this value as `SANITY_API_TOKEN`.

### Step 4: Configure CORS origins

1. In the Sanity project, go to **API > CORS Origins**.
2. Add your development URL: `http://localhost:3000`
3. Add your production URL: `https://your-domain.com`
4. Check **Allow credentials** for both entries.

Without CORS configuration, the embedded Studio will fail to load and API calls from your domain will be blocked.

### Step 5: Deploy Sanity Studio (embedded)

The Studio is embedded in the Next.js app at `/studio`. It is deployed automatically as part of the Next.js build — no separate Sanity Studio deployment is needed. However, you must push the Studio configuration to Sanity's servers so it uses your schemas:

```bash
npx sanity deploy
```

When prompted, choose a Studio hostname (e.g., `superteam-academy`). This creates a standalone hosted Studio at `https://superteam-academy.sanity.studio` as a backup.

### Step 6: Seed initial content

After deploying, access the Studio at `/studio` and create your first Course, Lesson, and Instructor documents. Refer to the [CMS Guide](./CMS_GUIDE.md) for the full authoring workflow.

---

## Solana Configuration

### Program ID

The deployed on-chain program address is:

```
ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
```

This is pre-configured in `.env.example`. If you redeploy the on-chain program yourself (e.g., with a vanity keypair), update `NEXT_PUBLIC_PROGRAM_ID` to match your new program address.

### XP Mint address

The Token-2022 XP mint address must match the mint stored in the on-chain `Config` PDA. The pre-deployed devnet mint is:

```
xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
```

Set `NEXT_PUBLIC_XP_MINT` to this value.

### Helius RPC URL

The app uses Helius for both RPC calls and DAS (Digital Asset Standard) API queries. A standard Solana public RPC endpoint will not work for DAS queries.

1. Create an account at [helius.dev](https://helius.dev).
2. Create a new project.
3. Copy the **Devnet RPC URL** — it looks like: `https://devnet.helius-rpc.com/?api-key=YOUR_KEY`
4. Set `NEXT_PUBLIC_SOLANA_RPC_URL` to this URL.
5. Copy your API key separately and set `HELIUS_API_KEY` to it. The API key is used for server-side DAS calls in leaderboard and credential queries.

### Backend signer keypair setup

The backend signer is a server-side authority that co-signs lesson completion and course finalization transactions. The public key of this keypair must match the `backend_signer` field in the on-chain `Config` account.

**Generate a new keypair:**

```bash
solana-keygen new --outfile backend-signer.json --no-bip39-passphrase
```

**Read the byte array:**

```bash
cat backend-signer.json
```

The file contains a JSON byte array. Copy this entire array (including brackets) and set it as `BACKEND_SIGNER_KEYPAIR`:

```
BACKEND_SIGNER_KEYPAIR=[12,34,56,78,...]
```

**Security note:** This keypair gives the ability to mint XP tokens to any address. Never commit it to git, never expose it in client-side code, and never include it in `NEXT_PUBLIC_*` variables. In Vercel, set it with environment variable type **Sensitive** to prevent it from appearing in logs.

### Devnet vs mainnet

| Setting | Devnet | Mainnet |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_NETWORK` | `devnet` | `mainnet-beta` |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | `https://devnet.helius-rpc.com/?api-key=...` | `https://mainnet.helius-rpc.com/?api-key=...` |
| `NEXT_PUBLIC_PROGRAM_ID` | devnet program address | mainnet program address |
| `NEXT_PUBLIC_XP_MINT` | devnet mint address | mainnet mint address |

Always test fully on devnet before switching to mainnet. The frontend enforces the configured network — wallets on the wrong network will not be able to interact with on-chain instructions.

---

## Auth Setup

### Generate the NextAuth secret

```bash
openssl rand -base64 32
```

Set the output as `AUTH_SECRET`. This value must be the same across all instances (including preview deployments) or sessions will be invalidated on redeploy.

### Google OAuth

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project or select an existing one.
3. Go to **APIs & Services > Credentials**.
4. Click **Create Credentials > OAuth 2.0 Client ID**.
5. Choose **Web application** as the application type.
6. Add the following to **Authorized redirect URIs**:
   - Local: `http://localhost:3000/api/auth/callback/google`
   - Production: `https://your-domain.com/api/auth/callback/google`
7. Copy the **Client ID** → `AUTH_GOOGLE_ID`
8. Copy the **Client secret** → `AUTH_GOOGLE_SECRET`

If you have not configured the OAuth consent screen, Google will prompt you to do so before creating credentials. Set the app name, support email, and authorized domains.

### GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers).
2. Click **OAuth Apps > New OAuth App**.
3. Fill in:
   - **Application name**: Superteam Academy
   - **Homepage URL**: your production URL
   - **Authorization callback URL**: `https://your-domain.com/api/auth/callback/github`
4. For local development, create a separate OAuth App with callback URL `http://localhost:3000/api/auth/callback/github`.
5. Copy the **Client ID** → `AUTH_GITHUB_ID`
6. Click **Generate a new client secret** → `AUTH_GITHUB_SECRET`

---

## Analytics Setup

All analytics integrations are optional. The app loads analytics providers only when their respective environment variables are set.

### Google Analytics 4

1. Go to [analytics.google.com](https://analytics.google.com).
2. Create a new property for your domain.
3. Add a **Web** data stream and enter your production URL.
4. Copy the **Measurement ID** (format: `G-XXXXXXXXXX`).
5. Set `NEXT_PUBLIC_GA4_MEASUREMENT_ID=G-XXXXXXXXXX`.

### PostHog

1. Create an account at [posthog.com](https://posthog.com) or [eu.posthog.com](https://eu.posthog.com).
2. Create a new project.
3. Go to **Project Settings**.
4. Copy the **Project API Key** (format: `phc_XXXXXXXXXX`).
5. Set `NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXX`.
6. Set `NEXT_PUBLIC_POSTHOG_HOST` to `https://us.i.posthog.com` (US) or `https://eu.i.posthog.com` (EU).

### Microsoft Clarity

1. Go to [clarity.microsoft.com](https://clarity.microsoft.com).
2. Click **Add new project** and enter your domain.
3. Copy the **Project ID** shown in the setup snippet (the alphanumeric string after `clarity("init", ...)`).
4. Set `NEXT_PUBLIC_CLARITY_ID=your-project-id`.

---

## Post-Deploy Checklist

Run through this checklist after each production deployment.

### Application health

- [ ] Root URL (`/`) redirects to `/pt-BR` (default locale)
- [ ] Language switcher works — switching to `/en` and `/es` loads translated strings
- [ ] Dark mode toggle persists across page loads
- [ ] No JavaScript console errors on the landing page

### Authentication

- [ ] Google OAuth sign-in flow completes without errors
- [ ] GitHub OAuth sign-in flow completes without errors
- [ ] Session persists across page refreshes (cookie set correctly)
- [ ] Sign-out clears the session

### Sanity CMS

- [ ] `/studio` loads and authenticates with your Sanity account
- [ ] Course catalog page (`/en/courses`) shows published courses from Sanity
- [ ] Course thumbnails load from `cdn.sanity.io`
- [ ] ISR is working — editing a course in Studio and publishing it reflects in the app within 60 seconds

### Solana / On-Chain

- [ ] Wallet connect button is visible in the header
- [ ] Phantom (or another Solana wallet) connects on devnet
- [ ] Wallet address is displayed correctly after connecting
- [ ] Enrolling in a course prompts a wallet signature and creates the enrollment PDA on devnet
- [ ] XP balance displays after completing a lesson (may take 30-60 seconds for on-chain confirmation)
- [ ] Leaderboard page loads and displays XP holders (requires at least one completed lesson on devnet)

### Credential NFTs

- [ ] After course finalization, the credential issuance flow completes without errors
- [ ] The issued credential NFT is visible on the `/certificates/{assetId}` page
- [ ] The NFT is visible in the wallet's collectibles tab (Phantom reads Metaplex Core assets via DAS)

### Analytics

- [ ] Real-time view in GA4 shows activity when browsing the site
- [ ] PostHog session recording appears in the project dashboard
---

## Troubleshooting

### CORS errors from Sanity

The browser console shows errors like `blocked by CORS policy` when the Studio or GROQ queries load.

**Fix:** Add your domain to **API > CORS Origins** in the Sanity project settings at [sanity.io/manage](https://sanity.io/manage). Include both `http://localhost:3000` for development and your production domain. Enable **Allow credentials**.

---

### Missing or incorrect environment variable at build time

The build fails with errors like `NEXT_PUBLIC_SANITY_PROJECT_ID is not defined` or the app renders without data.

**Fix:** Verify that every required variable is set in Vercel under **Settings > Environment Variables**. Variables set after the last deploy require a new deployment to take effect — trigger one manually from the Vercel dashboard or by pushing a new commit.

---

### Wallet adapter errors ("WalletNotConnectedError", "WalletSignTransactionError")

The wallet modal opens but transactions fail or the wallet disconnects unexpectedly.

**Steps:**
1. Confirm your wallet is set to **Devnet** in its network settings (not Mainnet or Testnet).
2. Ensure `NEXT_PUBLIC_SOLANA_NETWORK=devnet` matches the wallet's network.
3. Clear the wallet's site connection in the wallet app settings and reconnect.
4. If the error is `WalletNotConnectedError` in the console but the UI shows the wallet as connected, refresh the page — this is a hydration race condition resolved by a full reload.

---

### Sanity Studio not loading at `/studio`

The `/studio` route renders a blank page or shows an auth error.

**Steps:**
1. Verify `NEXT_PUBLIC_SANITY_PROJECT_ID` and `NEXT_PUBLIC_SANITY_DATASET` are set.
2. Confirm you are logged in to your Sanity account in the browser (try [sanity.io](https://sanity.io) in the same browser session).
3. Check that your domain is listed in the Sanity CORS origins.
4. If running locally, ensure `npm run dev` is active and the Studio page is rendered by `src/app/studio/[[...tool]]/page.tsx`.

---

### XP balance showing 0 after lesson completion

The learner completes a lesson but the XP counter in the UI stays at zero.

**Steps:**
1. Check the response from `POST /api/progress/complete-lesson` in the browser network tab. A non-200 response indicates a backend signer error.
2. Verify `BACKEND_SIGNER_KEYPAIR` is set correctly as a JSON byte array.
3. Confirm the backend signer's public key matches the `backend_signer` field in the on-chain `Config` PDA. You can inspect the Config account on [explorer.solana.com](https://explorer.solana.com/?cluster=devnet).
4. Verify `HELIUS_API_KEY` is set — the XP balance is fetched via Helius Token-2022 account queries. A missing API key will return an empty balance even after successful minting.

---

### Leaderboard empty or not updating

The leaderboard page renders but shows no entries, or entries are stale.

**Steps:**
1. Confirm `HELIUS_API_KEY` is set server-side (not `NEXT_PUBLIC_`).
2. Verify `NEXT_PUBLIC_XP_MINT` matches the XP mint address used by the deployed program. A mismatch means Helius queries the wrong mint and returns zero holders.
3. The leaderboard is ISR-cached for 5 minutes (`revalidate = 300`). New completions appear after the cache expires — this is expected behavior.
4. At least one learner must have completed a lesson for the leaderboard to have data.

---

### OAuth callback error ("State mismatch" or redirect loop)

NextAuth shows a callback error after signing in with Google or GitHub.

**Steps:**
1. Verify the authorized redirect URI in the OAuth app settings exactly matches the URL NextAuth uses: `https://your-domain.com/api/auth/callback/google` (or `/github`). Trailing slashes and HTTP vs HTTPS mismatches will cause failures.
2. Confirm `AUTH_SECRET` is set and is consistent across all deployments. Rotating this secret invalidates all existing sessions.
3. On Vercel, the production URL is auto-detected. If you use a custom domain, ensure it is configured as the primary domain in Vercel project settings.

---

### "Buffer is not defined" error

A server or client error references `Buffer is not defined`.

**Fix:** Clear the `.next/` cache and rebuild:

```bash
rm -rf .next
npm run build
```

The webpack configuration in `next.config.ts` disables Node.js built-in module resolution (`buffer`, `crypto`, `stream`) to prevent bundling errors. If `Buffer is not defined` occurs at runtime, clear `.next/` and rebuild from scratch.

---

### Credential NFT not appearing in wallet

The `finalize-course` API returns a signature but the NFT is not visible in the wallet.

**Steps:**
1. Confirm the transaction signature is valid by looking it up on [explorer.solana.com](https://explorer.solana.com/?cluster=devnet).
2. The wallet may cache asset lists — disconnect and reconnect the wallet, or wait a few minutes for Helius DAS to index the new asset.
3. Verify the credential was issued to the correct wallet address (logged in `BackendSignerService` at the time of issuance).
4. Metaplex Core NFTs require a DAS-compatible wallet to display. Phantom and Backpack support Core assets. Older wallet versions may not show them.
