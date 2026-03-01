# Superteam Academy — Original Bounty Content

**Source:** https://superteam.fun/earn/listing/superteam-academy
**Fetched:** 2026-02-24
**Sponsor:** Superteam Brazil (verified)
**POC:** Kaue Cano (@kauenet on X)

---

## Bounty Description

Superteam Brazil seeks developers to build a production-ready learning management system (LMS) for Solana development featuring interactive courses, gamification, and on-chain credentials.

## Core Features (10 Pages)

1. Landing page with hero and CTAs
2. Course catalog with filtering and search
3. Course detail pages with module/lesson lists
4. Split-layout lesson view with integrated code editor
5. Code challenge interface with test cases
6. User dashboard showing progress and achievements
7. User profiles with skill radar and credentials
8. Leaderboard with weekly/monthly/all-time filters
9. Settings page for account management
10. Certificate/credential viewer with on-chain verification

## Tech Stack (Choose One)

React + Next.js 14+ (App Router), Vue 3 + Nuxt 3, or Svelte + SvelteKit

Required:
- TypeScript (strict mode)
- Tailwind CSS
- Component libraries (shadcn/ui, Radix, Headless UI)
- Headless CMS
- Solana Wallet Adapter
- GA4 analytics
- i18n support (Portuguese, Spanish, English)

## Gamification System

- XP as soulbound tokens (Token-2022)
- Level calculation: `Level = floor(sqrt(xp / 100))`
- Streaks tracked frontend-only
- Achievement badges with bitmap system (256 possible)
- Configurable XP rewards: lessons (10–50), challenges (25–100), course completion (500–2,000)

## Code Editor Integration

Monaco Editor, CodeMirror 6, or embedded Solana Playground:
- Rust/TypeScript/JSON syntax highlighting
- Basic autocompletion
- Error display

## On-Chain Implementation Scope

### Fully Implement on Devnet:
- Wallet authentication (multi-wallet)
- XP balance display from Token-2022 accounts
- Credential (Metaplex Core NFT) display
- Leaderboard via XP balance indexing
- Course enrollment (learner-signed transactions)

### Stub with Clean Abstractions:
- Lesson completion flow
- Course finalization and credential issuance
- Achievement claiming
- Streak tracking (frontend-only)

## Performance Targets

- Lighthouse Performance: 90+
- Lighthouse Accessibility: 95+
- Lighthouse Best Practices: 95+
- Lighthouse SEO: 90+
- Core Web Vitals: LCP <2.5s, FID <100ms, CLS <0.1

## Prizes

- 1st Place: $3,500 USDG
- 2nd Place: $1,000 USDG
- 3rd Place: $500 USDG
- Total Pool: $4,800 USDC

## Deliverables

1. Pull request to github.com/solanabr/superteam-academy with full frontend implementation
2. Production application deployed (Vercel/Netlify) with all features, i18n, light/dark themes
3. Analytics setup (GA4, heatmaps, Sentry error monitoring)
4. Configured CMS with sample course imported
5. Documentation: README.md, ARCHITECTURE.md, CMS_GUIDE.md, CUSTOMIZATION.md
6. Demo video (3–5 minutes)
7. Twitter post tagging @SuperteamBR

## Bonus Features

- Admin dashboard
- E2E tests (Playwright/Cypress)
- Community/forum section
- Onboarding quiz
- PWA support
- Daily challenges
- Course creator dashboard
- Devnet program integration

## Evaluation Criteria

- Code Quality & Architecture: 25%
- Feature Completeness: 25%
- UI/UX Design: 20%
- Performance: 15%
- Documentation: 10%
- Bonus Features: 5%

## Timeline

- Submission Deadline: March 5, 2026 (14 days from listing)
- Winner Announcement: Within 10 days after deadline
- Payment: Within 15 days after announcement

## Constraints

- Original work required; MIT license mandatory
- Multiple submissions per person/team prohibited
- AI-generated code allowed if reviewed, tested, and production-quality
- Winning submission becomes foundation for Solana developer education across Latin America
- Team submissions permitted; prize per submission, not per person
- Non-English LATAM submissions welcome

## Sponsor Contact

- Superteam Brazil (verified)
- POC: Kaue Cano (@kauenet on X)
- Discord: discord.gg/superteambrasil
- Eligibility: Global (agents allowed)

## Notes

- On-chain program already exists in repo; build frontend with clean service abstractions
- Supabase acceptable for MVP user data (design for future on-chain migration)
- Course content provided (mock); focus on platform and CMS structure
- Polished subset beats incomplete full feature set
