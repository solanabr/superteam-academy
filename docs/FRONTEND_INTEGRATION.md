# Frontend Integration Notes

## Live Demo
https://superteam-academy.vercel.app

## Architecture
- XP = Token-2022 soulbound token. Level = floor(sqrt(xp / 100))
- Credentials = Metaplex Core NFTs with PermanentFreezeDelegate
- Course PDAs + Enrollment PDAs per learner
- 256-bit lesson bitmap per enrollment
- Leaderboard = off-chain via Helius DAS API
- Streaks = frontend only (Supabase + localStorage)

## Stack
Next.js 14 · TypeScript · Supabase · @solana/wallet-adapter · next-intl (EN/PT-BR/ES)
