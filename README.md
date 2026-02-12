<p align="center">
  <img src="docs/assets/logo.png" alt="Superteam Academy" width="120" />
</p>

<h1 align="center">Superteam Academy</h1>

<p align="center">
  <strong>The Learning Platform for Solana Developers</strong><br/>
  Interactive courses · Code challenges · On-chain credentials · Gamified learning
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#project-structure">Structure</a> •
  <a href="#deployment">Deploy</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## Screenshots

| Home | Course Catalog | Lesson (Code Challenge) |
|------|---------------|------------------------|
| ![Home](docs/assets/screenshot-home.png) | ![Courses](docs/assets/screenshot-courses.png) | ![Lesson](docs/assets/screenshot-lesson.png) |

| Dashboard | Leaderboard | Profile |
|-----------|-------------|---------|
| ![Dashboard](docs/assets/screenshot-dashboard.png) | ![Leaderboard](docs/assets/screenshot-leaderboard.png) | ![Profile](docs/assets/screenshot-profile.png) |

---

## Features

### 🎓 10 Core Pages
| Page | Description |
|------|-------------|
| **Landing** | Animated hero, stats, learning paths, testimonials |
| **Course Catalog** | Filter by difficulty, search, categories |
| **Course Detail** | Syllabus, module tree, enrollment, progress |
| **Lesson Viewer** | Video, rich content, code challenges (Monaco), quizzes |
| **Student Dashboard** | XP level, streak calendar, activity feed, enrolled courses |
| **Leaderboard** | Global & weekly rankings, XP & streak filters |
| **Profile** | Public profile, badge grid, skill radar chart, credentials |
| **Certificates** | On-chain verifiable credentials (cNFT), share & verify |
| **Settings** | Profile editing, wallet connections, preferences, privacy |
| **Auth** | Sign in with Google, GitHub, or Solana wallet |

### 🏆 Gamification
- XP system with leveling curve
- 7-day streak tracking with bonuses
- Achievement badges (Explorer, Streak Master, etc.)
- Global leaderboard with real-time rankings

### ⛓️ On-Chain Integration (Solana Devnet)
- Soulbound XP tokens (Token-2022 read)
- Compressed NFT credentials (cNFTs via Bubblegum)
- On-chain verification for certificates
- Wallet-based authentication (Phantom, Backpack, Solflare)

### 🎭 Role-Based Access Control (RBAC)
| Role | Access |
|------|--------|
| **Admin** | Full platform management (`/admin/*`) |
| **Professor** | Course creation & student analytics (`/teach/*`) |
| **Student** | Learning, progress, credentials |

### 🌍 Internationalization
- 3 languages: English, Português (BR), Español
- Content & UI fully translated via `next-intl`

### 📊 Analytics
- GA4, PostHog (heatmaps), Sentry (error tracking)
- Custom event tracking for lessons, enrollments, challenges

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router, RSC) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS 3.4 + CSS variables |
| Components | shadcn/ui + Radix UI |
| Auth | NextAuth.js + Solana Wallet Adapter |
| Database | Supabase (Postgres + RLS + Realtime) |
| CMS | Sanity v3 (structured content) |
| Code Editor | Monaco Editor (dynamic import, SSR-safe) |
| Blockchain | Solana (devnet) — @solana/web3.js, @metaplex |
| i18n | next-intl (type-safe) |
| Analytics | Google Analytics 4, PostHog, Sentry |
| Email | Resend |
| Package Manager | pnpm (workspace) |
| Deploy | Vercel |

---

## Getting Started

### Prerequisites

- **Node.js** ≥ 18
- **pnpm** ≥ 8
- Supabase project (free tier works)
- Sanity project (free tier works)
- OAuth credentials (Google, GitHub) — optional for dev

### Installation

```bash
# Clone
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy

# Install dependencies
pnpm install

# Configure environment
cp apps/web/.env.example apps/web/.env.local
# Edit .env.local with your credentials

# Run development server
pnpm dev

# Build for production
pnpm build
```

The app runs at **http://localhost:3000**.

---

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | ✅ | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | ✅ | Supabase anonymous key |
| `SUPABASE_SERVICE_KEY` | ✅ | Supabase service role key (server only) |
| `NEXTAUTH_URL` | ✅ | App URL (http://localhost:3000 for dev) |
| `NEXTAUTH_SECRET` | ✅ | Random secret (`openssl rand -base64 32`) |
| `GOOGLE_CLIENT_ID` | ⬜ | Google OAuth client ID |
| `GOOGLE_CLIENT_SECRET` | ⬜ | Google OAuth client secret |
| `GITHUB_CLIENT_ID` | ⬜ | GitHub OAuth client ID |
| `GITHUB_CLIENT_SECRET` | ⬜ | GitHub OAuth client secret |
| `NEXT_PUBLIC_SANITY_PROJECT_ID` | ✅ | Sanity project ID |
| `NEXT_PUBLIC_SANITY_DATASET` | ✅ | Sanity dataset (`production`) |
| `SANITY_API_TOKEN` | ⬜ | Sanity write token |
| `NEXT_PUBLIC_SOLANA_RPC` | ✅ | Solana RPC endpoint |
| `NEXT_PUBLIC_SOLANA_NETWORK` | ✅ | `devnet` or `mainnet-beta` |
| `NEXT_PUBLIC_GA_ID` | ⬜ | Google Analytics 4 measurement ID |
| `NEXT_PUBLIC_POSTHOG_KEY` | ⬜ | PostHog API key |
| `NEXT_PUBLIC_SENTRY_DSN` | ⬜ | Sentry DSN |
| `RESEND_API_KEY` | ⬜ | Resend API key for emails |
| `NEXT_PUBLIC_APP_URL` | ⬜ | Public app URL (for sitemap, OG) |

---

## Project Structure

```
superteam-academy/
├── apps/
│   ├── web/                          # Next.js 14 application
│   │   ├── public/                   # Static assets, robots.txt
│   │   └── src/
│   │       ├── app/                  # App Router pages
│   │       │   ├── (admin)/          # Admin routes (RBAC: admin)
│   │       │   ├── (auth)/           # Authenticated routes
│   │       │   ├── (public)/         # Public routes
│   │       │   ├── (teach)/          # Teacher routes (RBAC: professor)
│   │       │   ├── api/              # API routes (NextAuth)
│   │       │   ├── error.tsx         # Global error boundary
│   │       │   ├── not-found.tsx     # Custom 404
│   │       │   ├── sitemap.ts        # Dynamic sitemap
│   │       │   └── layout.tsx        # Root layout
│   │       ├── components/
│   │       │   ├── admin/            # Admin-specific components
│   │       │   ├── certificates/     # Certificate & credential UI
│   │       │   ├── dashboard/        # XP display, streak, activity
│   │       │   ├── layout/           # Header, footer, sidebar, search
│   │       │   ├── leaderboard/      # Ranking table
│   │       │   ├── lessons/          # Code editor, quiz, video, content
│   │       │   ├── profile/          # Badges, radar chart, credentials
│   │       │   ├── providers/        # Theme, session, analytics
│   │       │   ├── settings/         # Forms for settings page
│   │       │   ├── teach/            # Course & lesson editors
│   │       │   └── ui/              # shadcn/ui primitives
│   │       ├── hooks/                # Custom React hooks
│   │       ├── i18n/                 # Internationalization config
│   │       ├── lib/                  # Utilities, analytics, auth
│   │       ├── services/             # Service interfaces (clean arch)
│   │       └── types/                # TypeScript type definitions
│   └── cms/                          # Sanity Studio
│       └── schemas/                  # Content schemas
├── packages/                         # Shared packages (future)
├── ARCHITECTURE.md
├── CMS_GUIDE.md
├── CUSTOMIZATION.md
└── README.md
```

---

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in [Vercel](https://vercel.com)
3. Set **Root Directory** to `apps/web`
4. Add all environment variables
5. Deploy — Vercel auto-detects Next.js

### Build Commands

```bash
pnpm build          # Build all apps
pnpm dev            # Dev server with hot reload
pnpm lint           # ESLint
pnpm type-check     # TypeScript compiler check
```

---

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes with tests
4. Ensure `pnpm build` passes with zero errors
5. Submit a pull request

### Conventions
- **Commits:** Conventional Commits (`feat:`, `fix:`, `docs:`, `chore:`)
- **Code style:** Prettier + ESLint (auto-configured)
- **Types:** Strict TypeScript, no `any`
- **Components:** shadcn/ui patterns, composable, accessible

---

## License

MIT © [Superteam Brazil](https://github.com/solanabr)
