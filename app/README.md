<p align="center">
  <img src="public/superteams-brandkit/Logo/HORIZONTAL/PNG/ST-EMERALD-GREEN-HORIZONTAL.png" alt="Superteam Academy" width="400" />
</p>

<h3 align="center">A production-ready Learning Management System for Solana development</h3>

<p align="center">
  Interactive courses &middot; On-chain credentials &middot; Gamification &middot; Multi-language
</p>

<p align="center">
  <a href="#live-demo">Live Demo</a> &middot;
  <a href="#features">Features</a> &middot;
  <a href="#tech-stack">Tech Stack</a> &middot;
  <a href="#getting-started">Getting Started</a> &middot;
  <a href="#documentation">Documentation</a>
</p>

---

## Live Demo

| Resource | Link |
|---|---|
| Production App | []() |
| GitHub Repository | [github.com/solanabr/superteam-academy](https://github.com/solanabr/superteam-academy) |
| On-Chain Program | [ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf](https://explorer.solana.com/address/ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf?cluster=devnet) |
| XP Token Mint | [xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3](https://explorer.solana.com/address/xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3?cluster=devnet) |

---

## Features

### Core Features (Implemented)

| Feature | Description | Documentation |
|---|---|---|
| Wallet Authentication | Multi-wallet adapter with Ed25519 signature verification | [Auth & RBAC](documentation/02-authentication-and-rbac.md) |
| Google OAuth | Google sign-in via NextAuth.js | [Auth & RBAC](documentation/02-authentication-and-rbac.md) |
| GitHub OAuth | GitHub sign-in via NextAuth.js | [Auth & RBAC](documentation/02-authentication-and-rbac.md) |
| Account Linking | Link wallet + Google + GitHub to one profile | [Auth & RBAC](documentation/02-authentication-and-rbac.md) |
| Course Catalog | Filterable course grid with search | [Frontend](documentation/06-frontend-architecture.md) |
| Course Detail | Module/lesson list with progress tracking | [Frontend](documentation/06-frontend-architecture.md) |
| Lesson View | Split layout: content + code editor | [Frontend](documentation/06-frontend-architecture.md) |
| Code Editor | CodeMirror 6 with Rust/TS/JSON highlighting | [Frontend](documentation/06-frontend-architecture.md) |
| XP System | Soulbound SPL Token-2022 with 10-level progression | [Gamification](documentation/07-gamification-system.md) |
| Streak System | Daily login and activity streaks with milestones | [Gamification](documentation/07-gamification-system.md) |
| Achievements | 13 achievement badges as Metaplex Core NFTs | [Gamification](documentation/07-gamification-system.md) |
| Credentials | Soulbound Metaplex Core NFTs per learning track | [Blockchain](documentation/05-solana-blockchain-integration.md) |
| Leaderboard | Global XP rankings via Helius DAS API | [API Reference](documentation/04-api-reference.md) |
| User Dashboard | Progress overview, XP, streaks, achievements | [Frontend](documentation/06-frontend-architecture.md) |
| User Profile | Public/private profiles with achievement showcase | [Frontend](documentation/06-frontend-architecture.md) |
| Certificate View | On-chain credential verification and sharing | [Blockchain](documentation/05-solana-blockchain-integration.md) |
| i18n | English, Portuguese (BR), Spanish | [i18n](documentation/13-internationalization.md) |
| Dark/Light Theme | Theme toggle with system preference detection | [Frontend](documentation/06-frontend-architecture.md) |
| Settings | Profile, account, language, theme, privacy | [Frontend](documentation/06-frontend-architecture.md) |
| Landing Page | Hero, course previews, social proof, features | [Frontend](documentation/06-frontend-architecture.md) |
| CMS Integration | Sanity CMS for course content management | [CMS](documentation/10-cms-and-content.md) |
| Analytics | GA4 + PostHog (heatmaps) + Sentry (errors) | [Analytics](documentation/15-analytics-and-monitoring.md) |
| Responsive Design | Mobile-first, all breakpoints | [Frontend](documentation/06-frontend-architecture.md) |

### Bonus Features (Implemented)

| Feature | Description | Documentation |
|---|---|---|
| Admin Dashboard | User management, course analytics, content moderation | [Admin](documentation/09-admin-dashboard.md) |
| RBAC System | Role-based access control with admin whitelist | [Auth & RBAC](documentation/02-authentication-and-rbac.md) |
| Community Forum | Discussion threads, replies, upvotes, accepted answers | [Community](documentation/08-community-forum.md) |
| Forum Moderation | Pin, lock, delete threads (admin) | [Community](documentation/08-community-forum.md) |
| Onboarding Flow | Guided new-user setup | [Frontend](documentation/06-frontend-architecture.md) |
| PWA Support | Installable, offline-capable with sync | [Deployment](documentation/14-deployment-and-infrastructure.md) |
| Push Notifications | Web Push API integration | [Notifications](documentation/11-notifications-and-events.md) |
| Daily Challenges | Daily goals for engagement | [Gamification](documentation/07-gamification-system.md) |
| Webhook System | Event-driven webhook delivery with HMAC signing | [Notifications](documentation/11-notifications-and-events.md) |
| Rate Limiting | Three-tier rate limiting (lenient/default/strict) | [Security](documentation/12-security-practices.md) |
| Account Lockout | Brute-force protection (5 attempts / 15min lock) | [Security](documentation/12-security-practices.md) |
| Audit Logging | Full auth event audit trail | [Security](documentation/12-security-practices.md) |
| Event System | On-chain event listener with handler pipeline | [Notifications](documentation/11-notifications-and-events.md) |
| Devnet Integration | Full program interaction on Solana Devnet | [Blockchain](documentation/05-solana-blockchain-integration.md) |

---

## Routes

### Core Routes (10 Required Pages)

| Route | Page | Auth | Status |
|---|---|---|---|
| `/` | Landing Page | No | Implemented |
| `/courses` | Course Catalog | No | Implemented |
| `/courses/[slug]` | Course Detail | No | Implemented |
| `/courses/[slug]/lessons/[id]` | Lesson View + Code Editor | Yes | Implemented |
| `/dashboard` | User Dashboard | Yes | Implemented |
| `/profile` | User Profile (own) | Yes | Implemented |
| `/profile/[username]` | Public Profile | No | Implemented |
| `/leaderboard` | XP Leaderboard | No | Implemented |
| `/settings` | User Settings | Yes | Implemented |
| `/certificates/[id]` | Credential/Certificate View | No | Implemented |

### Additional Routes

| Route | Page | Auth | Category |
|---|---|---|---|
| `/login` | Login Page | No | Auth |
| `/onboarding` | Onboarding Flow | Yes | Bonus |
| `/achievements` | Achievement Showcase | Yes | Core |
| `/challenges` | Daily Challenges | Yes | Bonus |
| `/community` | Forum Thread List | No | Bonus |
| `/community/new` | Create Thread | Yes | Bonus |
| `/community/[id]` | Thread Detail | No | Bonus |
| `/admin` | Admin Dashboard | Admin | Bonus |
| `/admin/users` | User Management | Admin | Bonus |
| `/admin/courses` | Course Management | Admin | Bonus |
| `/admin/community` | Forum Moderation | Admin | Bonus |
| `/offline` | PWA Offline Fallback | No | Bonus |

---

## Tech Stack

### Frontend

| Technology | Version | Purpose |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.1.6 | React framework (App Router) |
| [React](https://react.dev) | 19.2.3 | UI library |
| [TypeScript](https://www.typescriptlang.org) | 5.x | Type safety (strict mode) |
| [Tailwind CSS](https://tailwindcss.com) | 4.x | Utility-first styling |
| [shadcn/ui](https://ui.shadcn.com/) | N/A | Reusable component system |
| [Radix UI](https://www.radix-ui.com) | 1.4.x | Accessible UI primitives |
| [Framer Motion](https://www.framer.com/motion) | 12.34.x | Animations |
| [CodeMirror](https://codemirror.net/6) | 6.x | Code editor frontend |
| [Judge0 CE](https://judge0.com) | v1.13.x | Code execution sandboxing |
| [Lucide React](https://lucide.dev) | 0.575.x | Icon system |

### Solana / Blockchain

| Technology | Purpose |
|---|---|
| [@solana/wallet-adapter](https://github.com/solana-labs/wallet-adapter) | Multi-wallet connection |
| [@coral-xyz/anchor](https://www.anchor-lang.com) | Program client (IDL) |
| [SPL Token-2022](https://spl.solana.com/token-2022) | Soulbound XP tokens |
| [Metaplex Core](https://developers.metaplex.com) | Credential & achievement NFTs |
| [Helius DAS API](https://docs.helius.dev) | Indexed asset queries |

### Backend / Infrastructure

| Technology | Purpose |
|---|---|
| [NextAuth.js](https://next-auth.js.org) v4 | Authentication (JWT) |
| [Prisma](https://www.prisma.io) v7 | Database ORM |
| [Supabase](https://supabase.com) | PostgreSQL + Auth |
| [Upstash Redis](https://upstash.com) | Rate limiting & caching |
| [Sanity](https://www.sanity.io) | Headless CMS |

### Analytics / Monitoring

| Technology | Purpose |
|---|---|
| [Google Analytics 4](https://analytics.google.com) | Traffic & engagement analytics |
| [PostHog](https://posthog.com) | Heatmaps, session recordings, product analytics |
| [Sentry](https://sentry.io) | Error monitoring, performance, session replay |

### i18n

| Technology | Purpose |
|---|---|
| [next-intl](https://next-intl-docs.vercel.app) v4.8 | Internationalization framework |
| [i18nexus](https://i18nexus.com) | Translation management |

### Deployment

| Service | Purpose |
|---|---|
| [Vercel](https://vercel.com) | Hosting & preview deployments |
| [GitHub Actions](https://github.com/features/actions) | CI/CD pipeline |

---

## Getting Started

### Prerequisites

- **Node.js** 20+
- **npm** 10+
- **Solana CLI** (optional, for on-chain testing)
- A Solana wallet (Phantom, Solflare, etc.)

### Installation

```bash
# Clone the repository
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy/app

# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Generate translation files
node scripts/generate-translations.js

# Start development server
npm run dev
```

### Environment Variables

Create a `.env.local` file in the `app/` directory:

```env
# ── Database (Required) ───────────────────────────
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
DATABASE_URL=your-database-url

# ── Authentication (Required) ─────────────────────
AUTH_SECRET=your-auth-secret
NEXTAUTH_URL=http://localhost:3000
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret

# ── Solana (Recommended) ──────────────────────────
NEXT_PUBLIC_SOLANA_NETWORK=devnet
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_HELIUS_RPC_URL=your-helius-rpc-url
BACKEND_SIGNER_PRIVATE_KEY=your-backend-signer-key

# ── Redis (Recommended for rate limiting) ─────────
UPSTASH_REDIS_REST_URL=your-redis-url
UPSTASH_REDIS_REST_TOKEN=your-redis-token

# ── CMS (Optional) ───────────────────────────────
SANITY_PROJECT_ID=your-sanity-project-id
SANITY_DATASET=production
SANITY_API_TOKEN=your-sanity-token

# ── Analytics (Optional) ─────────────────────────
NEXT_PUBLIC_GA_ID=G-XXXXXXXXXX
NEXT_PUBLIC_POSTHOG_KEY=phc_XXXXXXXXXX
SENTRY_DSN=https://xxx@sentry.io/xxx
```

For a full list of environment variables, see [Deployment & Infrastructure](documentation/14-deployment-and-infrastructure.md#environment-variables).

### Build

```bash
npm run build    # Production build
npm run start    # Start production server
```

---

## Documentation

Complete technical documentation is available in the [`documentation/`](documentation/) directory:

### Architecture

| # | Document | Description |
|---|---|---|
| 01 | [Architecture Overview](documentation/01-architecture-overview.md) | System architecture, tech stack, deployment topology, module dependencies |
| 06 | [Frontend Architecture](documentation/06-frontend-architecture.md) | Routing, components, hooks, state management, provider hierarchy |
| 14 | [Deployment & Infrastructure](documentation/14-deployment-and-infrastructure.md) | Vercel deployment, build pipeline, env variables, PWA, monitoring |

### Authentication & Security

| # | Document | Description |
|---|---|---|
| 02 | [Authentication & RBAC](documentation/02-authentication-and-rbac.md) | Wallet/OAuth auth flows, account linking, RBAC, session management |
| 12 | [Security Practices](documentation/12-security-practices.md) | Rate limiting, lockout, audit logging, input sanitization, env validation |

### Data & API

| # | Document | Description |
|---|---|---|
| 03 | [Database Design](documentation/03-database-design.md) | Prisma schema, ERD, 14+ table definitions, indexing, migrations |
| 04 | [API Reference](documentation/04-api-reference.md) | All 58 API endpoints with request/response schemas |

### Blockchain

| # | Document | Description |
|---|---|---|
| 05 | [Solana Blockchain Integration](documentation/05-solana-blockchain-integration.md) | Program accounts, PDAs, TransactionBuilder, XP tokens, credentials, achievements |

### Features

| # | Document | Description |
|---|---|---|
| 07 | [Gamification System](documentation/07-gamification-system.md) | XP system, level progression, streaks, 13 achievements, credentials |
| 08 | [Community Forum](documentation/08-community-forum.md) | Threads, replies, upvotes, moderation |
| 09 | [Admin Dashboard](documentation/09-admin-dashboard.md) | Admin access control, whitelist, user management, analytics |
| 10 | [CMS & Content](documentation/10-cms-and-content.md) | Sanity CMS schemas, content pipeline, CMS + on-chain data merge |
| 11 | [Notifications & Events](documentation/11-notifications-and-events.md) | Event listener, job queue, webhooks, push notifications, cron |
| 16 | [Code Editor Integration](documentation/16-code-editor-integration.md) | CodeMirror 6, Judge0 CE execution pipeline, test cases, code challenge interface |

### Analytics & i18n

| # | Document | Description |
|---|---|---|
| 13 | [Internationalization](documentation/13-internationalization.md) | Locale routing, translation workflow, frontend integration |
| 15 | [Analytics & Monitoring](documentation/15-analytics-and-monitoring.md) | GA4, PostHog (heatmaps), Sentry (error monitoring), custom events |

---

## On-Chain Program

| Component | Address | Network |
|---|---|---|
| Program ID | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` | Devnet |
| XP Token Mint | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` | Devnet |
| Authority | `ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn` | Devnet |

**Program Statistics:** 16 instructions, 6 PDA types, 26 error variants, 15 events

---

## Performance Targets

| Metric | Target |
|---|---|
| Lighthouse Performance | 90+ |
| Lighthouse Accessibility | 95+ |
| Lighthouse Best Practices | 95+ |
| Lighthouse SEO | 90+ |
| LCP | < 2.5s |
| FID | < 100ms |
| CLS | < 0.1 |

---

## Project Structure

```
app/
  app/                      # Next.js App Router (routes + API)
  backend/                  # Server-side business logic
  components/               # React components (23 feature areas)
  context/                  # Frontend utilities, hooks, services
    analytics/              # GA4, PostHog, Sentry integrations
    hooks/                  # 19 custom React hooks
    solana/                 # 14 Solana integration services
    types/                  # TypeScript type definitions
    i18n/                   # Internationalization config
  prisma/                   # Database schema + migrations
  sanity/                   # CMS schema definitions
  public/                   # Static assets
  documentation/            # Technical documentation (15 files)
```

---

## License

This project is open-source under the [MIT License](LICENSE).

---

<p align="center">
  Built for <a href="https://superteam.fun">Superteam Brazil</a> by the community
</p>
