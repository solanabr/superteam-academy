# Superteam Academy 🚀

![Superteam Academy Banner](https://superteam.fun/_next/image?url=%2Fassets%2Fsuperteam-logo.svg&w=128&q=75)

> **The Ultimate Interactive Hub for Solana Native Builders**

[![Live Demo](https://img.shields.io/badge/Live-Demo-brightgreen.svg?style=for-the-badge&logo=vercel)](https://superteam-academy.vercel.app)
[![Solana](https://img.shields.io/badge/Solana-Devnet-blueviolet?style=for-the-badge&logo=solana)](https://solana.com)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](LICENSE)
[![Next.js](https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js)](https://nextjs.org)

**Superteam Academy** is an open-source Learning Management System (LMS) built specifically for the **Solana ecosystem**. It combines interactive coding challenges, Web3 authentication, and on-chain gamification to turn curious developers into shipping Solana builders.

---

## 🌟 Key Features

### 💻 Interactive Learning
- **In-Browser IDE**: Write Rust, TypeScript, and Anchor code directly in the browser (powered by Monaco Editor).
- **Instant Feedback**: Real-time code validation and syntax highlighting.
- **Split-Screen Layout**: Read lesson content and code simultaneously.

### 🎮 Web3 Gamification
- **XP System**: Earn on-chain XP tokens for completing lessons.
- **Leveling**: Progress from "Novice" to "Grandmaster" based on your activity.
- **Streaks**: Daily activity tracking with visual heatmaps (like GitHub).
- **Skill Radar**: Visualize your proficiency in Rust, Anchor, DeFi, and more.

### 🔐 Multi-Auth System
- **Wallet Login**: Seamless integration with **Phantom** and **Solflare**.
- **Social Login**: One-click sign-up via **Google** or **GitHub** (powered by NextAuth.js).
- **Unified Profile**: Link your wallet to your social identity for a persistent profile.

### 📊 Dashboard & Progress
- **Real-Time Leaderboard**: Compete with other builders globally.
- **cNFT Certificates**: Mint compressed NFTs (via Metaplex Bubblegum) upon course completion.
- **Local Persistence**: Auto-save progress, settings, and themes.

---

## 🏗️ Project Structure

The project follows a clean, modular **Next.js 16 (App Router)** architecture.

```bash
superteam-academy/
├── app/
│   ├── src/
│   │   ├── app/                # Next.js App Router
│   │   │   ├── (site)/         # Main website layout group
│   │   │   │   ├── (main)/     # Pages with Navbar/Footer (Home, Dashboard, Courses)
│   │   │   │   └── lesson/     # Distraction-free learning layout
│   │   │   ├── (studio)/       # Sanity CMS Studio layout group
│   │   │   └── api/            # Serverless API routes (Auth, NFTs)
│   │   ├── components/         # Reusable React components
│   │   │   ├── dashboard/      # Specific dashboard widgets (Radar, Heatmap)
│   │   │   ├── layout/         # Navbar, Footer
│   │   │   ├── shared/         # Common UIs (AuthModal, CodeEditor, Hero)
│   │   │   └── ui/             # Shadcn UI primitives (Buttons, Dialogs, etc.)
│   │   ├── contexts/           # Global state (Auth, Theme, Lang, wallet)
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utilities & helper functions
│   │   ├── sanity/             # Sanity CMS configuration & schemas
│   │   ├── services/           # Business logic layer (Interfaces & Implementations)
│   │   │   ├── local/          # LocalStorage implementations (Current Phase)
│   │   │   └── onchain/        # Solana program clients (Future Phase)
│   │   └── types/              # TypeScript type definitions
│   ├── public/                 # Static assets
│   ├── next.config.ts          # Next.js configuration
│   └── package.json            # Project dependencies
└── README.md                   # You are here!
```

---

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) + [Shadcn UI](https://ui.shadcn.com/)
- **Charts**: [Recharts](https://recharts.org/) & [React Calendar Heatmap](https://github.com/kevinsqi/react-calendar-heatmap)
- **CMS**: [Sanity.io](https://www.sanity.io/) (Headless CMS)
- **Auth**: [NextAuth.js v5](https://authjs.dev/) + [Solana Wallet Adapter](https://github.com/solana-labs/wallet-adapter)
- **Editor**: [Monaco Editor](https://microsoft.github.io/monaco-editor/)
- **Deployment**: [Vercel](https://vercel.com/)

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ installed
- A Sanity.io project (free tier is sufficient)
- A Solana wallet (Phantom or Solflare)

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/panzauto46-bot/superteam-academy.git
    cd superteam-academy/app
    ```

2.  **Install dependencies**
    ```bash
    npm install --legacy-peer-deps
    ```

3.  **Configure Environment Variables**
    Create a `.env.local` file in the `app` directory with the following keys:
    ```env
    # Sanity CMS (Required)
    NEXT_PUBLIC_SANITY_PROJECT_ID=your_project_id
    NEXT_PUBLIC_SANITY_DATASET=production
    NEXT_PUBLIC_SANITY_API_VERSION=2024-02-01

    # NextAuth (Required)
    AUTH_SECRET=your_generated_secret
    NEXTAUTH_URL=http://localhost:3000

    # Social Auth (Optional)
    GOOGLE_CLIENT_ID=your_google_id
    GOOGLE_CLIENT_SECRET=your_google_secret
    GITHUB_ID=your_github_id
    GITHUB_SECRET=your_github_secret
    ```

4.  **Run Development Server**
    ```bash
    npm run dev
    ```

5.  **Open browser** to `http://localhost:3000`

---

## 🗺️ Roadmap

### Phase 1-3: Foundation & UI/UX (Completed ✅)
- [x] Next.js 16 Setup & Clean Architecture
- [x] Dark Mode & Glassmorphism Design
- [x] Multi-Auth (Wallet + Social) Integration

### Phase 4: Service Layer & Gamification (Completed ✅)
- [x] Local Storage Persistence for User Progress
- [x] Skill Radar & Activity Heatmap implementation
- [x] Settings Page (Profile, Language, Theme)
- [x] Sanity CMS Schema Setup

### Phase 5: Deployment (Completed ✅)
- [x] Vercel Deployment Optimization
- [x] Environment Variable Guide

### Phase 6: Content & Backend (Upcoming 🔄)
- [ ] Connect Frontend to Real Sanity Data
- [ ] Implement On-Chain Anchor Program Integration
- [ ] Mint real cNFTs on Devnet

---

## 🤝 Contributing

We welcome contributions from the community! Whether it's fixing bugs, adding new lessons, or improving documentation.

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4.  Push to the Branch (`git push origin feature/AmazingFeature`)
5.  Open a Pull Request

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.

---

<p align="center">
  Built with ❤️ by Superteam Academy Builders
</p>
