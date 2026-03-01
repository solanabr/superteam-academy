# Superteam Academy

A decentralized learning management system (LMS) for Solana development.

## 🚀 Quick Start

```bash
cd app
npm install --legacy-peer-deps
npm run dev
```

Open http://localhost:3000

## ✨ Features

- **10 Pages**: Landing, Courses, Course Detail, Lessons, Dashboard, Profile, Leaderboard, Settings, Certificates
- **Wallet Auth**: Phantom, Solflare support
- **Course System**: Browse courses, view lessons, code challenges
- **Gamification**: XP tracking, levels, credentials display
- **Tech Stack**: Next.js 15, TypeScript, Tailwind CSS, Framer Motion, Solana Web3.js

## 📁 Structure

```
app/src/
├── app/              # Pages (Next.js App Router)
├── components/       # React components
├── data/            # Course data
├── lib/             # Utilities (blockchain)
├── services/        # Business logic
└── types/           # TypeScript types
```

## 🔧 Environment

Create `.env.local`:
```env
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_ENDPOINT=https://api.devnet.solana.com
```

## 📦 Build

```bash
npm run build    # Production build
npm run dev      # Development server
```

## 📝 Bounty Submission

- All 10 pages functional
- Wallet integration working
- Course navigation complete
- Code editor in lessons
- XP/credentials (mock data)
- Build successful
- Ready for Vercel deployment

## License

MIT
