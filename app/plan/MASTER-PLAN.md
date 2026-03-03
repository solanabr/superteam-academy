# Superteam Academy - Complete Implementation Plan

**Status**: On-chain program deployed on devnet. Frontend implementation in progress.

## Devnet Deployment

The program is live on devnet:

| | Address | Explorer |
|---|---|---|
| **Program** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` | [View](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` | [View](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` | [View](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

**Program**: 16 instructions, 6 PDA types, 26 error variants, 15 events  
**Docs**: [SPEC.md](../../docs/SPEC.md) | [INTEGRATION.md](../../docs/INTEGRATION.md) | [ARCHITECTURE.md](../../docs/ARCHITECTURE.md)

---

## Project Summary

Building a production-ready LMS for Solana development with:
- Interactive, project-based courses with integrated code editing
- Gamification (XP, streaks, achievements)
- On-chain credentials (Metaplex Core NFTs)
- Multi-language support (PT-BR, ES, EN)
- Analytics integration
- Open-source and forkable

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (Next.js 14+)                         │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Wallet  │ │ i18n    │ │ Editor  │ │ Streak  │ │Analytics│           │
│  │ Adapter │ │ Service │ │ Service │ │ Service │ │ Service │           │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │          │          │          │          │                     │
│  ┌────┴──────────┴──────────┴──────────┴──────────┴────┐               │
│  │              Service Layer (Abstractions)            │               │
│  │  LearningProgressService | GamificationService | ... │               │
│  └──────────────────────────┬──────────────────────────┘               │
└─────────────────────────────┼───────────────────────────────────────────┘
                              │
┌─────────────────────────────┼───────────────────────────────────────────┐
│                      BACKEND (Next.js API + Services)                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Auth    │ │ Content  │ │ Leader-  │ │  Event   │ │  Queue   │      │
│  │ Service  │ │ Service  │ │  board   │ │ Listener │ │ Service  │      │
│  └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘ └─────┬────┘      │
│        │            │            │            │            │            │
│  ┌─────┴────────────┴────────────┴────────────┴────────────┴─────┐     │
│  │                    Transaction Builder                         │     │
│  │              (Backend Signer for On-Chain Calls)              │     │
│  └────────────────────────────┬──────────────────────────────────┘     │
└───────────────────────────────┼─────────────────────────────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────────┐
│                      EXTERNAL SERVICES                                    │
│  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐      │
│  │  Solana  │ │ Helius   │ │ Arweave  │ │   CMS    │ │  Auth    │      │
│  │ (Devnet) │ │ DAS API  │ │ Content  │ │(Sanity)  │ │ (Google/ │      │
│  │          │ │          │ │          │ │          │ │ GitHub)  │      │
│  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └──────────┘      │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## Module Index

### Backend Modules (11)

| # | Module | File | Priority |
|---|--------|------|----------|
| 00 | **Backend Architecture** | **`backend/00-architecture.md`** | **P0** |
| 01 | Auth & Account Linking | `backend/01-auth.md` | P0 |
| 01 | Transaction Builder | `backend/01-transaction-builder.md` | P0 |
| 02 | Lesson Validation | `backend/02-lesson-validation.md` | P1 |
| 03 | Course Management | `backend/03-course-management.md` | P0 |
| 04 | XP Token Service | `backend/04-xp-token.md` | P0 |
| 05 | Credential Service | `backend/05-credential.md` | P0 |
| 06 | Achievement Service | `backend/06-achievement.md` | P1 |
| 07 | Event Listener | `backend/07-event-listener.md` | P1 |
| 08 | Leaderboard Service | `backend/08-leaderboard.md` | P1 |
| 09 | Webhook & Queue | `backend/09-webhook-queue.md` | P2 |
| 10 | Services Index | `backend/10-index.md` | - |

### Frontend Modules (21)

| # | Module | File | Priority |
|---|--------|------|----------|
| 01 | Wallet Service | `frontend/01-wallet.md` | P0 |
| 02 | Program Service | `frontend/02-program.md` | P0 |
| 03 | Auth & Account Linking | `frontend/03-auth.md` | P0 |
| 03 | Course Service | `frontend/03-course.md` | P0 |
| 04 | Enrollment Service | `frontend/04-enrollment.md` | P0 |
| 05 | XP Service | `frontend/05-xp.md` | P0 |
| 06 | Credential Service | `frontend/06-credential.md` | P0 |
| 06 | Lesson Service | `frontend/06-lesson.md` | P0 |
| 07 | Code Editor Service | `frontend/07-editor.md` | P0 |
| 08 | XP & Level Service | `frontend/08-xp-level.md` | P0 |
| 09 | Streak Service | `frontend/09-streak.md` | P0 |
| 11 | Achievement Service | `frontend/11-achievement.md` | P1 |
| 12 | Leaderboard Service | `frontend/12-leaderboard.md` | P1 |
| 13 | i18n Service | `frontend/13-i18n.md` | P0 |
| 14 | Analytics Service | `frontend/14-analytics.md` | P0 |
| 15 | Notification Service | `frontend/15-notification.md` | P2 |
| 16 | CMS Integration | `frontend/16-cms.md` | P0 |
| 17 | Admin Dashboard | `frontend/17-admin.md` | P1 |
| 18 | Community/Forum | `frontend/18-community.md` | P2 |
| 19 | E2E Testing | `frontend/19-e2e-testing.md` | P1 |
| 20 | PWA Support | `frontend/20-pwa.md` | P2 |

### UI Components (10)

| # | Component | File | Priority |
|---|-----------|------|----------|
| 01 | Layout & Navigation | `ui/01-layout.md` | P0 |
| 02 | Course Components | `ui/02-course.md` | P0 |
| 03 | Lesson Components | `ui/03-lesson.md` | P0 |
| 04 | Editor Components | `ui/04-editor.md` | P0 |
| 05 | Gamification Components | `ui/05-gamification.md` | P0 |
| 06 | Profile Components | `ui/06-profile.md` | P1 |
| 07 | Leaderboard Components | `ui/07-leaderboard.md` | P1 |
| 08 | Settings Components | `ui/08-settings.md` | P1 |
| 09 | Certificate Components | `ui/09-certificate.md` | P1 |
| 10 | Admin Components | `ui/10-admin.md` | P2 |

---

## Page Implementation Status

| Page | Route | Status | Priority |
|------|-------|--------|----------|
| Landing Page | `/` | Planned | P0 |
| Course Catalog | `/courses` | Planned | P0 |
| Course Detail | `/courses/[slug]` | Planned | P0 |
| Lesson View | `/courses/[slug]/lessons/[id]` | Planned | P0 |
| User Dashboard | `/dashboard` | Planned | P0 |
| User Profile | `/profile` | Planned | P1 |
| Public Profile | `/profile/[username]` | Planned | P1 |
| Leaderboard | `/leaderboard` | Planned | P1 |
| Achievements | `/achievements` | Planned | P1 |
| Settings | `/settings` | Planned | P1 |
| Certificate View | `/certificates/[id]` | Planned | P1 |
| Login | `/login` | Planned | P0 |
| Admin Dashboard | `/admin/*` | Planned | P2 |

---

## Feature Implementation Matrix

### Core Features (Must Have)

| Feature | On-Chain | Frontend | Backend | Status |
|---------|----------|----------|---------|--------|
| Wallet Auth | No | ✅ | No | Planned |
| Google/GitHub Auth | No | ✅ | ✅ | Planned |
| Account Linking | No | ✅ | ✅ | Planned |
| Course Browsing | No | ✅ | ✅ | Planned |
| Course Enrollment | ✅ | ✅ | No | Planned |
| Lesson Progress | ✅ | ✅ | ✅ | Planned |
| Code Editor | No | ✅ | No | Planned |
| XP Display | ✅ | ✅ | No | Planned |
| Level System | No | ✅ | No | Planned |
| Streak Tracking | No | ✅ | No | Planned |
| Credentials Display | ✅ | ✅ | No | Planned |
| Leaderboard | No | ✅ | ✅ | Planned |
| i18n (PT/ES/EN) | No | ✅ | No | Planned |
| Analytics | No | ✅ | ✅ | Planned |

### Bonus Features (Now Mandatory)

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Dashboard | Planned | Course + user management |
| E2E Tests | Planned | Playwright |
| Community/Forum | Planned | Discussion threads |
| Onboarding Flow | Planned | Skill assessment quiz |
| PWA Support | Planned | Offline-capable |
| Advanced Gamification | Planned | Daily challenges, events |
| CMS Creator Dashboard | Planned | Course creation UI |
| Devnet Integration | ✅ Complete | Program deployed and verified |

---

## Tech Stack

### Frontend
- **Framework**: Next.js 16+ (App Router)
- **Language**: TypeScript (strict mode)
- **Styling**: Tailwind CSS 4
- **State**: React Context + Hooks
- **Auth**: NextAuth.js v4 (Google/GitHub OAuth + Wallet Credentials)
- **Wallet**: @solana/wallet-adapter
- **Editor**: Monaco Editor
- **Analytics**: GA4 + PostHog + Sentry

### Backend
- **API**: Next.js API Routes
- **Auth**: NextAuth.js with CredentialsProvider (wallet) + OAuth (Google/GitHub)
- **Database**: Supabase (PostgreSQL with RLS)
- **Cache**: Upstash Redis
- **Rate Limiting**: Upstash Ratelimit
- **CMS**: Sanity

### Infrastructure
- **RPC**: Helius
- **Storage**: Sanity CMS (course content), Arweave (credential metadata)
- **Deploy**: Vercel
- **CI/CD**: GitHub Actions

---

## Performance Targets

| Metric | Target |
|--------|--------|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 90+ |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

---

## Implementation Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup (Next.js, Tailwind, shadcn)
- [ ] Wallet connection (multi-adapter)
- [ ] Auth service (Google + GitHub)
- [ ] Account linking
- [ ] i18n setup
- [ ] Layout components

### Phase 2: Core Learning (Week 2)
- [ ] Course catalog
- [ ] Course detail page
- [ ] Lesson view
- [ ] Code editor integration
- [ ] Enrollment flow
- [ ] Progress tracking

### Phase 3: Gamification (Week 3)
- [ ] XP system
- [ ] Level system
- [ ] Streak tracking
- [ ] Achievement system
- [ ] Leaderboard
- [ ] Credential display

### Phase 4: Polish & Deploy (Week 4)
- [ ] User dashboard
- [ ] Profile pages
- [ ] Settings
- [ ] Admin dashboard
- [ ] Analytics integration
- [ ] E2E tests
- [ ] Performance optimization
- [ ] Deployment

---

## File Deliverables

### Required Documentation
- [ ] `README.md` - Setup, dev, deployment
- [ ] `ARCHITECTURE.md` - System design
- [ ] `CMS_GUIDE.md` - Content management
- [ ] `CUSTOMIZATION.md` - Theming, extending

### Bonus Documentation
- [ ] `API.md` - API documentation
- [ ] `TESTING.md` - Testing guide
- [ ] `DEPLOYMENT.md` - Deployment guide
- [ ] `CONTRIBUTING.md` - Contribution guide

---

## Environment Variables

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3

# Helius
HELIUS_RPC_URL=https://mainnet.helius-rpc.com/?api-key=xxx
HELIUS_API_KEY=xxx

# Auth
NEXTAUTH_SECRET=xxx
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx

# CMS
SANITY_PROJECT_ID=xxx
SANITY_DATASET=production
SANITY_API_TOKEN=xxx

# Database
DATABASE_URL=postgresql://xxx

# Redis
REDIS_URL=redis://xxx

# Analytics
NEXT_PUBLIC_GA_ID=G-xxx
NEXT_PUBLIC_POSTHOG_KEY=xxx
SENTRY_DSN=xxx

# Backend Signer (for on-chain operations)
BACKEND_SIGNER_PRIVATE_KEY=xxx
```

---

## Success Metrics

- All 10 core pages functional
- Wallet auth working on Devnet
- XP/Level display working
- Credential display working
- Leaderboard populated
- i18n working (PT/ES/EN)
- Light/dark themes
- Responsive design
- Lighthouse targets met
- E2E tests passing
- Deployed to Vercel

---

## Documentation References

### Core Documentation
- **[SPEC.md](../../docs/SPEC.md)** - On-chain program specification (source of truth)
- **[ARCHITECTURE.md](../../docs/ARCHITECTURE.md)** - System diagrams, account maps, CU budgets
- **[INTEGRATION.md](../../docs/INTEGRATION.md)** - Frontend integration guide

### Implementation Plans
- **[backend/00-architecture.md](./backend/00-architecture.md)** - Backend architecture & monorepo structure
- **[SUMMARY.md](./SUMMARY.md)** - Quick reference for all plan files

---

## Next Steps

1. Review [SPEC.md](../../docs/SPEC.md) for on-chain program details
2. Read [backend/00-architecture.md](./backend/00-architecture.md) for backend structure
3. Start with [frontend/01-wallet.md](./frontend/01-wallet.md) for wallet setup
4. Follow phase-by-phase implementation
5. Run E2E tests after each phase
6. Deploy preview for testing
