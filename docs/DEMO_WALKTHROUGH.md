# Superteam Academy — Demo Video Walkthrough

**Purpose**: Feature walkthrough for bounty submission (Mar 5 deadline)
**Format**: Screen recording with narration, ~3-5 minutes
**URL**: https://superteam-academy-five.vercel.app

---

## Recommended Flow (5 scenes, ~3-4 minutes)

### Scene 1: Landing Page (30s)
**Route**: `/en/`

1. Show the hero section — "Learn Solana. Earn Credentials On-Chain."
2. Scroll to the stats row (1,247 learners, 24 courses, 2.1M XP, 847 credentials)
3. Highlight the 4 value props: On-chain Credentials, Gamified Learning, Code Challenges, Community
4. Scroll to featured courses carousel — click one course card
5. **Key talking point**: "Full learning platform built for the Brazilian Web3 community, with 3 languages"

### Scene 2: Course Experience (45s)
**Route**: `/en/courses/` → `/en/courses/intro-solana/`

1. Show course catalog with search, filtering by level (Beginner/Intermediate/Advanced) and track (Solana, DeFi, NFTs, Anchor, Security)
2. Click "Introduction to Solana"
3. Show course detail: objectives, prerequisites, curriculum with 8 lessons
4. Click "Enroll" → show wallet connection prompt (Phantom + Google sign-in)
5. Navigate to a lesson — show Monaco code editor integration
6. **Key talking point**: "Interactive lessons with a built-in code editor — students learn by doing"

### Scene 3: Challenges + Gamification (45s)
**Route**: `/en/challenges/` → `/en/dashboard/`

1. Show challenges page — daily, weekly, seasonal rotation badges
2. Click a challenge (e.g., "Transfer SOL") — show Monaco editor with starter code, test cases, hints
3. Navigate to Dashboard — show XP progress bar, level, streak counter
4. Highlight the 30-day XP chart and recent activity feed
5. Show achievements section (unlocked vs locked badges)
6. **Key talking point**: "Gamification drives engagement — XP, streaks, levels, and competitive leaderboard"

### Scene 4: On-Chain Integration (45s)
**Route**: `/en/leaderboard/` → `/en/certificates/`

1. Show global leaderboard with top 3 podium, time period toggle (week/month/all-time)
2. Navigate to Certificates page — show NFT credentials earned
3. Click a certificate — show mint address, Solana explorer link, verification status
4. **Key talking point**: "Course completions mint soulbound NFT credentials via Metaplex Core on Solana. Verifiable on-chain — no fake certificates."

### Scene 5: i18n + Community + Admin (45s)
**Route**: `/en/community/` → switch language → `/en/admin/`

1. Show community forum — threads, categories, upvotes, search
2. Switch language from EN to PT-BR using the language selector — show localized routes (`/pt-BR/comunidade`)
3. Switch to ES — show `/es/comunidad`
4. Navigate to Admin dashboard — show analytics charts (enrollment trends, XP distribution, completion funnel)
5. Show course management table with publish/edit/delete actions
6. **Key talking point**: "Full i18n in 3 languages with localized URLs. Admin dashboard for content management."

### Closing (15s)
- Return to landing page
- Mention: "Built with Next.js 14, Solana, Metaplex Core, Anchor. Open source."
- Show the onboarding flow briefly (Connect Wallet → Choose Course → Start Learning)

---

## Key Features to Emphasize

These differentiate Superteam Academy from generic LMS platforms:

1. **On-chain credentials** — Metaplex Core NFTs, soulbound, verifiable on Solana Explorer
2. **Token-2022 XP** — Non-transferable soulbound tokens for gamification
3. **3-language i18n** — PT-BR (target), EN, ES with localized URL paths
4. **Interactive code challenges** — Monaco editor with test cases and hints
5. **Gamification** — XP, levels, streaks, badges, competitive leaderboard
6. **Offline mode** — Download courses for offline access, sync when online
7. **Creator tools** — Teach section for course creation with drag-to-reorder lessons
8. **Admin analytics** — Enrollment trends, XP distribution, completion funnel charts
9. **Dual auth** — Solana wallet + Google sign-in
10. **Sanity CMS ready** — Headless CMS integration for content management

## Recording Tips

- Use a clean browser (incognito) to avoid cached state
- Start from `/en/` (English) for the main demo
- Keep mouse movements smooth and deliberate
- Pause briefly on each key feature (~2-3 seconds)
- Use 1280x720 or 1920x1080 resolution
- Dark mode is default — looks best for recording
