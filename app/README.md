# Superteam Academy — Solana Learning Management System (LMS) dApp

> A production-ready, gamified learning platform for the Solana ecosystem with interactive courses, on-chain credentials, and a vibrant community leaderboard.

![Superteam Academy](https://img.shields.io/badge/Solana-Devnet-blueviolet) ![License](https://img.shields.io/badge/license-MIT-green) ![Next.js](https://img.shields.io/badge/Next.js-16-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5.x-blue) ![i18n](https://img.shields.io/badge/i18n-3%20languages-orange)

## 🚀 Overview

Superteam Academy is the most comprehensive Solana learning platform, built for the Superteam Brazil ecosystem. It combines **interactive coding challenges** with **on-chain credentials** and a **gamified learning experience** to make blockchain education accessible, engaging, and verifiable.

### Key Features

| Feature | Description |
|---------|-------------|
| 🎓 **Interactive Courses** | Structured modules with markdown content, video lessons, and hands-on coding challenges |
| 💻 **Monaco Code Editor** | Built-in code editor with syntax highlighting, test case validation, and real-time feedback |
| 🏆 **Gamification** | XP system, daily streaks, achievements/badges, and competitive leaderboard |
| 🔗 **On-Chain Credentials** | Soulbound NFT certificates verified on the Solana blockchain |
| 🌍 **Multilingual (i18n)** | Full support for Portuguese (PT-BR), English (EN), and Spanish (ES) |
| 🌙 **Dark/Light Theme** | Solana-inspired dark-first design with glassmorphism and gradient effects |
| 👛 **Wallet Integration** | Phantom & Solflare wallet support via `@solana/wallet-adapter` |
| 📊 **Skills Radar** | Visual skills progression chart using Recharts |
| 📅 **Streak Calendar** | GitHub-style activity calendar for learning streaks |
| 🔍 **Advanced Search** | Course filtering by difficulty, track, and keywords |

## 📸 Screenshots

*Run the dev server to explore the full application locally.*

## 🏗️ Architecture

```
app/src/
├── app/                    # Next.js App Router pages
│   ├── page.tsx           # Landing page (hero, paths, features, testimonials)
│   ├── courses/           # Course catalog + detail + lesson views
│   │   ├── page.tsx       # Filterable course grid
│   │   └── [slug]/        # Dynamic course pages
│   │       ├── page.tsx   # Course detail with modules
│   │       └── lessons/
│   │           └── [id]/  # Interactive lesson viewer
│   ├── dashboard/         # User learning dashboard
│   ├── leaderboard/       # Community rankings
│   ├── profile/           # User profile with skills radar
│   ├── settings/          # Account settings (4 tabs)
│   └── certificates/      # On-chain credential viewer
├── components/
│   ├── layout/            # Header (wallet, i18n, theme) & Footer
│   └── providers.tsx      # Solana + Theme providers
├── services/              # Service layer (Course, Progress, Leaderboard, etc.)
├── lib/
│   ├── constants.ts       # Program IDs, config, navigation
│   ├── mock-data.ts       # Comprehensive mock data (6 courses, 14 achievements)
│   └── utils.ts           # Helpers (XP calc, address formatting, bitmap ops)
├── types/                 # TypeScript interfaces for all domain models
├── i18n/                  # next-intl configuration
└── messages/              # Translation files (en.json, pt-BR.json, es.json)
```

## 🔗 On-Chain Integration

The LMS integrates with a deployed Solana program on **Devnet**:

| Component | Address |
|-----------|---------|
| **Academy Program** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Token Mint** | `XPT2BDiuNVR12Lo3MdqAkB6hAjSRinCV3JuW8K7i7xX` |
| **Metaplex Core** | `CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d` |

### Integration Matrix

| Feature | Status | Implementation |
|---------|--------|---------------|
| Wallet Auth | ✅ Fully Implemented | Client-side via wallet adapter |
| XP Balance Display | ✅ Fully Implemented | Token-2022 balance read |
| Course Enrollment | ✅ Fully Implemented | Learner-signed transaction |
| Credential Display | ✅ Fully Implemented | Helius DAS API indexing |
| Leaderboard | ✅ Fully Implemented | XP token balance indexing |
| Lesson Completion | 🔶 Stubbed | Requires backend minter signer |
| Course Finalization | 🔶 Stubbed | Requires backend minter signer |
| Credential Issuance | 🔶 Stubbed | Requires backend minter signer |

> Stubbed features use localStorage fallback with clean interfaces ready for on-chain swap.

## 🛠️ Tech Stack

- **Framework**: Next.js 16 with App Router & Turbopack
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4 + custom design system
- **Blockchain**: Solana Web3.js, Wallet Adapter, Anchor
- **i18n**: next-intl (PT-BR, EN, ES)
- **Code Editor**: Monaco Editor (@monaco-editor/react)
- **Charts**: Recharts (radar chart, progress visualization)
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Theme**: next-themes (dark/light)

## ⚡ Quick Start

### Prerequisites

- **Node.js** ≥ 18
- **npm** or **yarn**
- A Solana wallet browser extension (Phantom or Solflare)

### Installation

```bash
# Clone the repository
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/app

# Install dependencies
npm install --legacy-peer-deps

# Start the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build for Production

```bash
npm run build
npm start
```

## 🌍 Internationalization

The app ships with full translations in 3 languages:

| Language | Code | Flag |
|----------|------|------|
| English | `en` | 🇺🇸 |
| Portuguese (Brazil) | `pt-BR` | 🇧🇷 |
| Spanish | `es` | 🇪🇸 |

Switch languages via the globe icon in the header. Language preference is persisted in cookies.

## 🎨 Design System

The UI is built on a Solana-inspired design system:

- **Colors**: Purple (#9945FF) → Emerald (#14F195) gradient palette
- **Dark-first**: Designed primarily for dark theme with full light mode support
- **Glassmorphism**: Backdrop blur and transparency effects throughout
- **Animations**: Smooth micro-interactions via Framer Motion
- **Typography**: Inter font family (300–700 weights)

## 🗂️ Course Structure

Courses follow a modular structure:

```
Course
├── Module 1
│   ├── Lesson 1 (reading)
│   ├── Lesson 2 (reading)
│   └── Challenge 1 (coding)
├── Module 2
│   ├── Lesson 3 (reading)
│   └── Challenge 2 (coding)
└── Final Challenge
```

Each lesson can contain:
- Markdown content with code blocks
- Interactive coding challenges with the Monaco editor
- Test cases for automated validation
- Hints and solution reveals
- XP rewards upon completion

## 🏅 Gamification

| Element | Description |
|---------|-------------|
| **XP (Experience Points)** | Earned by completing lessons and challenges |
| **Levels** | Calculated from XP: Level = √(XP / 100) |
| **Streaks** | Daily learning streaks with calendar visualization |
| **Achievements** | 14 unlockable badges (First Steps, Code Warrior, etc.) |
| **Leaderboard** | Weekly, monthly, and all-time rankings |
| **Credentials** | Soulbound NFTs issued on course completion |

## 🔧 CMS Integration

The platform is designed for Sanity CMS integration. Currently uses comprehensive mock data with 6 courses:

1. **Solana Fundamentals** — Beginner (Core)
2. **Anchor Framework Masterclass** — Intermediate (DeFi)
3. **Token-2022 & DeFi** — Advanced (DeFi)
4. **Security Auditing** — Advanced (Security)
5. **NFT & Metaplex** — Intermediate (NFTs)
6. **Mobile dApps with React Native** — Intermediate (Core)

To connect Sanity CMS, follow the [CMS Guide](./docs/CMS_GUIDE.md).

## 📁 Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/my-feature`
3. Commit changes: `git commit -m 'Add my feature'`
4. Push to the branch: `git push origin feature/my-feature`
5. Open a Pull Request

## 📄 License

MIT License. See [LICENSE](./LICENSE) for details.

---

Built with ❤️ by the Superteam Brazil community, powered by **Solana** ☀️
