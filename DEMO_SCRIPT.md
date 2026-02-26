# Superteam Academy — Demo Video Script

**Target length:** 3–4 minutes
**Tone:** Confident, fast-paced, results-focused
**Language:** English (with locale switcher shown live)

---

## [0:00–0:20] Hook — The Problem

> **Screen:** Landing page in pt-BR, hero section visible

"Learning Solana and Web3 development in Brazil — or anywhere in Latin America — means dealing with English-only content, no local community, and credentials that exist only on paper."

> **Action:** Scroll slightly to show course cards and feature icons

"Superteam Academy changes that. A gamified, trilingual LMS with on-chain credentials, built on Solana."

---

## [0:20–0:45] Trilingual — Switch Locales Live

> **Action:** Click the locale switcher (EN → ES → pt-BR)

"The entire platform — every page, every course title, every UI element — is available in English, Spanish, and Brazilian Portuguese."

> **Screen:** Landing page refreshes in each locale. Show hero text changing.

"This isn't a translation layer bolted on — it's built into the routing. Each locale has its own URL: `/pt-BR/courses`, `/es/cursos`. SEO-ready from day one."

---

## [0:45–1:10] Course Catalog & Onboarding

> **Action:** Click "Get Started" / navigate to `/courses`

"The course catalog is filterable by level and learning track."

> **Action:** Click filter chips (Beginner → DeFi → NFTs)

"For new users, a 4-step onboarding wizard sets up their profile, connects their wallet, and picks their learning path."

> **Action:** Navigate to `/onboarding` and show each step briefly (don't complete)

"Goals → Wallet → Track → Ready. Under 60 seconds."

---

## [1:10–1:45] Lesson Experience — Monaco Editor

> **Action:** Open a course, enter a lesson with code content

"Each lesson has a Monaco-powered code editor — the same editor used in VS Code."

> **Action:** Show the editor with a Solana/Rust code snippet

"Learners write real code, get instant feedback, and earn XP for correct submissions."

> **Action:** Click "Complete Lesson" — show wallet approval prompt if possible

"Completing a lesson triggers a real on-chain transaction. XP tokens are minted using Solana Token-2022 and credited to the learner's wallet."

---

## [1:45–2:10] On-Chain Credentials

> **Action:** Navigate to `/certificates` or `/profile`

"Course completion mints a Metaplex Core NFT credential — immutable, verifiable, owned by the learner."

> **Action:** Show a certificate card with on-chain badge

"Not a PDF. Not a JPEG. A real Solana NFT that proves completion, on-chain, forever."

> **Action:** Show the Solana Explorer transaction link (devnet)

"Every credential transaction is public. Here's a live enrollment transaction on Solana devnet."

---

## [2:10–2:30] Gamification — Leaderboard & Challenges

> **Action:** Navigate to `/leaderboard`

"A public leaderboard ranks learners by XP earned — all pulled from on-chain token balances."

> **Action:** Navigate to `/challenges`

"Code challenges let learners practice specific skills — Anchor, DeFi, NFTs — and earn bonus XP for speed and accuracy."

---

## [2:30–2:50] Admin Dashboard

> **Action:** Navigate to `/admin` (if accessible without real auth)

"Instructors and admins have a full dashboard: user management, course analytics, system health."

> **Action:** Show the tabs — Users, Content, Analytics, System

"All moderated via a clean UI with real-time data."

---

## [2:50–3:10] Technical Highlights (Fast Cuts)

> **Screen:** Split between code and running app

- "Next.js 15, App Router, React 19"
- "Anchor program on Solana devnet — 7 verified transactions"
- "Sanity CMS for content management"
- "Sentry for error tracking, Clarity for heatmaps, GA4 for analytics"
- "72+ automated tests — E2E, unit, Anchor program tests"
- "Lighthouse scores: 90+ Performance, 95+ Accessibility"

---

## [3:10–3:30] Closing — Vision

> **Screen:** Landing page, pt-BR locale

"Superteam Academy is built for Latin America's next generation of Solana developers."

> **Action:** Zoom out to show full landing page

"Trilingual. On-chain. Gamified. Open to extend."

> **Screen:** GitHub repo / live URL

"Code is open-source. Demo is live. Built for Superteam Brazil."

---

## Recording Checklist

- [ ] Use pt-BR as the default locale for the opening shot
- [ ] Switch locales at 0:20 — must be visually clear
- [ ] Show a real on-chain transaction in Solana Explorer (lesson completion)
- [ ] If wallet not connected, show the connect flow quickly
- [ ] Keep transitions fast — no lingering on loading states
- [ ] Record at 1920×1080, no cursor acceleration
- [ ] Add captions if possible (improves Superteam submission score)

---

## Notes for Creator

The app is live on Vercel. Key things that need env vars set before recording:
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` / `NEXTAUTH_SECRET` — for Google sign-in button to appear
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` — for GA4 (get from analytics.google.com)
- `NEXT_PUBLIC_SENTRY_DSN` — for Sentry error tracking (get from sentry.io)
- `NEXT_PUBLIC_SANITY_PROJECT_ID` — for live CMS content (get from sanity.io/manage)

Without these, the app works but uses mock data. For the demo, mock data is fine.
