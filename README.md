# Superteam Academy

The ultimate Solana learning platform for LATAM developers. Built for the Superteam Brazil LMS Hackathon.

**Live Demo:** https://superteam-academy-ochre.vercel.app

## Features
- 🔐 Zero-friction auth via Privy (Google → silent Solana wallet)
- 🤖 AI Mentor in Monaco editor — explains Rust/Anchor errors in PT-BR/ES
- 🧠 Psychometric onboarding quiz — routes learners to correct track
- ⛓️ On-chain XP (Token-2022) + Metaplex Core NFT credentials
- 🌎 Full i18n: PT-BR, ES, EN
- 🎮 Gamification: XP, levels, streaks, achievements
- 📊 Analytics: GA4 + Clarity + Sentry

## Tech Stack
- Next.js 16 App Router + TypeScript + Tailwind + shadcn/ui
- Privy (auth + embedded wallets)
- Sanity CMS (course content)
- Supabase (community forum)
- Helius (Solana RPC + DAS API)
- Metaplex Core (NFT credentials)
- Gemini 2.0 Flash (AI mentor)

## Local Development
```bash
git clone https://github.com/drexthealpha/superteam-academy
cd superteam-academy/app
npm install
cp .env.example .env.local
# Fill in env vars (see below)
npm run dev
```

## Environment Variables
```
NEXT_PUBLIC_PRIVY_APP_ID=
GEMINI_API_KEY=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
NEXT_PUBLIC_HELIUS_API_KEY=
NEXT_PUBLIC_SENTRY_DSN=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_SOLANA_RPC=https://api.devnet.solana.com
```

## Deployment
Deployed on Vercel. Every push to main triggers a production deployment.