# 🎓 Superteam Academy — Decentralized LMS on Solana

A full-featured **Learning Management System** built for [Superteam Brazil](https://superteam.fun/) on the **Solana blockchain**. Students learn Web3 development through structured courses, earn points, pass quizzes, and receive **compressed NFT certificates** on-chain.

> **Bounty Submission**: Superteam Brazil Academy LMS ($4,800)

## ✨ Features

### 📚 Course Platform
- **6 courses** covering Solana fundamentals, Anchor smart contracts, DeFi, NFTs, Web3 frontend, and tokenomics
- **Structured curriculum**: Modules → Lessons → Quizzes
- **Rich lesson content** with code examples, tables, and interactive elements
- **Difficulty filtering** (Beginner, Intermediate, Advanced)
- **Search** across course catalog
- **Full Portuguese (pt-BR) localization**

### 🎯 Interactive Quizzes
- Multiple-choice quiz engine with instant feedback
- Visual correct/incorrect indicators
- Score calculation with 70% pass threshold
- On-chain progress checkpointing

### 🏆 Gamification
- **Points system** for completing lessons and quizzes
- **Leaderboard** ranking top students
- **Progress tracking** with visual progress bars
- **Activity feed** on student dashboard

### 🔐 Solana Integration
- **Wallet connection** via Phantom & Solflare (wallet-adapter)
- **Compressed NFT certificates** via Metaplex Bubblegum (~$0.001/cert)
- **Token-gated courses** (SPL token verification)
- **On-chain checkpoints** for quiz progress
- **Anchor smart contract** for Academy state management

### 🏗️ Architecture
- **Next.js 14** with App Router & TypeScript
- **Tailwind CSS** for responsive, modern UI
- **Prisma** ORM with PostgreSQL
- **Solana wallet-adapter** for Web3 connectivity
- **Metaplex Bubblegum** for compressed NFT minting
- **TanStack Query** for data fetching

## 🚀 Quick Start

```bash
# Clone
git clone https://github.com/Mint-Claw/superteam-academy.git
cd superteam-academy

# Install
npm install

# Environment
cp .env.example .env
# Edit .env with your database URL and Solana RPC

# Database (optional — app works with mock data)
npx prisma db push
npm run db:seed

# Run
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

## 📂 Project Structure

```
superteam-academy/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Landing page (Portuguese)
│   │   ├── courses/
│   │   │   ├── page.tsx                # Course catalog with filters
│   │   │   └── [slug]/
│   │   │       ├── page.tsx            # Course detail & curriculum
│   │   │       └── lessons/
│   │   │           └── [lessonId]/
│   │   │               └── page.tsx    # Lesson viewer & quiz engine
│   │   ├── dashboard/
│   │   │   └── page.tsx                # Student dashboard
│   │   ├── leaderboard/
│   │   │   └── page.tsx                # Points ranking
│   │   └── api/
│   │       ├── courses/route.ts        # Course CRUD
│   │       ├── progress/route.ts       # Progress tracking
│   │       └── certificates/route.ts   # NFT certificate minting
│   ├── components/
│   │   ├── navbar.tsx                  # Shared navigation
│   │   └── providers.tsx               # Solana + React Query providers
│   └── lib/
│       ├── courses-data.ts             # Course catalog & content
│       └── solana/
│           ├── certificates.ts         # Bubblegum compressed NFT minting
│           └── token-gate.ts           # SPL token verification
├── prisma/
│   └── schema.prisma                   # Database schema
├── programs/                           # Anchor smart contract
│   └── academy/
│       └── src/lib.rs
└── tailwind.config.ts
```

## 🔗 Solana Features Deep Dive

### Compressed NFT Certificates
Using **Metaplex Bubblegum**, certificates are minted as compressed NFTs on a Merkle tree. A single tree (maxDepth=14) supports ~16,384 certificates at ~$0.001 each.

```typescript
// Certificate minting flow
const umi = createUmiClient(authoritySecret)
const result = await mintCertificate(umi, MERKLE_TREE, {
  name: 'Superteam Academy - Intro to Solana',
  symbol: 'STCERT',
  uri: metadataUri,
  courseName: 'Introdução ao Solana',
  studentWallet: '7xK...',
  completionDate: '2026-02-16',
  grade: 'A',
})
```

### Token-Gated Courses
Advanced courses can require SPL token holdings for access:

```typescript
// Verify token holdings before granting access
const hasAccess = await verifyTokenHolding(
  connection,
  walletPublicKey,
  requiredTokenMint,
  minimumAmount
)
```

### On-Chain Progress
Quiz completions are recorded as checkpoints on-chain via the Academy Anchor program, creating a verifiable learning history.

## 🌐 Deployment

### Vercel (Recommended)
```bash
npm run build
vercel deploy
```

### Docker
```bash
docker build -t superteam-academy .
docker run -p 3000:3000 superteam-academy
```

## 🗺️ Roadmap

- [ ] Real-time collaboration (study groups)
- [ ] Video lessons with embedded coding exercises
- [ ] DAO governance for course curation
- [ ] Mobile app (React Native)
- [ ] Multi-language support (Spanish, English)
- [ ] Integration with Superteam Earn for bounty-based learning

## 📄 License

MIT — Built for the Superteam Brazil community.

---

**Built with ❤️ for Superteam Brazil** | [superteam.fun](https://superteam.fun/)
