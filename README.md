# Superteam Academy

> **On-chain learning platform for Solana** — Learners enroll in courses, complete lessons to earn soulbound XP tokens, receive Metaplex Core credential NFTs, and collect achievements. Course creators earn XP rewards. Platform governed by multisig authority.

## 🔗 Quick Links

| | Link |
|---|---|
| 🌐 **Live Demo** | [superteam-academy-sigma.vercel.app](https://superteam-academy-sigma.vercel.app) |
| 📦 **Repository** | [github.com/solanabr/superteam-academy](https://github.com/solanabr/superteam-academy) |
| 🔎 **Program (Devnet)** | [`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |

---

## ✨ Key Features

### 📱 Frontend (Next.js 16)

- **10+ production pages** — Landing, Course Catalog, Course Detail, Lesson Viewer with Monaco Code Editor, Dashboard, Leaderboard, User Profile, Public Profiles, Settings, Certificates, Onboarding
- **Internationalization (i18n)** — Full support for 🇺🇸 English, 🇧🇷 Portuguese, 🇪🇸 Spanish (270+ translation strings per locale)
- **Dual Theme System** — Light & Dark modes with local storage persistence
- **Gamification** — XP levels with animated progress ring, streaks tracker, achievements, leaderboard rankings
- **Interactive Code Editor** — Monaco Editor integrated for in-browser Solana coding challenges
- **Premium UI/UX** — Framer Motion animations, glassmorphism cards, gradient accents, responsive sidebar navigation
- **CMS Ready** — Repository pattern with Sanity CMS integration guide (swappable from static data)
- **Analytics** — Google Analytics 4 integration
- **Onboarding Flow** — Guided skill quiz to personalize the learning experience

### ⛓️ On-Chain Integration (Solana Devnet)

- **Wallet Authentication** — Phantom & Solflare via Solana Wallet Adapter
- **Token-2022 XP** — Soulbound, non-transferable XP tokens with PermanentDelegate
- **Credential NFTs** — Metaplex Core soulbound certificates with PermanentFreezeDelegate
- **PDA Derivation** — 6 PDA types for enrollment, progress, achievements, and credentials
- **Helius DAS API** — Real-time credential queries and XP leaderboard data
- **Bitmap Progress Tracking** — On-chain bitmap for efficient lesson completion tracking
- **16 Anchor Instructions** — Complete program with enrollment, lesson completion, XP rewards, and credential minting

---

## 🏗️ Monorepo Structure

```
superteam-academy/
├── app/                          ← Next.js 16 frontend
│   ├── src/app/                  ← App Router pages
│   │   ├── /                     ← 🏠 Landing page & hero
│   │   ├── dashboard/            ← 📊 Learning dashboard (XP, streaks, progress)
│   │   ├── courses/              ← 📚 Course catalog
│   │   ├── courses/[slug]/       ← 📖 Course detail & lesson viewer
│   │   ├── leaderboard/          ← 🏆 Global XP rankings
│   │   ├── profile/[username]/   ← 👤 Public user profiles
│   │   ├── admin/                ← 🔐 Admin management panel
│   │   ├── settings/             ← ⚙️ User preferences
│   │   ├── certificates/         ← 🎓 Credential certificates
│   │   ├── onboarding/           ← 🚀 Skill quiz & setup
│   │   └── api/                  ← 🔌 Server-side API routes
│   ├── src/components/           ← Reusable UI components
│   ├── src/lib/                  ← Services (CMS, PDA, XP, Helius, bitmap)
│   ├── src/providers/            ← Wallet, theme, and i18n providers
│   └── src/messages/             ← i18n locale files (EN, PT-BR, ES)
├── onchain-academy/              ← Anchor program (deployed on devnet)
│   ├── programs/                 ← Rust program source (16 instructions)
│   ├── tests/                    ← 77 Rust + 62 TypeScript tests
│   └── scripts/                  ← Devnet interaction scripts
├── docs/                         ← Documentation
│   ├── SPEC.md                   ← Program specification
│   ├── ARCHITECTURE.md           ← Account maps, data flows, CU budgets
│   ├── INTEGRATION.md            ← Frontend integration guide
│   └── DEPLOY-PROGRAM.md         ← Deploy your own devnet instance
└── scripts/                      ← Utility scripts
```

---

## 🚀 Quick Start

### Frontend

```bash
cd app
npm install
npm run dev
# → http://localhost:3000
```

### On-Chain Program

```bash
cd onchain-academy

# Install dependencies
yarn install

# Build the program
anchor build

# Run tests (localnet)
anchor test

# Rust unit tests
cargo test --manifest-path tests/rust/Cargo.toml
```

---

## 🔧 Tech Stack

| Layer | Stack |
|---|---|
| **Frontend** | Next.js 16, React 19, TypeScript (strict) |
| **Styling** | Tailwind CSS 4, Framer Motion, Lucide React |
| **State / Data** | next-intl (i18n), Recharts, Sanity CMS |
| **Web3** | Solana Wallet Adapter, @coral-xyz/anchor, @solana/web3.js |
| **Programs** | Anchor 0.31+, Rust 1.82+ |
| **XP Tokens** | Token-2022 (NonTransferable, PermanentDelegate) |
| **Credentials** | Metaplex Core NFTs (soulbound via PermanentFreezeDelegate) |
| **RPC** | Helius (DAS API for credential queries + XP leaderboard) |
| **Content** | Arweave (immutable course content) |
| **Testing** | ts-mocha/Chai, Cargo test, Playwright |
| **Analytics** | Google Analytics 4 |
| **Multisig** | Squads (platform authority) |

---

## 📱 Application Routes

| Route | Description |
|---|---|
| `/` | Landing page with hero, stats, learning paths, featured courses |
| `/courses` | Course catalog with track filtering |
| `/courses/[slug]` | Course detail with lesson list and enrollment |
| `/courses/[slug]/lessons/[id]` | Lesson viewer with Monaco code editor |
| `/dashboard` | Personal dashboard (XP ring, streaks, progress) |
| `/leaderboard` | Global XP rankings |
| `/profile/[username]` | Public user profile with achievements |
| `/admin` | Admin panel for course management |
| `/settings` | User preferences and account settings |
| `/certificates` | View earned credential NFTs |
| `/onboarding` | Guided skill quiz for new users |

---

## 🌍 Internationalization

Full i18n support via `next-intl` with locale files in `app/src/messages/`:

- 🇺🇸 `en.json` — English
- 🇧🇷 `pt-BR.json` — Portuguese (Brazil)
- 🇪🇸 `es.json` — Spanish

Each locale contains 270+ translated strings covering all pages and components.

---

## 🎨 Design System

- **Dual theme** — Light & dark modes with CSS custom properties and local storage persistence
- **Glassmorphism** — Translucent card surfaces with backdrop blur
- **Gradient accents** — Purple-to-green gradients for XP and primary actions
- **Responsive sidebar** — Fixed left navigation with icons and labels
- **Micro-animations** — Framer Motion entrance animations, hover effects, and transitions
- **Typography** — Custom heading and body font system

---

## Devnet Deployment

| | Address |
|---|---|
| **Program** | [`ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | [`xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3`](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | [`ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn`](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

---

## 📖 Documentation

- **[Program Specification](docs/SPEC.md)** — 16 instructions, 6 PDA types, 26 errors, 15 events
- **[Architecture](docs/ARCHITECTURE.md)** — Account maps, data flows, CU budgets
- **[Frontend Integration](docs/INTEGRATION.md)** — PDA derivation, instruction usage, events, error handling
- **[Deployment Guide](docs/DEPLOY-PROGRAM.md)** — Deploy your own program instance on devnet
- **[CMS Guide](app/CMS_GUIDE.md)** — Switching from static data to Sanity CMS

---

## Contributing

```bash
# Branch naming
git checkout -b <type>/<scope>-<description>-<DD-MM-YYYY>
# Examples:
#   feat/enrollment-lessons-11-02-2026
#   fix/cooldown-check-12-02-2026
#   docs/integration-guide-17-02-2026

# Before merging
anchor build
cargo fmt
cargo clippy -- -W clippy::all
cargo test --manifest-path onchain-academy/tests/rust/Cargo.toml
anchor test
```

## License

[MIT](LICENSE)
