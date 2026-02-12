# Superteam Academy LMS Frontend — healer-sol-learning

## Summary
Production-ready LMS frontend for Solana developer education: Next.js 14 (App Router), TypeScript strict, Tailwind, Radix UI, i18n (PT-BR, ES, EN), Solana Wallet Adapter, and clean stubs for on-chain integration.

## What's included
- **10 core pages**: Landing, Course catalog, Course detail, Lesson view, Dashboard, Profile, Leaderboard, Settings, Certificate view
- **Wallet**: Multi-wallet (Phantom, Solflare); select/change wallet working; modal styled to match app
- **Gamification**: XP, level, streak, leaderboard via `LearningProgressService` stub (localStorage); swap for on-chain later
- **Course flow**: Enroll & start / Continue with progress bar; curriculum list; lesson “Mark complete” persists XP
- **i18n**: PT-BR, ES, EN; language switcher in header
- **Theme**: Light/dark with next-themes
- **Docs**: README, ARCHITECTURE, CMS_GUIDE, CUSTOMIZATION

## How to run
```bash
cd app && npm install --legacy-peer-deps --ignore-scripts && npm run dev
```
Open http://localhost:3000 (redirects to /en).

## Branch
`healer-sol-learning`
