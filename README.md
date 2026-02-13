# Superteam Academy

**The open-source, gamified learning platform for Solana developers.**

Built by [Superteam Brazil](https://superteam.fun) for the global Solana ecosystem. Learn through interactive lessons, solve coding challenges in a browser-based editor, earn XP and on-chain credentials, and climb the leaderboard.

![Next.js](https://img.shields.io/badge/Next.js-14-black?logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue?logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8?logo=tailwindcss)
![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?logo=solana)
![License](https://img.shields.io/badge/License-MIT-green)

---

## Screenshots

> Screenshots coming soon — run `npm run dev` to see it live.

| Landing Page | Course Catalog | Code Challenge |
|:---:|:---:|:---:|
| *Hero with animated gradient* | *Filterable course grid* | *Monaco editor + test runner* |

| Dashboard | Leaderboard | Certificate |
|:---:|:---:|:---:|
| *XP, streaks, achievements* | *Global rankings* | *On-chain verification* |

---

## Features

- **Interactive Code Editor** — Monaco-powered TypeScript editor with real-time test execution
- **Gamification System** — XP points, levels (`sqrt(xp/100)`), daily streaks, 256 bitmap achievements
- **On-Chain Credentials** — Compressed NFTs (cNFTs) issued on Solana Devnet via Metaplex Bubblegum
- **10 Pages** — Landing, Courses, Course Detail, Lesson, Dashboard, Profile, Leaderboard, Settings, Certificates, Admin
- **Multi-Language** — Full i18n with English, Portuguese (BR), and Spanish
- **Solana Wallet Adapter** — Connect with Phantom, Solflare, Backpack, and more
- **Dark Mode First** — Solana-branded theme (#9945FF / #14F195) with light mode support
- **Sanity CMS** — Manage courses, modules, and lessons through a headless CMS
- **Responsive Design** — Mobile-first with Tailwind CSS and shadcn/ui components
- **SEO Optimized** — Dynamic metadata, sitemap, OpenGraph images

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict mode) |
| Styling | Tailwind CSS + shadcn/ui |
| CMS | Sanity |
| Database | Supabase |
| Blockchain | Solana Web3.js + Wallet Adapter |
| Editor | Monaco Editor |
| Analytics | GA4 + PostHog + Sentry |
| Deployment | Vercel |

---

## Quick Start

### Prerequisites

- Node.js 18+
- npm 9+

### Setup

```bash
# Clone the repository
git clone https://github.com/solanabr/superteam-academy.git
cd superteam-academy

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Start development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

```env
# Required for full functionality (optional for demo mode)
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
SANITY_API_TOKEN=your-write-token
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_XP_MINT_ADDRESS=your-xp-token-mint
```

> **Note:** The app runs in demo mode with fallback content when CMS/database environment variables are not set.

### Scripts

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run start      # Start production server
npm run lint       # Run ESLint
npm run typecheck  # Run TypeScript compiler checks
```

---

## Architecture

```
app/                    # Next.js App Router pages (10 routes)
├── (marketing)/        # Landing page
├── courses/            # Catalog, detail, lesson pages
├── dashboard/          # User progress & stats
├── leaderboard/        # Global rankings
├── profile/            # Public developer profiles
├── settings/           # Account preferences
├── certificates/       # On-chain credential verification
├── admin/              # Course management
└── api/                # REST endpoints

components/             # React components by domain
├── ui/                 # Primitives (Button, Card) — shadcn/ui
├── courses/            # CourseCard, CourseGrid, ModuleList
├── editor/             # CodeEditor, ChallengePanel, TestRunner
├── gamification/       # XPBar, LevelBadge, StreakCalendar, etc.
├── layout/             # Header, Footer
├── auth/               # WalletButton, AccountLinker
└── shared/             # ThemeToggle, LanguageSwitcher, SkillRadar

lib/                    # Business logic & services
├── cms/                # Sanity client + fallback content
├── gamification/       # XP, levels, streaks, achievements
├── services/           # LearningProgressService interface
├── solana/             # Wallet, XP tokens, credentials
├── supabase/           # Database client & queries
├── i18n/               # Translations (en, pt-br, es)
├── analytics/          # GA4, PostHog, Sentry
└── seo/                # Metadata utilities
```

### Service Layer Pattern

The app uses an abstract `LearningProgressService` interface with swappable implementations:

- **`LocalProgressService`** — localStorage-based (current, works offline)
- **`OnChainProgressService`** — Solana program-based (future, requires backend signing)

This design allows the frontend to work identically regardless of the backend, making development and demo mode seamless.

---

## Adding Courses via CMS

### Using Sanity Studio

1. Set up a [Sanity project](https://www.sanity.io/) and add credentials to `.env.local`
2. Define schemas in `sanity/` matching the `CmsCourse` type
3. Create courses in Sanity Studio with modules and lessons
4. The app automatically fetches from Sanity when configured

### Using Fallback Content

Edit `lib/cms/fallback-content.ts` to add courses directly in code. This is used when Sanity is not configured. The structure follows the `CmsCourse` type:

```typescript
{
  _id: "course-my-course",
  slug: "my-course",
  title: "My Course",
  description: "Course description",
  topic: "Core",
  difficulty: "beginner",
  durationHours: 8,
  xpReward: 300,
  modules: [
    {
      _id: "mod-1",
      title: "Module Title",
      order: 1,
      lessons: [
        {
          _id: "les-1",
          title: "Lesson Title",
          order: 1,
          content: "Lesson content paragraphs...",
          challengePrompt: "What the learner should implement."
        }
      ]
    }
  ]
}
```

---

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch (`git checkout -b feat/my-feature`)
3. Commit your changes with descriptive messages
4. Push to the branch (`git push origin feat/my-feature`)
5. Open a Pull Request

### Guidelines

- TypeScript strict mode — no `any`
- All UI strings must go through i18n (`useI18n().t()`)
- Use shadcn/ui for all UI primitives
- Server Components by default, Client Components only when needed
- Follow existing file and folder patterns
- Test your changes with `npm run build && npm run lint`

---

## License

MIT License. See [LICENSE](LICENSE) for details.

---

<p align="center">
  Built with 💜 by <a href="https://superteam.fun">Superteam Brazil</a> for the Solana ecosystem
</p>
