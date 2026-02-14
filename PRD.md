# PRD: Superteam Academy — Solana Learning Platform

## Overview
Production-ready LMS for Solana development education. Interactive, project-based courses with gamification, on-chain credentials, and multi-language support. Built for Superteam Brazil, forkable for any community (including Octant internal education).

## Problem
Solana developer education is fragmented across docs, YouTube, and random tutorials. No structured, gamified, interactive learning path exists. Superteam Brazil needs a platform to take builders from zero to production-ready dApps.

## Target Users
1. **Aspiring Solana devs** — Want structured learning path
2. **Experienced devs** — Want to deepen Solana-specific knowledge
3. **Community managers** — Want to track member education progress
4. **Octant team (fork)** — Internal knowledge sharing + AI workshops

## User Stories
- As a learner, I want interactive coding challenges so I learn by doing
- As a learner, I want XP and streaks so I stay motivated
- As a learner, I want on-chain credentials proving my skills
- As a course creator, I want a CMS to build courses without code
- As an admin, I want analytics to understand learner behavior

## Core Features (MVP — 14 days)

### Pages (10 total)
1. **Landing (/)** — Hero, learning path previews, social proof, CTAs
2. **Course Catalog (/courses)** — Filterable grid, search, difficulty/topic/duration
3. **Course Detail (/courses/[slug])** — Header, module list, progress bar, enrollment CTA
4. **Lesson View (/courses/[slug]/lessons/[id])** — Split: content (left) + code editor (right)
5. **Code Challenge** — Prompt, test cases, starter code, run button, pass/fail
6. **Dashboard (/dashboard)** — Courses in progress, XP, level, streak, achievements
7. **Profile (/profile/[username])** — Avatar, skill radar, credentials, completed courses
8. **Leaderboard (/leaderboard)** — Global rankings, weekly/monthly/all-time filters
9. **Settings (/settings)** — Profile, auth methods, language, theme, privacy
10. **Certificate (/certificates/[id])** — Visual cert, on-chain verification, social share

### Gamification
- **XP**: Soulbound tokens (Token-2022). Balance = XP. Level = floor(sqrt(xp/100))
- **Streaks**: Consecutive active days. Calendar viz. Milestones at 7/30/100 days
- **Achievements**: 256 possible via bitmap. Categories: Progress, Streaks, Skills, Community, Special
- **Leaderboard**: Off-chain, derived from XP token balances

### Auth
- Solana Wallet Adapter (multi-wallet)
- Google sign-in
- GitHub sign-in (bonus)
- Account linking (add wallets/auth methods later)

### Code Editor
- Monaco Editor or CodeMirror 6
- Rust/TypeScript/JSON syntax highlighting
- Basic autocompletion
- Error display
- Pass/fail feedback for challenges

### i18n
- PT-BR, ES, EN from day one
- All UI strings externalized
- Language switcher in header

### CMS (Sanity)
- Courses → Modules → Lessons
- Lesson types: content (reading/video) or challenge (interactive)
- Visual editor with markdown + code blocks
- Draft/publish workflow
- Course metadata (difficulty, duration, XP, track)

## Tech Stack
- **Framework:** Next.js 14+ (App Router)
- **Language:** TypeScript (strict mode)
- **Styling:** Tailwind CSS + custom design tokens
- **Components:** shadcn/ui (accessible, composable)
- **CMS:** Sanity
- **Auth:** Solana Wallet Adapter + NextAuth (Google/GitHub)
- **Database:** Supabase (user data, progress, analytics)
- **Analytics:** GA4 + PostHog + Sentry
- **Deployment:** Vercel with preview deployments
- **Code Editor:** Monaco Editor

## On-Chain Integration
### Fully Implement (Devnet):
- Wallet authentication
- XP balance display from token accounts
- Credential (cNFT) display and verification
- Leaderboard by indexing XP balances

### Stub with clean interfaces:
- Lesson completion flow (backend-signed txns)
- Course enrollment
- Achievement claiming
- Streak tracking

### Service Interface:
```typescript
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: 'weekly' | 'monthly' | 'alltime'): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
}
```

## Performance Targets
- Lighthouse: Performance 90+, Accessibility 95+, Best Practices 95+, SEO 90+
- LCP < 2.5s, FID < 100ms, CLS < 0.1

## Success Metrics
- Course completion rate > 60%
- Daily active learners (DAL) growing week over week
- Average XP earned per session
- Streak retention at 7 days > 40%

## Acceptance Criteria
- [ ] All 10 pages functional and responsive
- [ ] Wallet auth working on Devnet
- [ ] Gamification system (XP, streaks, achievements) functional
- [ ] Code editor with syntax highlighting and pass/fail
- [ ] i18n (PT-BR, ES, EN) working
- [ ] Light/dark themes
- [ ] Lighthouse targets met
- [ ] CMS configured with sample course
- [ ] Analytics (GA4 + PostHog + Sentry) integrated
- [ ] Deployed to Vercel

## Timeline
- Day 1-2: Project setup, auth, layout, landing page
- Day 3-5: Course catalog, course detail, CMS integration
- Day 6-8: Lesson view, code editor, challenge interface
- Day 9-10: Dashboard, profile, gamification system
- Day 11-12: Leaderboard, settings, certificates, on-chain integration
- Day 13: Polish, i18n, analytics, performance optimization
- Day 14: Documentation, demo video, submission

## Deliverables
1. PR to github.com/solanabr/superteam-academy
2. Live demo on Vercel
3. Demo video (3-5 min)
4. Twitter post tagging @SuperteamBR
5. Documentation: README, ARCHITECTURE, CMS_GUIDE, CUSTOMIZATION
