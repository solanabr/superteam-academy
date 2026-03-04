# Sanity Seed Script

Populates the Sanity CMS with sample course content for Superteam Academy.

## What it creates

- **1 instructor**: Sofia Santos
- **3 challenges**: Token Basics, PDA Derivation, Hello Anchor (Contador)
- **Course 1**: "Introdução ao Solana" (pt-BR, difficulty 1, trackId 1)
  - Module 1: "Fundamentos da Solana" — 3 lessons (What is Solana, Wallets & Transactions, Token Program Basics)
  - Module 2: "Construindo na Solana" — 3 lessons (PDAs & CPIs, Introdução ao Anchor, Build Your First Program)
- **Course 2**: "Token Program em Profundidade" (pt-BR, difficulty 2, trackId 4)
  - Module 1: "Token-2022 em Profundidade" — 3 lessons (Token-2022 & Extensions, NonTransferable & PermanentDelegate, On-Chain Metadata)

The script is **idempotent** — safe to run multiple times. Uses `createOrReplace` with deterministic document IDs.

## Prerequisites

1. A Sanity project with the Superteam Academy schemas deployed
2. A Sanity API token with **write access** (Editor or higher)

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | Yes | Your Sanity project ID |
| `SANITY_API_TOKEN` | Yes | API token with write access |
| `NEXT_PUBLIC_SANITY_DATASET` | No | Defaults to `production` |

## How to run

From the `app/` directory:

```bash
NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id SANITY_API_TOKEN=your_token node scripts/seed-sanity.mjs
```

Or set variables in your `.env.local` and source them:

```bash
set -a && source .env.local && set +a
node scripts/seed-sanity.mjs
```

## Getting a write token

1. Go to [sanity.io/manage](https://sanity.io/manage)
2. Select your project
3. Navigate to **API** → **Tokens**
4. Click **Add API token**, choose **Editor** permission
5. Copy the token — it is only shown once
