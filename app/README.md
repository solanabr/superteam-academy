# Superteam Academy Brazil 🇧🇷 — Decentralized LMS

![Superteam Academy Banner](https://superteam.fun/_next/image?url=%2F_next%2Fstatic%2Fmedia%2Fst-logo-white.ecfc780f.svg&w=256&q=75)

> A premium, fully decentralized Learning Management System built for **Superteam Brazil**. Learn Solana, complete challenges in the interactive Monaco editor, and earn verifiable on-chain XP tokens and Metaplex Core credential NFTs.

---

## 🌟 Key Features & Bonus Implementations

This submission fulfills **all core requirements** and includes multiple **Bonus Features** to provide a production-ready, superior platform.

*   **10 Fully Complete Pages**: Landing, Course Catalog, Course Detail, Lesson/Editor View, Dashboard, Profile, Leaderboard, Settings, and Verifiable Certificate.
*   **Actual Devnet Integration**: Connects directly to the live Superteam Academy Devnet Program (`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`). Includes all 6 PDA derivation strategies matching the program's architecture.
*   **Premium Custom UI/UX**: Distinctive dark-first design system utilizing **Framer Motion** for micro-interactions, glassmorphism, glowing accents, and `Space Grotesk`.
*   **Interactive Coding Arena**: Integrated Monaco Editor for in-browser Rust/TypeScript challenges, complete with embedded test assertions.
*   **Full i18n Localization**: Support for Portuguese (pt-BR), English (en), and Spanish (es) using `next-intl`.
*   **Dynamic Leaderboard & Social**: Real-time mock data structures preparing for Helius DAS indexer integration to sort users by Token-2022 XP balances.
*   **Vercel AI SDK Integration (Bonus)**: Dedicated floating AI Teaching Assistant built into the code editor view, allowing students to ask contextual Solana/Anchor questions.
*   **PWA Support (Bonus)**: Fully installable Progressive Web App with `manifest.json`.
*   **Technical SEO & Accessibility**: Schema.org JSON-LD structured data for Course, ItemList, and Organization schemas to maximize search discoverability.

---

## 🏗 Architecture & Code Quality

The codebase is engineered strictly for maintainability, type safety, and clean separation of concerns.

*   **Framework**: Next.js 14 (App Router)
*   **Language**: TypeScript (Strict Mode)
*   **Styling**: Tailwind CSS v4 + Lightning CSS + Custom CSS Variables
*   **Blockchain**: `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/wallet-adapter`
*   **State / Hooks**: Custom hooks (`useXP`, `useEnrollment`) abstracting away RPC calls.
*   **Library Utilities (`/src/lib`)**: Clean isolations for `pda.ts` (account derivation), `xp.ts` (level/percentage math), `bitmap.ts` (lesson tracking via u64 arrays), and `helius.ts` (NFT RPCs).
*   **Localization (`/src/i18n`)**: Server-side locale detection scaling across all content layers.

---

## 🚀 Getting Started

### 1. Requirements

*   Node.js 18.17+
*   npm or pnpm
*   A Solana Wallet (Phantom, Solflare, etc.) configured to Devnet

### 2. Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/solanabr/superteam-academy.git
   cd superteam-academy/app
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Environment Variables:
   Copy the example environment file and populate it (defaults for Devnet are provided).
   ```bash
   cp .env.local.example .env.local
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## 🎨 Walkthrough of Core Flows

### 1. Course Enrollment Pipeline
When a user clicks "Enroll", they construct a transaction utilizing the `getEnrollmentPda` generator. The layout transitions state optimistically while the frontend awaits the Devnet signature confirmation.

### 2. The Verification Engine
In `/src/app/courses/[slug]/lessons/[id]/page.tsx`, the interface splits into markdown content (left) and the programmable Editor (right). The `bitmap.ts` module updates the respective binary flag indicating completion upon successful challenge execution. 

### 3. Gamification loop
Earning XP updates the circular SVG progress ring dynamically on the `/dashboard` and recalculates the user's level. Course completion queries the Helius DAS API to retrieve and visually render the verifiable Metaplex Core certificate at `/certificates/[id]`.

---

## 🛠 Next Steps (Production)

As the platform transitions to Mainnet, the following backend steps are stubbed out and ready for connection:
*   Connect `/api/complete-lesson/route.ts` to backend signing authority.
*   Wire NextAuth to the Supabase Postgres instance for persistent user non-blockchain streaks.

Happy Building! 🌴☀️
