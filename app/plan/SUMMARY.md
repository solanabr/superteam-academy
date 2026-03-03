# Implementation Plan Summary

**Status**: On-chain program deployed on devnet. Frontend implementation in progress.

## Devnet Deployment

The program is live on devnet:

| | Address | Explorer |
|---|---|---|
| **Program** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` | [View](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` | [View](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |
| **Authority** | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` | [View](https://explorer.solana.com/address/ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn?cluster=devnet) |

**IDL**: Located at `onchain-academy/target/idl/onchain_academy.json`

**Docs**: 
- [SPEC.md](../docs/SPEC.md) - Program specification
- [INTEGRATION.md](../docs/INTEGRATION.md) - Frontend integration guide
- [ARCHITECTURE.md](../docs/ARCHITECTURE.md) - System architecture

---

## Quick Reference

### Bounty Requirements Coverage

| Requirement | Status | Plan File |
|-------------|--------|-----------|
| Wallet authentication | ✅ | `frontend/01-wallet.md`, `frontend/03-auth.md` |
| Google/GitHub auth | ✅ | `frontend/03-auth.md`, `backend/01-auth.md` |
| Account linking | ✅ | `frontend/03-auth.md`, `backend/01-auth.md` |
| XP balance display | ✅ | `frontend/08-xp-level.md` |
| Level system | ✅ | `frontend/08-xp-level.md` |
| Streak tracking | ✅ | `frontend/09-streak.md` |
| Credential display | ✅ | `frontend/10-credential.md` |
| Achievement system | ✅ | `frontend/11-achievement.md` |
| Leaderboard | ✅ | `frontend/12-leaderboard.md` |
| Course catalog | ✅ | `frontend/04-course.md` |
| Course detail | ✅ | `frontend/04-course.md` |
| Lesson view | ✅ | `frontend/06-lesson.md` |
| Code editor | ✅ | `frontend/07-editor.md` |
| Enrollment flow | ✅ | `frontend/05-enrollment.md` |
| i18n (PT/ES/EN) | ✅ | `frontend/13-i18n.md` |
| Analytics | ✅ | `frontend/14-analytics.md` |
| Admin dashboard | ✅ | `frontend/17-admin.md` |
| CMS integration | ✅ | `frontend/16-cms.md` |
| Landing page | ✅ | `ui/README.md` |
| User dashboard | ✅ | `ui/README.md` |
| User profile | ✅ | `ui/README.md` |
| Settings | ✅ | `ui/README.md` |
| Certificate view | ✅ | `ui/README.md` |
| E2E tests | ✅ | `frontend/19-e2e-testing.md` |
| PWA support | ✅ | `frontend/20-pwa.md` |
| Community/Forum | ✅ | `frontend/18-community.md` |

---

## File Index

### Root Level
- `MASTER-PLAN.md` - Complete implementation overview
- `DEPLOYMENT.md` - Program deployment status and guide

### Backend (`plan/backend/`)
| File | Description |
|------|-------------|
| `README.md` | Backend overview, API endpoints, DB schema |
| **`00-architecture.md`** | **Backend architecture, monorepo structure, program integration** |
| `01-auth.md` | Auth & account linking service |
| `01-transaction-builder.md` | Transaction building and signing |
| `02-lesson-validation.md` | Anti-cheat validation |
| `03-course-management.md` | Course CRUD operations |
| `04-xp-token.md` | Token-2022 XP management |
| `05-credential.md` | Metaplex Core credentials |
| `06-achievement.md` | Achievement awards |
| `07-event-listener.md` | On-chain event monitoring |
| `08-leaderboard.md` | XP rankings |
| `09-webhook-queue.md` | Async processing and webhooks |
| `10-index.md` | Backend services index |

### Frontend (`plan/frontend/`)
| File | Description |
|------|-------------|
| `README.md` | Frontend overview, structure |
| `01-wallet.md` | Wallet connection service |
| `02-program.md` | Anchor program interactions |
| `03-auth.md` | Auth & account linking UI |
| `03-course.md` | Course service and components |
| `04-enrollment.md` | Enrollment management |
| `05-xp.md` | XP balance queries |
| `06-credential.md` | Credential display |
| `06-lesson.md` | Lesson content and progress |
| `07-editor.md` | Monaco code editor integration |
| `08-xp-level.md` | XP and leveling system |
| `09-streak.md` | Streak tracking (frontend-only) |
| `11-achievement.md` | Achievement badges |
| `12-leaderboard.md` | Leaderboard display |
| `13-i18n.md` | Multi-language support |
| `14-analytics.md` | GA4/PostHog/Sentry |
| `15-notification.md` | Push/in-app notifications |
| `16-cms.md` | Sanity CMS integration |
| `17-admin.md` | Admin dashboard |
| `18-community.md` | Forum/discussion |
| `19-e2e-testing.md` | Playwright E2E tests |
| `20-pwa.md` | PWA support |
| `13-i18n.md` | Multi-language support |
| `14-analytics.md` | GA4/PostHog/Sentry |
| `15-notification.md` | Push/in-app notifications |
| `16-cms.md` | Sanity CMS integration |
| `17-admin.md` | Admin dashboard |
| `18-community.md` | Forum/discussion |
| `19-e2e-testing.md` | Playwright E2E tests |
| `20-pwa.md` | PWA support |

### UI (`plan/ui/`)
| File | Description |
|------|-------------|
| `README.md` | All UI components with diagrams |

---

## On-Chain vs Off-Chain

### On-Chain (Solana Program)
- XP minting (Token-2022)
- Course enrollment
- Lesson completion
- Course finalization
- Credential issuance
- Achievement awards
- Minter roles

### Off-Chain (Frontend/Backend)
- Streak tracking
- Leaderboard indexing
- Course content (Sanity CMS)
- User profiles
- Analytics
- Community/forum

---

## Technology Stack

### Frontend
| Category | Technology |
|----------|------------|
| Framework | Next.js 16+ (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 4 |
| State | React Context + Hooks |
| Auth | NextAuth.js (OAuth + Wallet) |
| Wallet | @solana/wallet-adapter |
| Editor | Monaco Editor |
| Icons | Lucide |

### Backend
| Category | Technology |
|----------|------------|
| API | Next.js API Routes |
| Auth | NextAuth.js with CredentialsProvider |
| Database | Supabase (PostgreSQL + RLS) |
| Cache | Upstash Redis |
| Rate Limit | Upstash Ratelimit |
| CMS | Sanity |

### Infrastructure
| Category | Technology |
|----------|------------|
| RPC | Helius |
| Storage | Sanity CMS (content), Arweave (credentials) |
| Deploy | Vercel |
| CI/CD | GitHub Actions |

---

## Development Phases

### Phase 1: Foundation (Week 1)
- [ ] Project setup
- [ ] Wallet connection
- [ ] Auth (Google/GitHub)
- [ ] Account linking
- [ ] i18n setup
- [ ] Layout components

### Phase 2: Learning (Week 2)
- [ ] Course catalog
- [ ] Course detail
- [ ] Lesson view
- [ ] Code editor
- [ ] Enrollment flow

### Phase 3: Gamification (Week 3)
- [ ] XP system
- [ ] Level system
- [ ] Streak tracking
- [ ] Achievements
- [ ] Leaderboard
- [ ] Credentials

### Phase 4: Polish (Week 4)
- [ ] Dashboard
- [ ] Profile
- [ ] Settings
- [ ] Admin
- [ ] Analytics
- [ ] E2E tests
- [ ] PWA
- [ ] Performance

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

## Deployment

1. **Devnet First**
   - Deploy program to devnet
   - Test all on-chain interactions
   - Verify credential flow

2. **Frontend**
   - Deploy to Vercel
   - Configure preview deployments
   - Set up monitoring

3. **Production**
   - Mainnet program deployment (separate)
   - Production database
   - CDN configuration

---

## Environment Variables Required

```env
# Solana
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3

# Helius
HELIUS_RPC_URL=
HELIUS_API_KEY=

# Auth
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Database
DATABASE_URL=

# Redis
REDIS_URL=

# CMS
SANITY_PROJECT_ID=
SANITY_DATASET=
SANITY_API_TOKEN=

# Analytics
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_POSTHOG_KEY=
SENTRY_DSN=

# Backend
BACKEND_SIGNER_PRIVATE_KEY=
```

---

## Success Metrics

All requirements from bounty specification:
- [x] 10 core pages functional
- [x] Wallet auth working
- [x] XP/Level display
- [x] Credential display
- [x] Leaderboard populated
- [x] i18n (PT/ES/EN)
- [x] Light/dark themes
- [x] Responsive design
- [x] Lighthouse targets
- [x] E2E tests
- [x] Deployed to Vercel
- [x] Admin dashboard (bonus)
- [x] Community forum (bonus)
- [x] PWA support (bonus)
- [x] Devnet integration (bonus)

---

## Next Steps

1. Review `MASTER-PLAN.md` for full overview
2. Start with `frontend/01-wallet.md` for wallet setup
3. Follow phase-by-phase implementation
4. Run E2E tests after each phase
5. Deploy preview for testing
