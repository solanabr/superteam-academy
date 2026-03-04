# Environment Setup Guide

This guide walks you through generating every secret and API key needed to run Superteam Academy.

> **No env vars?** The app runs fully on mock data with `pnpm dev` — no setup required for local development.

---

## 1. Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Once created, go to **Settings → API**
3. Copy:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Run the migration to create tables:
   - Go to **SQL Editor** in the Supabase dashboard
   - Paste the contents of `supabase/migrations/001_initial.sql`
   - Click **Run**

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6...
```

---

## 2. Sanity CMS

1. Install the Sanity CLI:
   ```bash
   npm install -g @sanity/cli
   ```
2. Create a project at [sanity.io/manage](https://www.sanity.io/manage) or run:
   ```bash
   npx sanity init
   ```
3. From your Sanity project dashboard, copy:
   - **Project ID** → `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - **Dataset** → `NEXT_PUBLIC_SANITY_DATASET` (usually `production`)

```env
NEXT_PUBLIC_SANITY_PROJECT_ID=abc123xyz
NEXT_PUBLIC_SANITY_DATASET=production
```

### Sanity Webhook (optional)

To get real-time content updates when editors publish in Sanity:

1. Go to [sanity.io/manage](https://www.sanity.io/manage) → your project → **API → Webhooks**
2. Click **Create Webhook** and fill in:

| Field | Value |
|-------|-------|
| **Name** | `Superteam Academy Revalidation` |
| **URL** | `https://your-domain.com/api/webhooks/sanity` |
| **Trigger on** | Check all: **Create**, **Update**, **Delete** |
| **Filter** | Leave empty (fires for all document types) |
| **Projection** | `{_type}` |
| **Status** | Enabled |
| **HTTP method** | **POST** |
| **HTTP Headers** | Leave empty (not needed) |
| **Secret** | Paste the secret you generate below |

3. Generate a secret:

```bash
openssl rand -hex 32
```

4. Paste the generated string into the **Secret** field in Sanity's webhook form. Sanity will use this to sign every request with an HMAC-SHA256 signature in the `sanity-webhook-signature` header. Our handler verifies this signature automatically.

5. Add the same secret to your `.env.local`:

```env
SANITY_WEBHOOK_SECRET=your_generated_hex_string
```

> **Note:** The projection `{_type}` tells Sanity to only send the document type in the payload, which is all our webhook handler needs to decide which cache tag to revalidate. This keeps payloads small and avoids leaking content data.

---

## 3. Auth (NextAuth.js v5)

### AUTH_SECRET

A random string used to encrypt session tokens.

```bash
# Option 1: openssl
openssl rand -base64 32

# Option 2: npx
npx auth secret
```

```env
AUTH_SECRET=your_generated_base64_string
```

### GitHub OAuth

1. Go to [github.com/settings/developers](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name:** Superteam Academy
   - **Homepage URL:** `http://localhost:3000`
   - **Authorization callback URL:** `http://localhost:3000/api/auth/callback/github`
4. Click **Register application**
5. Copy **Client ID** → `GITHUB_ID`
6. Click **Generate a new client secret**, copy it → `GITHUB_SECRET`

```env
GITHUB_ID=Iv1.xxxxxxxxxxxx
GITHUB_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

> For production, update the URLs to your deployed domain.

### Google OAuth

1. Go to [console.cloud.google.com/apis/credentials](https://console.cloud.google.com/apis/credentials)
2. Create a new project (or select existing)
3. Click **Create Credentials → OAuth client ID**
4. If prompted, configure the **OAuth consent screen** first:
   - User type: External
   - App name: Superteam Academy
   - Add your email as a test user
5. Back in Credentials, create an **OAuth client ID**:
   - Application type: **Web application**
   - Authorized redirect URIs: `http://localhost:3000/api/auth/callback/google`
6. Copy **Client ID** → `GOOGLE_ID`
7. Copy **Client Secret** → `GOOGLE_SECRET`

```env
GOOGLE_ID=xxxxxxxxxxxx.apps.googleusercontent.com
GOOGLE_SECRET=GOCSPX-xxxxxxxxxxxxxxxxxxxx
```

---

## 4. Solana

### RPC URL

The default uses Solana's public devnet. For production, use a dedicated RPC:

| Provider | Free Tier | URL |
|----------|-----------|-----|
| [Helius](https://helius.dev) | 50k credits/day | `https://devnet.helius-rpc.com/?api-key=YOUR_KEY` |
| [QuickNode](https://quicknode.com) | Limited | Dashboard → Endpoints |
| [Alchemy](https://alchemy.com) | 300M CU/month | Dashboard → Apps |
| Public (default) | Rate limited | `https://api.devnet.solana.com` |

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=your_key
```

### Program ID (optional)

Only needed if you've deployed the on-chain program:

```env
NEXT_PUBLIC_PROGRAM_ID=YourProgramPublicKeyBase58
```

---

## 5. Analytics (optional)

### PostHog

1. Sign up at [posthog.com](https://posthog.com) (free tier: 1M events/month)
2. Go to **Settings → Project → API Key**
3. Copy the project API key

```env
NEXT_PUBLIC_POSTHOG_KEY=phc_xxxxxxxxxxxxxxxxxxxx
NEXT_PUBLIC_POSTHOG_HOST=https://us.i.posthog.com
```

### Google Analytics (GA4)

1. Go to [analytics.google.com](https://analytics.google.com)
2. Create a property → Get a **Measurement ID**

```env
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
```

---

## 6. Sentry (optional)

1. Sign up at [sentry.io](https://sentry.io) (free tier: 5k errors/month)
2. Create a Next.js project
3. Copy the DSN from **Settings → Client Keys (DSN)**

```env
SENTRY_DSN=https://xxxx@xxx.ingest.sentry.io/xxxxx
```

---

## Quick Setup Checklist

| Variable | Required? | Where to get it |
|----------|-----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | For real data | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | For real data | Supabase dashboard → Settings → API |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | For CMS content | sanity.io/manage |
| `NEXT_PUBLIC_SANITY_DATASET` | For CMS content | sanity.io/manage |
| `AUTH_SECRET` | For auth | `openssl rand -base64 32` |
| `GITHUB_ID` | For GitHub login | github.com/settings/developers |
| `GITHUB_SECRET` | For GitHub login | github.com/settings/developers |
| `GOOGLE_ID` | For Google login | console.cloud.google.com |
| `GOOGLE_SECRET` | For Google login | console.cloud.google.com |
| `NEXT_PUBLIC_SOLANA_RPC_URL` | No (has default) | Helius / QuickNode / Alchemy |
| `NEXT_PUBLIC_PROGRAM_ID` | No | After program deployment |
| `NEXT_PUBLIC_POSTHOG_KEY` | No | posthog.com |
| `NEXT_PUBLIC_GA_ID` | No | analytics.google.com |
| `SENTRY_DSN` | No | sentry.io |
| `SANITY_WEBHOOK_SECRET` | No | `openssl rand -hex 32` |

---

## Applying Your Config

```bash
cp .env.example .env.local
# Edit .env.local with your values
pnpm dev
```
