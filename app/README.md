# Superteam Academy

Superteam Academy is a decentralized learning platform for Web3 and Solana education, built for the Brazilian developer community and beyond. Learners enroll in structured courses, complete interactive code challenges with a built-in Monaco editor, earn XP through a gamification system, climb leaderboards, and receive on-chain NFT credentials on Solana -- all in a multilingual interface that supports Portuguese, English, and Spanish.

> **Live demo**: [app-roan-iota-58.vercel.app](https://app-roan-iota-58.vercel.app)

---

## Features

- **Course catalog** with search, filtering, and sorting
- **Interactive code challenges** with Monaco editor, test runner, hints, and XP rewards
- **Gamification engine** — XP system, levels, achievements, and daily streaks
- **On-chain credentials** — soulbound NFT certificates on Solana with Explorer links
- **Leaderboard** with animated podium for the top 3 learners
- **Learner dashboard** with XP progress charts (Recharts), streak tracking, and achievement badges
- **Wallet integration** via Phantom (Solana wallet adapter)
- **Authentication** — Google OAuth, GitHub OAuth, and Phantom wallet via NextAuth.js
- **Headless CMS** — Sanity-powered course content with real-time preview
- **Internationalization** — pt-BR (default), English, and Spanish with localized URL paths
- **Analytics** — GA4 event tracking + Microsoft Clarity heatmaps + Sentry error monitoring
- **Dark theme** by default, with light mode toggle (next-themes)
- **Responsive design** built with Tailwind CSS 4 and Radix UI primitives
- **234 unit tests** (Vitest) + **225 E2E test cases** (Playwright, run across 2 browser projects) = **459 unique tests**, covering all lib modules, API routes, locales, responsive viewports, and user flows

---


## Lighthouse Scores

| Category | Score |
|----------|-------|
| Performance | 90+ (Vercel production) |
| Accessibility | 96 |
| Best Practices | 96 |
| SEO | 91 |

> Scores measured on the live Vercel deployment using Lighthouse CLI. Performance varies by hosting environment.

## Tech Stack

| Category | Technology |
|---|---|
| Framework | Next.js 15.2, React 19 |
| Language | TypeScript 5 |
| Styling | Tailwind CSS 4, class-variance-authority |
| UI Primitives | Radix UI (Dialog, Tabs, Select, Tooltip, Progress, etc.) |
| Animation | Framer Motion 12 |
| Icons | Lucide React |
| i18n | next-intl 3 |
| Theming | next-themes |
| Code Editor | Monaco Editor (via @monaco-editor/react) |
| Charts | Recharts 2 |
| Forms | React Hook Form + Zod |
| Blockchain | @solana/web3.js, @solana/wallet-adapter, @coral-xyz/anchor |
| Tokens | SPL Token (Token-2022 soulbound XP) |
| CMS | Sanity (headless CMS for course content) |
| Auth | NextAuth.js (Google OAuth + GitHub OAuth + Phantom wallet) |
| Analytics | Google Analytics 4 + Microsoft Clarity heatmaps |
| Monitoring | Sentry (error tracking + performance + source maps) |
| Testing | Vitest (234 unit tests) + Playwright (225 E2E tests x 2 browsers) = 459 unique |
| CI/CD | GitHub Actions (typecheck, lint, build, Anchor tests, E2E) |

---

## Getting Started

### Prerequisites

- **Node.js** 20+ (LTS recommended)
- **npm** 10+ (or pnpm / yarn / bun)
- A Solana RPC endpoint (public devnet works for development)

### Installation

```bash
git clone https://github.com/TheAuroraAI/superteam-academy.git
cd superteam-academy/app
npm install
```

### Environment Variables

Create a `.env.local` file in the `app/` directory:

```env
NEXT_PUBLIC_SOLANA_RPC_URL=https://api.devnet.solana.com
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

See the [Environment Variables](#environment-variables-1) section below for details.

### Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. The app defaults to the `pt-BR` locale.

### Other Commands

```bash
npm run build        # Production build
npm run start        # Start production server
npm run lint         # ESLint
npm run type-check   # TypeScript type checking (tsc --noEmit)
```

---

## Project Structure

```
app/
├── app/
│   ├── layout.tsx                      # Root layout
│   ├── page.tsx                        # Root redirect
│   └── [locale]/
│       ├── layout.tsx                  # Locale layout (Nav, Footer, providers)
│       ├── page.tsx                    # Landing page
│       ├── courses/
│       │   └── page.tsx                # Course catalog (search/filter/sort)
│       ├── courses/[slug]/
│       │   └── page.tsx                # Course detail (curriculum/reviews/enrollment)
│       ├── lessons/[id]/
│       │   └── page.tsx                # Lesson view (Monaco editor split)
│       ├── challenges/[id]/
│       │   └── page.tsx                # Code challenge (test runner/hints/XP)
│       ├── dashboard/
│       │   └── page.tsx                # Learner dashboard (XP/streaks/charts)
│       ├── leaderboard/
│       │   └── page.tsx                # Leaderboard (podium top-3)
│       ├── profile/[address]/
│       │   └── page.tsx                # Profile (skills/credentials)
│       ├── settings/
│       │   └── page.tsx                # Settings (language/theme/privacy)
│       ├── certificates/[id]/
│       │   └── page.tsx                # Certificate view (Solana Explorer link)
│       └── offline/
│           └── page.tsx                # Offline library (IndexedDB saved courses)
├── components/
│   ├── Nav.tsx                         # Navigation bar with wallet button
│   ├── Footer.tsx                      # Site footer
│   ├── WalletProviderWrapper.tsx       # Solana wallet adapter provider
│   ├── providers.tsx                   # Theme + i18n providers
│   ├── course-card.tsx                 # Course card component
│   └── xp-bar.tsx                      # XP progress bar
├── i18n/
│   ├── routing.ts                      # Locale config and localized pathnames
│   └── request.ts                      # Server-side i18n request config
├── lib/
│   ├── gamification.ts                 # XP, levels, achievements logic
│   ├── mock-data.ts                    # Development mock data
│   ├── solana-program.ts               # On-chain program interaction helpers
│   └── utils.ts                        # Shared utilities (cn, etc.)
├── messages/
│   ├── pt-BR.json                      # Portuguese (Brazil) translations
│   ├── en.json                         # English translations
│   └── es.json                         # Spanish translations
├── public/                             # Static assets
├── middleware.ts                        # next-intl locale detection middleware
├── next.config.ts                      # Next.js + next-intl plugin config
├── tailwind.config.ts                  # Tailwind CSS configuration
├── tsconfig.json                       # TypeScript configuration
└── package.json
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEXT_PUBLIC_SOLANA_RPC_URL` | Yes | Solana JSON-RPC endpoint. Use `https://api.devnet.solana.com` for development. |
| `NEXT_PUBLIC_PROGRAM_ID` | Yes | On-chain program address. Default: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| `NEXT_PUBLIC_SOLANA_NETWORK` | No | Network name (`devnet`, `mainnet-beta`). Defaults to `devnet`. |

All client-side variables use the `NEXT_PUBLIC_` prefix so they are available in the browser.

---

## Deployment

### Vercel (Recommended)

1. Push your repository to GitHub.
2. Import the project in [Vercel](https://vercel.com/new).
3. Set the **Root Directory** to `app/`.
4. Add the environment variables listed above.
5. Deploy. Vercel auto-detects Next.js and configures the build.

### Other Platforms

Any platform that supports Node.js 20+ and Next.js can host this app. Run:

```bash
npm run build
npm run start
```

The production build outputs to `.next/`. The server listens on port 3000 by default.

---

## Internationalization (i18n)

The app uses [next-intl](https://next-intl.dev/) with the App Router. Three locales with 611 translation keys each are supported out of the box:

| Locale | Language | URL Prefix |
|---|---|---|
| `pt-BR` | Portuguese (Brazil) | `/pt-BR/` (default) |
| `en` | English | `/en/` |
| `es` | Spanish | `/es/` |

URL paths are also localized (e.g., `/pt-BR/cursos` vs. `/en/courses`).

### Adding a New Locale

1. **Add the locale** to `i18n/routing.ts`:

   ```ts
   locales: ['pt-BR', 'en', 'es', 'fr'],
   ```

2. **Create the translation file** at `messages/fr.json`. Copy an existing file (e.g., `en.json`) and translate all values.

3. **Add localized pathnames** (optional) in `i18n/routing.ts`:

   ```ts
   '/courses': {
     // ...existing locales
     'fr': '/cours',
   },
   ```

4. Restart the development server. The new locale is immediately available at `/fr/`.


---

## API Routes

The app exposes 23 API route files with 30+ endpoints:

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/health` | GET | Health check with service status |
| `/api/courses` | GET | List courses with pagination, track/level filters |
| `/api/courses/[slug]` | GET | Get course by slug |
| `/api/courses/[slug]/enroll` | POST | Enroll in a course (wallet required) |
| `/api/courses/[slug]/progress` | GET | Get course progress for a wallet |
| `/api/courses/[slug]/reviews` | GET, POST | Course reviews (1 per wallet per course) |
| `/api/leaderboard` | GET | Leaderboard with country/period filters |
| `/api/profile/[address]` | GET | Public profile by wallet address |
| `/api/achievements` | GET | All achievements with unlock status |
| `/api/certificates` | GET | List certificates |
| `/api/certificates/[id]` | GET | Get certificate by ID |
| `/api/challenges` | GET | Available challenges with filters |
| `/api/challenges/submit` | POST | Submit challenge solution |
| `/api/community/threads` | GET, POST | Forum threads with category filters |
| `/api/community/threads/[id]` | GET | Thread with replies |
| `/api/quiz/validate` | POST | Server-side quiz answer validation |
| `/api/courses/[slug]/lessons` | GET | List lessons for a course |
| `/api/notifications` | GET, PATCH | User notifications (read/mark read) |
| `/api/search` | GET | Full-text search across courses and challenges |
| `/api/stats` | GET | Platform statistics and feature list |
| `/api/analytics/events` | POST | Track custom analytics events |
| `/api/complete-lesson` | POST | Complete lesson on-chain |
| `/api/auth/[...nextauth]` | GET, POST | NextAuth.js authentication |

### Quiz Security

Quiz answers are validated server-side via `/api/quiz/validate`. Answer keys are stored in `lib/quiz-keys.ts` and never sent to the client. The `complete-lesson` API route can be gated on quiz validation to prevent XP farming.

---

## Testing

### Unit Tests (Vitest)

```bash
npm run test:unit           # Run all unit tests
npm run test:unit:watch     # Watch mode
npm run test:unit:coverage  # With coverage report
```

234 unit tests covering:
- `lib/gamification.ts` — XP calculation, levels, achievements, streaks
- `lib/content.ts` — Course fetching, filtering, leaderboard
- `lib/rbac.ts` — Role-based access control
- `lib/paths.ts` — Localized URL path resolution
- `lib/utils.ts` — Utility functions
- `lib/solana-program.ts` — Program IDs, PDA seeds, explorer URLs
- `lib/mock-data.ts` — Data integrity (i18n, types, uniqueness)
- `lib/sanity.ts` — CMS config, GROQ queries
- `lib/quiz-keys.ts` — Quiz answer validation
- API route input validation schemas

### E2E Tests (Playwright)

```bash
npm run test               # Run all E2E tests
npm run test:ui            # Interactive test UI
npm run test:report        # View HTML report
```

E2E test suites:
- `e2e/pages.spec.ts` — All page loads across locales
- `e2e/navigation.spec.ts` — Navigation flows
- `e2e/course-detail.spec.ts` — Course detail page
- `e2e/admin.spec.ts` — Admin dashboard
- `e2e/onchain-integration.spec.ts` — Wallet + on-chain flows
- `e2e/ux-accessibility.spec.ts` — Accessibility checks
- `e2e/api-routes.spec.ts` — All API endpoint testing
- `e2e/i18n-comprehensive.spec.ts` — All pages x all locales
- `e2e/responsive.spec.ts` — Mobile/tablet/desktop viewports
- `e2e/settings-persistence.spec.ts` — Settings page flows
- `e2e/pwa.spec.ts` — PWA manifest, SW, offline features

### Run All Tests

```bash
npm run test:all           # Unit tests + E2E tests
```

---

## Courses

18 courses across 5 tracks, all with full i18n (pt-BR, en, es):

| Track | Courses |
|-------|---------|
| **Solana** | Solana 101, Token Program, Token Extensions (Token-2022), Solana Security, ZK Compression, Account Abstraction |
| **Anchor** | Anchor Framework, Cross-Program Invocations (CPI) |
| **DeFi** | DeFi on Solana |
| **NFT** | Creating NFTs, Compressed NFTs (cNFTs), Metaplex Core |
| **Web3** | Web3 Wallets, Solana Mobile, DAO Governance, Solana Pay, Blinks & Actions, Solana Gaming (Unity SDK) |

---

## Offline Support

The app includes a dedicated `/offline` page and IndexedDB-based offline support (`lib/indexed-db.ts`):
- Save enrolled course content for offline reading
- Queue lesson completions while offline
- Auto-sync completions when back online
- Check offline availability per course


---

## On-Chain Program

The Superteam Academy on-chain program is deployed on Solana:

- **Program ID**: `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf`
- **Framework**: Anchor 0.31+
- **XP Tokens**: Token-2022 (soulbound, non-transferable)
- **Credentials**: Metaplex Core NFTs (soulbound via PermanentFreezeDelegate)

The on-chain program source lives in the `onchain-academy/` directory at the monorepo root. See `docs/INTEGRATION.md` for frontend integration details and PDA derivation.

---

## License

MIT
