# Demo Video Outline — Superteam Academy LMS

**Target duration:** 3–4 minutes
**Live URL:** https://superteam-academy-five.vercel.app

---

## Segment 1: Hook (0:00–0:20)
- Open to the landing page
- Show the trilingual switcher (EN → PT-BR → ES) — this immediately shows i18n
- Mention: "A Solana-native learning platform for the Brazilian developer community"

## Segment 2: Authentication (0:20–0:40)
- Click "Sign In" → show two options: **Google OAuth** and **Phantom Wallet**
- Sign in with Google (fast, familiar flow)
- Point out: "Works without a wallet for maximum onboarding reach"

## Segment 3: Course Catalog (0:40–1:00)
- Browse the course catalog page (`/pt-BR/cursos`)
- Filter by track (DeFi, NFTs, Smart Contracts) and difficulty
- Click into a course detail page — show lesson list, XP breakdown, enrollment button

## Segment 4: Interactive Code Challenge (1:00–1:30)
- Open a code challenge (`/pt-BR/desafios`)
- Show the Monaco editor with a Rust/TypeScript exercise
- Submit a solution — show XP reward notification
- Point out the hint system

## Segment 5: On-Chain Credentials (1:30–1:55)
- Navigate to Certificates page (`/pt-BR/certificados`)
- Show a Soulbound NFT certificate with Solana Explorer link
- Open the Explorer link (briefly) — real on-chain transaction
- Program: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` on devnet

## Segment 6: Gamification & Dashboard (1:55–2:20)
- Go to Dashboard (`/pt-BR/painel`)
- Show: XP progress chart, streak calendar, achievement badges
- Navigate to Leaderboard (`/pt-BR/classificacao`) — animated podium for top 3
- Brief pause to show the chart responsiveness

## Segment 7: CMS + Monitoring (2:20–2:40)
- Show the CMS Guide doc briefly (mention Sanity integration for easy content updates)
- Briefly mention Sentry error tracking + GA4 + Microsoft Clarity (performance monitoring)
- "Content editors can update courses without a developer"

## Segment 8: Tech Architecture (2:40–3:00)
- Show terminal / README briefly: 459 tests (234 unit + 225 E2E)
- Mention: Next.js 15, Anchor program with 16 instructions, 77 Rust tests
- CI badge — green checkmark on GitHub

## Segment 9: Close (3:00–3:10)
- Return to landing page
- "All source code on GitHub, deployed on Vercel, Anchor program on Solana devnet"

---

## Key Talking Points
- **459 tests** — highest test coverage in the competition
- **Trilingual i18n** — real localized routes (not just text swap)
- **Sanity CMS** — content editors can add/edit courses without code changes
- **Google + Wallet auth** — maximum onboarding flexibility
- **On-chain certificates** — soulbound NFTs, not just mock data
- **Fully deployed** — works right now at superteam-academy-five.vercel.app

---

## Screen Recording Tips
- Use 1080p, 30fps
- Keep the browser at 1280×800 for clean captures
- Use Chrome (the E2E tests run on Chromium)
- Narrate in English or Portuguese — either works for judging
