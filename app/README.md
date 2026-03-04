# Superteam Academy — Frontend

> Next.js 16 frontend for the Superteam Academy on-chain learning platform.

**🌐 Live Demo:** [superteam-academy-sigma.vercel.app](https://superteam-academy-sigma.vercel.app)

---

## Getting Started

```bash
npm install
npm run dev
# → http://localhost:3000
```

### Environment Variables

Create a `.env.local` file:

```env
# Solana RPC (Helius recommended for DAS API support)
NEXT_PUBLIC_SOLANA_RPC_URL=https://devnet.helius-rpc.com/?api-key=YOUR_KEY
NEXT_PUBLIC_HELIUS_API_KEY=YOUR_KEY

# Program addresses (devnet)
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3

# Analytics (optional)
NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXXXXX

# CMS (optional, for Sanity integration)
NEXT_PUBLIC_SANITY_PROJECT_ID=your-project-id
NEXT_PUBLIC_SANITY_DATASET=production
```

---

## Architecture

```
src/
├── app/                    ← App Router (pages & layouts)
│   ├── layout.tsx          ← Root layout (providers, sidebar, theme)
│   ├── page.tsx            ← Landing page
│   ├── dashboard/          ← Learner dashboard
│   ├── courses/            ← Course catalog & detail
│   ├── courses/[slug]/     ← Course detail & lessons
│   ├── leaderboard/        ← XP rankings
│   ├── profile/[username]/ ← Public profiles
│   ├── admin/              ← Admin panel
│   ├── settings/           ← User preferences
│   ├── certificates/       ← Credential NFTs
│   ├── onboarding/         ← Skill quiz
│   └── api/                ← API routes
├── components/
│   ├── layout/             ← Sidebar, ThemeToggle, ThemeProvider
│   ├── course/             ← CourseCard
│   ├── Analytics.tsx       ← GA4 integration
│   └── LocaleSwitcher.tsx  ← Language dropdown
├── lib/
│   ├── pda.ts              ← PDA derivation (6 account types)
│   ├── xp.ts               ← XP level calculations & formatting
│   ├── bitmap.ts           ← On-chain bitmap lesson progress
│   ├── helius.ts           ← Helius DAS API client
│   ├── cms.ts              ← CMS interface (Repository Pattern)
│   ├── courses.ts          ← Static course data (7 courses, 30+ lessons)
│   ├── services.ts         ← Backend service layer
│   └── utils.ts            ← Utilities
├── providers/
│   ├── WalletProvider.tsx  ← Solana Wallet Adapter setup
│   ├── Providers.tsx       ← Combined provider tree
│   └── NextIntlProvider.tsx ← i18n provider
├── hooks/
│   └── useXP.ts            ← Real-time XP balance & level hook
├── messages/
│   ├── en.json             ← English (270+ strings)
│   ├── pt-BR.json          ← Portuguese (270+ strings)
│   └── es.json             ← Spanish (270+ strings)
└── i18n/
    └── request.ts          ← next-intl configuration
```

---

## On-Chain Integration

### PDA Derivation (`src/lib/pda.ts`)

| PDA | Seeds | Purpose |
|---|---|---|
| `config` | `["config"]` | Singleton platform configuration |
| `course` | `["course", course_id]` | Course account |
| `enrollment` | `["enrollment", course_id, learner]` | Learner enrollment + lesson bitmap |
| `minter_role` | `["minter", minter]` | Registered XP minter |
| `achievement_type` | `["achievement", achievement_id]` | Achievement definition |
| `achievement_receipt` | `["achievement_receipt", achievement_id, recipient]` | Proof of award |

### Token-2022 XP (`src/lib/xp.ts`)

- Reads XP balance from the Token-2022 associated token account
- Calculates levels using a progressive XP curve
- Formats display values (e.g., "1.2K XP")

### Helius DAS API (`src/lib/helius.ts`)

- Queries credential NFTs owned by a wallet
- Fetches asset metadata for certificate display
- Powers the leaderboard with aggregated on-chain data

### Bitmap Progress (`src/lib/bitmap.ts`)

- Reads the on-chain bitmap to determine which lessons are completed
- Each bit represents one lesson (supports up to 256 lessons per course)

---

## CMS Integration

See [CMS_GUIDE.md](CMS_GUIDE.md) for full documentation.

The app uses the **Repository Pattern** — swap `StaticCmsService` for `SanityCmsService` in `src/lib/cms.ts` for headless CMS integration.

---

## Design Tokens

| Token | Light | Dark |
|---|---|---|
| `--primary` | `263 70% 58%` | `263 90% 67%` |
| `--background` | `0 0% 98%` | `240 10% 8%` |
| `--card` | `0 0% 100%` | `240 6% 12%` |
| `--border` | `0 0% 90%` | `240 6% 18%` |

Theme toggle persists to `localStorage` and defaults to system preference.

---

## Building for Production

```bash
npm run build
npm start
```

## Deployment

The app is deployed on Vercel. For new deployments:

```bash
npx vercel deploy --prod
```

---

## License

[MIT](../LICENSE)
