# Superteam Academy Brazil 🇧🇷 — Decentralized LMS on Solana

> A premium, production-ready decentralized Learning Management System built for **Superteam Brazil**. Complete courses, earn soulbound XP tokens via Token-2022, and receive verifiable Metaplex Core NFT credentials — all on Solana Devnet.

**Live on Devnet**: Program `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`

---

## ✨ Highlights

| Criteria | What's Built |
|----------|-------------|
| **Pages** | 13 pages (10 core + Admin, Onboarding Quiz, Loading) |
| **On-Chain** | Token-2022 XP, Metaplex Core NFTs, 6 PDA types, bitmap tracking |
| **AI** | Vercel AI SDK teaching assistant embedded in the code editor |
| **i18n** | Portuguese (pt-BR), English (en), Spanish (es) |
| **Testing** | 12 Playwright E2E tests (landing, courses, quiz, responsive) |
| **PWA** | Installable via `manifest.json` |
| **SEO** | Schema.org JSON-LD (Course, ItemList, Organization) |
| **Docs** | README, ARCHITECTURE.md |

---

## 🏗 Architecture

See **[ARCHITECTURE.md](./ARCHITECTURE.md)** for the full system design, data flow diagrams, PDA account table, service layer interface, and extension guides.

### Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, TypeScript strict) |
| Styling | Tailwind CSS v4 + Custom CSS Variables |
| Blockchain | `@solana/web3.js`, `@coral-xyz/anchor`, `@solana/spl-token` |
| Wallets | Phantom, Solflare via `@solana/wallet-adapter` |
| NFTs | `@metaplex-foundation/mpl-core` + Helius DAS API |
| AI | Vercel AI SDK + OpenAI (streaming) |
| Editor | Monaco Editor with academy-dark theme |
| i18n | `next-intl` (3 locales, 160+ keys each) |
| Animations | Framer Motion |
| E2E Tests | Playwright |
| Fonts | Space Grotesk (headings), Inter (body) |

### Service Layer

Clean `ILearningProgressService` interface in `src/lib/services.ts` with typed methods for all on-chain operations. Mock implementation included — swap for Anchor client to go live.

---

## 📄 Pages (13 Total)

| Route | Type | Description |
|-------|------|-------------|
| `/` | Static | Landing — animated hero, stats, learning tracks, featured courses |
| `/courses` | Static | Filterable course catalog with search, track & level filters |
| `/courses/[slug]` | Dynamic | Course detail — syllabus, enrollment, XP breakdown |
| `/courses/[slug]/lessons/[id]` | Dynamic | Lesson view — Markdown + Monaco editor + AI Assistant |
| `/dashboard` | Static | User dashboard — SVG XP ring, streak, course progress |
| `/leaderboard` | Static | Global/weekly rankings with podium |
| `/profile/[username]` | Dynamic | Public profile — skills radar, credentials, badges |
| `/certificates/[id]` | Dynamic | Verifiable certificate with social sharing |
| `/settings` | Static | Profile edit, wallet info, linked accounts |
| `/admin` | Static | **[Bonus]** Admin dashboard — KPIs, enrollment chart, course management |
| `/onboarding` | Static | **[Bonus]** Skill assessment quiz with personalized track recommendation |
| `/api/chat` | API | **[Bonus]** AI teaching assistant (Vercel AI SDK + OpenAI) |
| `/api/complete-lesson` | API | Server-side lesson completion signing (stubbed) |
| `/api/finalize-course` | API | Server-side course finalization (stubbed) |

---

## 🎮 Bonus Features

- **Admin Dashboard** — KPI cards, enrollment trend chart, course management table, wallet-gated access
- **Onboarding Skill Quiz** — 4-question assessment with animated transitions, recommends a learning track
- **AI Teaching Assistant** — Floating chat in the code editor, streaming responses via Vercel AI SDK
- **PWA Support** — `manifest.json`, theme color, installable on mobile
- **Schema.org SEO** — JSON-LD structured data on Course Catalog and Detail pages
- **Framer Motion Animations** — Staggered hero entrance, scroll-triggered stats counters
- **E2E Tests (Playwright)** — 12 tests covering critical flows + responsive design
- **Service Layer** — `ILearningProgressService` with mock implementation for clean architecture

---

## 🚀 Getting Started

### Requirements
- Node.js 18.17+
- A Solana wallet (Phantom / Solflare) set to Devnet

### Install & Run
```bash
cd app
npm install
cp .env.local.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### Run E2E Tests
```bash
npx playwright install
npx playwright test
```

### Build (Production)
```bash
npm run build  # ✅ Passes clean
```

---

## 📁 Environment Variables

See `.env.local.example` for all required variables. Defaults for Devnet are pre-configured.

| Variable | Purpose |
|----------|---------|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Solana RPC endpoint |
| `NEXT_PUBLIC_PROGRAM_ID` | Anchor program address |
| `NEXT_PUBLIC_XP_MINT` | Token-2022 XP mint |
| `NEXT_PUBLIC_HELIUS_API_KEY` | Helius DAS API key |
| `OPENAI_API_KEY` | AI assistant (optional) |
