# ![Superteam Academy Logo](app/public/icons/icon-192x192.png) Superteam Academy — Ultimate Web3 LMS

> A production-grade, gamified, multilingual learning platform where developers master Solana by shipping real on-chain applications.

## 🏆 Why this project wins
Superteam Academy combines world-class LMS UX with verifiable on-chain progress, creator-grade CMS tooling, and anti-cheat coding challenges—purpose-built for the Superteam Brazil hackathon.

## 📸 Product Screenshots
- Dashboard: _add screenshot path here_
- Course View: _add screenshot path here_
- Profile Trophy Room: _add screenshot path here_

## ✨ Core Features
- **Immersive Learning Experience**
  - Structured onboarding flow with quiz-driven recommendations.
  - Interactive lesson split-view with markdown theory + coding terminal experience.
- **Web3 Native Credentialing**
  - Metaplex Core NFT credentials.
  - Downloadable and shareable course certificates.
- **Advanced Gamification**
  - XP economy, streak tracking, daily quests, and leaderboard progression.
- **Creator + Admin CMS**
  - Creator and admin dashboards for curriculum operations.
  - Publishing and review flows for blockchain-backed courses.
- **Anti-Cheat Validation Engine**
  - Structured validation rules for coding tasks.
  - Deterministic checks to reduce copy/paste abuse.

## 🧱 Tech Stack
- **Frontend:** Next.js 14 (App Router), React, Tailwind CSS, shadcn/ui, Framer Motion, next-intl
- **Backend:** Next.js Route Handlers, Prisma ORM, PostgreSQL
- **Web3:** Solana + Anchor, `@solana/web3.js`, Metaplex Core, Token-2022
- **Infra & Observability:** Vercel, Sentry, PostHog
- **Testing:** Playwright E2E + project-level scripts

## 🚀 Local Setup
1. **Install dependencies**
   ```bash
   cd app
   pnpm install
   ```

2. **Configure environment**
   Create `app/.env.local` and provide the required values:
   ```env
   DATABASE_URL="postgresql://..."
   NEXTAUTH_URL="http://localhost:3000"
   NEXTAUTH_SECRET="..."
   NEXT_PUBLIC_PROGRAM_ID="..."
   NEXT_PUBLIC_XP_MINT="..."
   BACKEND_SIGNER_KEYPAIR="../wallets/signer.json"
   ```

3. **Run migrations and seed (optional but recommended)**
   ```bash
   pnpm prisma migrate deploy
   pnpm prisma db seed
   ```

4. **Start dev server**
   ```bash
   pnpm dev
   ```

5. Open `http://localhost:3000`.

## 🧠 Hybrid Web2/Web3 Architecture
- **Web2 layer:** Next.js + Prisma/Postgres manages users, progress caching, localization, and CMS workflows.
- **Web3 layer:** Anchor program state handles immutable course logic, rewards, and credential issuance.
- **Bridge layer:** API routes synchronize wallet actions, admin publishing, and NFT metadata into a smooth product UX.

## 📜 License
MIT
