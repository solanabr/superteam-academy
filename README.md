# Superteam Academy LMS 🎓

The ultimate open-source, interactive learning platform for Solana-native developers. Built for the Superteam Brazil hackathon.

## 🌟 Features

*   **Interactive Coding:** Integrated Monaco Editor with real-time Rust/Anchor syntax highlighting and custom Regex-based AST validation.
*   **On-Chain Rewards:** Earn Soulbound XP tokens (Token-2022) directly to your wallet for completing lessons.
*   **Verifiable Credentials:** Receive an evolving Metaplex Core cNFT upon course completion.
*   **Advanced Gamification:** Daily quests, 30-day streak heatmaps, and a dynamic global leaderboard.
*   **Headless CMS & Admin Dashboard:** Create and publish new courses as PDAs directly to the Solana blockchain from a beautiful UI.
*   **Hybrid Authentication:** Sign in with Phantom/Solflare or Web2 socials (GitHub/Google) via NextAuth, with seamless wallet linking.
*   **Enterprise Ready:** Built with Next.js 14 App Router, fully internationalized (i18n), PWA ready, 100/100 Lighthouse score, and integrated with Sentry & PostHog.

## 🏗️ Tech Stack

*   **Frontend:** Next.js 14 (App Router), React 18, Tailwind CSS, shadcn/ui, Framer Motion.
*   **Backend:** Next.js API Routes, Prisma ORM, MongoDB.
*   **Web3:** `@solana/web3.js`, Anchor framework, Metaplex Core (UMI), Token-2022.
*   **Testing:** Playwright E2E.

## 🚀 Quick Start

1.  **Clone & Install**
    ```bash
    git clone https://github.com/YOUR_GITHUB/my-superteam-project.git
    cd my-superteam-project/app
    pnpm install
    ```

2.  **Environment Variables**
    Create `.env.local` in the `app` directory:
    ```env
    DATABASE_URL="mongodb+srv://..."
    NEXT_PUBLIC_PROGRAM_ID="..."
    NEXT_PUBLIC_XP_MINT="..."
    BACKEND_SIGNER_KEYPAIR="../wallets/signer.json"
    # See .env.example for GitHub/Google OAuth keys
    ```

3.  **Run Development Server**
    ```bash
    pnpm dev
    ```
    Open [http://localhost:3000](http://localhost:3000).

## 📄 License
MIT