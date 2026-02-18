# Superteam Academy Frontend Architecture

## Overview

This document outlines the frontend architecture for Superteam Academy - a decentralized learning platform on Solana. The frontend connects to the on-chain program (spec'd separately) and provides an interactive coding education experience.

## Tech Stack

### Framework
- **Next.js 14+ (App Router)** - Server components, streaming, layouts
- **TypeScript (strict mode)** - Full type safety
- **Tailwind CSS** - Utility-first styling with custom design tokens

### UI Components
- **shadcn/ui** - Base component library (Radix primitives)
- **Framer Motion** - Animations and transitions
- **Lucide Icons** - Consistent iconography

### Code Editor
- **Monaco Editor** - VS Code experience in browser
- **Sandpack** - Live code execution (alternative)

### CMS
- **Sanity** - Structured content for courses, lessons, metadata

### Blockchain Integration
- **@solana/wallet-adapter** - Multi-wallet support
- **@coral-xyz/anchor** - Program interaction
- **Helius DAS API** - XP leaderboards, token indexing
- **Photon RPC** - Credential queries

### Analytics & Monitoring
- **GA4** - User behavior analytics
- **Hotjar/PostHog** - Heatmaps and session recordings
- **Sentry** - Error monitoring and tracing

### i18n
- **next-intl** - Internationalization for PT/ES/EN

## Page Structure

```
/                           # Landing page with value prop
/courses                    # Course catalog with filters
/courses/[slug]             # Course detail (modules, lessons)
/courses/[slug]/[lesson]    # Lesson view with code editor
/challenges                 # Code challenge interface
/dashboard                  # User progress, XP, streaks
/profile/[address]          # Public profile, credentials
/leaderboard                # XP rankings by timeframe
/settings                   # Account preferences
/verify/[credential]        # Credential verification
```

## Component Architecture

```
src/
├── app/                    # Next.js App Router pages
│   ├── (marketing)/        # Landing, about, pricing
│   ├── (platform)/         # Auth-required platform pages
│   └── api/                # API routes (lesson completion, etc.)
├── components/
│   ├── ui/                 # shadcn base components
│   ├── editor/             # Monaco/code editor components
│   ├── course/             # Course cards, lesson nav
│   ├── gamification/       # XP display, streaks, badges
│   └── wallet/             # Wallet connection UI
├── lib/
│   ├── solana/             # Program client, PDAs, types
│   ├── sanity/             # CMS queries and types
│   ├── hooks/              # React hooks
│   └── utils/              # Helpers
├── styles/                 # Global styles, design tokens
└── messages/               # i18n translations (pt, es, en)
```

## Key Features Implementation

### 1. Code Editor (Split Layout)
```
┌─────────────────────┬─────────────────────┐
│    Lesson Content   │    Monaco Editor    │
│    (Markdown/MDX)   │                     │
│                     │  ┌───────────────┐  │
│  - Instructions     │  │ user code     │  │
│  - Concepts         │  │               │  │
│  - Examples         │  └───────────────┘  │
│                     │  [Run] [Submit]     │
│                     │  ┌───────────────┐  │
│                     │  │ Output/Tests  │  │
│                     │  └───────────────┘  │
└─────────────────────┴─────────────────────┘
```

- Monaco with Solana-specific syntax highlighting
- Test case feedback with visual diff
- Code persistence (localStorage + CMS)
- Multiple file support for complex lessons

### 2. Gamification System

**XP Display:**
```typescript
// Level formula from spec
const level = Math.floor(Math.sqrt(xp / 100));

// Components
<XPBar current={xp} nextLevel={nextLevelXp} />
<LevelBadge level={level} />
<StreakCounter days={streak} />
```

**Achievement System:**
- 256-bit bitmap rendering
- Unlocked/locked badge display
- Claim flow integration with on-chain

### 3. Solana Integration

```typescript
// Program client abstraction
const academy = new SuperteamAcademy(connection, wallet);

// Enrollment
await academy.enroll(courseId);

// Lesson completion (backend-signed)
await api.post('/api/complete-lesson', { courseId, lessonIndex });

// Credential display
const credential = await academy.getCredential(track);
```

### 4. Leaderboard

- Real-time XP rankings via Helius DAS
- Time filters: daily, weekly, all-time
- Track-specific leaderboards
- Pagination for scale

### 5. Credential Verification

```
/verify/[credentialAddress]
├── On-chain verification via Photon
├── Display metadata from Arweave
├── Show learning path progression
└── Share buttons for social proof
```

## Data Flow

### Lesson Completion
```
User submits code
    ↓
Frontend validates locally
    ↓
POST /api/complete-lesson
    ↓
Backend verifies code correctness
    ↓
Backend signs transaction
    ↓
Transaction submitted to Solana
    ↓
XP minted, bitmap updated
    ↓
Frontend updates UI optimistically
```

### Enrollment
```
User clicks Enroll
    ↓
Wallet signs transaction
    ↓
Enrollment PDA created
    ↓
User redirected to first lesson
```

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

### Optimization Strategies

1. **Code Splitting** - Dynamic imports for Monaco, heavy components
2. **Image Optimization** - Next.js Image component, WebP/AVIF
3. **Static Generation** - Course catalog, lesson content (ISR)
4. **Edge Caching** - Vercel Edge for API routes
5. **Lazy Loading** - Below-fold content, non-critical UI

## CMS Schema (Sanity)

```typescript
// Course schema
{
  name: 'course',
  fields: [
    { name: 'title', type: 'localeString' },
    { name: 'description', type: 'localeBlock' },
    { name: 'difficulty', type: 'string', options: ['beginner', 'intermediate', 'advanced'] },
    { name: 'track', type: 'reference', to: 'track' },
    { name: 'lessons', type: 'array', of: [{ type: 'reference', to: 'lesson' }] },
    { name: 'xpReward', type: 'number' },
    { name: 'estimatedDuration', type: 'number' }, // minutes
    { name: 'prerequisites', type: 'array', of: [{ type: 'reference', to: 'course' }] },
  ]
}

// Lesson schema
{
  name: 'lesson',
  fields: [
    { name: 'title', type: 'localeString' },
    { name: 'content', type: 'localeBlock' }, // MDX
    { name: 'codeTemplate', type: 'code' },
    { name: 'solution', type: 'code' },
    { name: 'testCases', type: 'array', of: [{ type: 'testCase' }] },
    { name: 'xpReward', type: 'number' },
  ]
}
```

## API Routes

```
POST /api/complete-lesson
  - Validates code against test cases
  - Signs transaction with backend keypair
  - Returns signed transaction for submission

GET /api/leaderboard
  - Proxies to Helius DAS
  - Caches results (5 min TTL)

POST /api/verify-credential
  - Queries Photon for credential
  - Returns verification result
```

## Deployment

- **Frontend**: Vercel (Edge runtime)
- **CMS**: Sanity Cloud
- **Backend**: Vercel Serverless Functions
- **Analytics**: GA4, PostHog
- **Error Tracking**: Sentry

## Security Considerations

1. **Wallet Security** - Never access private keys; sign-only
2. **Backend Signing** - Keypair in environment variables
3. **Input Validation** - All user input sanitized
4. **Rate Limiting** - API routes protected
5. **Content Security Policy** - Strict CSP headers

## Timeline Estimate

| Phase | Days | Deliverable |
|-------|------|-------------|
| Setup & Scaffolding | 1 | Project structure, CI/CD |
| Core UI Components | 2 | shadcn setup, design system |
| Wallet Integration | 1 | Connection, state management |
| Course Catalog | 1 | Listing, filtering, search |
| Lesson View + Editor | 2 | Monaco, split layout |
| Gamification UI | 1 | XP, streaks, badges |
| Dashboard & Profile | 1 | User state display |
| i18n | 0.5 | PT/ES/EN translations |
| Analytics & Testing | 1 | GA4, Sentry, E2E tests |
| Polish & Deploy | 1.5 | Performance, docs |
| **Total** | **12** | Production-ready MVP |

## Bonus Features (If Time Permits)

- [ ] Admin dashboard for course management
- [ ] PWA with offline lesson caching
- [ ] Community forum with discussions
- [ ] Real-time collaboration on challenges
- [ ] AI-powered code hints
