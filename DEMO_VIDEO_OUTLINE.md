# Demo Video Outline — Superteam Academy LMS
*Creator: record this as a screen walkthrough. Target: 3–5 minutes.*

**Live URL**: https://app-roan-iota-58.vercel.app

---

## Suggested Script (Voiceover)

> "This is Superteam Academy — a decentralised learning platform for the Brazilian Web3 developer community. Let me show you what it does."

---

## Walkthrough Sequence

### 1. Landing Page (0:00 – 0:30)
**Navigate to**: https://app-roan-iota-58.vercel.app

Show:
- Hero section — tagline, CTA, dark theme
- **Language switcher** (top right) — switch from Portuguese to English to Spanish. Note URL changes: `/pt-BR/cursos` → `/en/courses` → `/es/cursos`
- Scroll briefly to see feature highlights

> *"Built for Brazilian learners first — fully trilingual: Portuguese, English, and Spanish, with localised URL paths."*

---

### 2. Course Catalog (0:30 – 1:00)
**Navigate to**: `/en/courses`

Show:
- 5+ courses in the catalog
- Search bar — type "Solana" to filter
- Filter by level (Beginner / Intermediate)
- Click into **"Introduction to Solana"** course

> *"Learners browse and filter courses, see XP rewards, difficulty levels, and prerequisites."*

---

### 3. Course Detail + Enrolment (1:00 – 1:20)
Show:
- Course overview — objectives, curriculum, prerequisites
- XP reward badges on each lesson
- Enrol button

---

### 4. Interactive Code Challenge (1:20 – 1:50)
**Navigate to**: `/en/challenges`

Show:
- Monaco editor (VS Code in the browser)
- A challenge loaded with starter code and description
- Click **Run Tests** — show test results panel
- Show hints panel
- XP reward displayed

> *"Learners write real Solana code directly in the browser, with instant test feedback and XP rewards."*

---

### 5. Dashboard — XP & Gamification (1:50 – 2:20)
**Navigate to**: `/en/dashboard`

Show:
- XP progress bar with level indicator
- **Daily streak counter**
- Achievement badges
- XP history chart (Recharts)
- Enrolled courses progress

> *"Every completed lesson earns XP. Streaks and achievements drive retention."*

---

### 6. Leaderboard (2:20 – 2:35)
**Navigate to**: `/en/leaderboard`

Show:
- Animated top-3 podium
- Full ranked list of learners with XP and level

---

### 7. On-Chain Credentials (2:35 – 3:00)
**Navigate to**: `/en/certificates`

Show:
- Soulbound NFT certificate card
- Solana Explorer link (click it to show the on-chain transaction)
- Mention: Token-2022 non-transferable, Metaplex Core NFT

> *"Completing a course mints a soulbound NFT credential on Solana — verifiable on-chain forever."*

Optional: Open a second tab to the Anchor program on Solana Explorer:
- Program ID: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- URL: https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet

---

### 8. Auth — Wallet + Google Sign-In (3:00 – 3:20)
Show:
- Sign-in page or connect wallet modal
- Phantom wallet connection button
- **Google sign-in button** (alongside wallet)

> *"Learners can sign in with a Solana wallet or Google — whichever they prefer."*

---

### 9. Admin Dashboard (3:20 – 3:35)
**Navigate to**: `/en/admin`

Show:
- Analytics overview (mock data: enrollments, active learners, XP issued)
- Content management interface

---

### 10. Technical Highlights — Quick Mention (3:35 – 4:00)
Optionally share screen on GitHub repo / CI badge:
- "459 tests, 5-job CI/CD pipeline — TypeScript, ESLint, Build, Anchor/Rust, and Playwright E2E"
- Lighthouse: Performance 90 · Accessibility 100 · Best Practices 100 · SEO 100
- PWA: installable, works offline

**End**: Back to landing page hero.

> *"Superteam Academy — built for the Brazilian Web3 community, ready to deploy."*

---

## Key Numbers to Mention (if voiceover)
| Metric | Value |
|--------|-------|
| Pages | 19 (10 required + 9 bonus) |
| Languages | 3 (pt-BR, EN, ES) — 615 i18n keys |
| Tests | 459 (234 Vitest + 225 Playwright) |
| On-chain instructions | 16 |
| CI jobs | 5 |
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 100 |

---

## Recording Tips
- Use Chrome / Brave at 1440×900 or 1280×800
- Dark mode is default — looks great on video
- Disable notifications before recording
- Keep mouse movements slow and deliberate
- No need to log in — most pages work unauthenticated
