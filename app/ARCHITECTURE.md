# Architecture

## System Design

```
┌──────────────────────────────────────────────────────────┐
│                    Next.js Frontend                       │
│                                                          │
│  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐ │
│  │ Landing  │  │ Catalog  │  │ Lesson   │  │ Profile  │ │
│  │ Hero     │  │ + Cards  │  │ + Monaco │  │ + XP     │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘ │
│       │              │              │              │      │
│  ┌────┴──────────────┴──────────────┴──────────────┴───┐ │
│  │              React Query Cache                       │ │
│  └──────┬────────────┬────────────┬────────────────────┘ │
│         │            │            │                       │
│  ┌──────┴──────┐ ┌───┴────┐ ┌────┴────┐                 │
│  │ Wallet      │ │ API    │ │ Helius  │                  │
│  │ Adapter     │ │ Routes │ │ DAS     │                  │
│  └──────┬──────┘ └───┬────┘ └────┬────┘                  │
└─────────┼────────────┼───────────┼───────────────────────┘
          │            │           │
          ▼            ▼           ▼
    ┌─────────┐  ┌──────────┐  ┌──────────┐
    │ Solana  │  │ Anchor   │  │ Helius   │
    │ Wallet  │  │ Program  │  │ RPC/DAS  │
    └─────────┘  └──────────┘  └──────────┘
```

## Signing Authority Pattern

| Who Signs | Instructions |
|---|---|
| **Learner wallet** | `enroll`, `close_enrollment` |
| **Backend signer** (API routes) | `complete_lesson`, `finalize_course`, `issue_credential`, `upgrade_credential` |

The backend holds a rotatable keypair. API routes validate quiz answers before signing on-chain transactions.

## Component Tree

```
app/[locale]/layout.tsx
├── ThemeProvider (next-themes)
├── NextIntlClientProvider
└── Providers
    ├── QueryClientProvider
    ├── SolanaProvider (dynamic import, SSR-compatible)
    ├── AnalyticsProvider
    └── Toaster (sonner)

(main)/layout.tsx
├── Navbar
│   ├── Logo + NetworkBadge
│   ├── Nav links
│   ├── LanguageSelector
│   ├── ConnectButton
│   └── MobileNav
├── ErrorBoundary
│   └── {page content}
└── Footer
```

## Data Flow

1. **Courses**: Anchor program `gProgramAccounts` → `useCourses` hook → React Query cache
2. **Enrollment**: PDA derivation → `useEnrollment` hook → bitmap parsing
3. **XP Balance**: Token-2022 ATA query → `useXpBalance` hook
4. **Credentials**: Helius DAS `getAssetsByOwner` → `useCredentials` hook
5. **Leaderboard**: `/api/leaderboard` → all Token-2022 holders sorted by balance
6. **Lesson Content**: Sanity GROQ query → fallback to `quiz-data.ts`

## State Management

- **Server state**: React Query with optimistic updates
- **Wallet state**: @solana/wallet-adapter-react context
- **Theme**: next-themes (persisted in localStorage)
- **Preferences**: `lib/preferences.ts` (localStorage wrapper)
- **Streak**: `lib/streak.ts` (localStorage with date tracking)

## Account Linking

The platform supports three authentication methods: **Solana wallet**, **Google OAuth**, and **GitHub OAuth**.

**Current implementation**:
- Wallet connection via `@solana/wallet-adapter-react` (Phantom, Solflare, Torus, Ledger)
- OAuth via `next-auth` (Google, GitHub) — managed on the Settings page
- Both methods work independently; wallet signs on-chain transactions, OAuth provides profile metadata

**Design for linking** (future phase):
- A `user_links` table maps `{ wallet_pubkey, oauth_provider, oauth_id }` tuples
- Linking flow: connect wallet → sign message proving ownership → associate OAuth identity
- Any linked method can initiate a session; wallet is required for on-chain actions
- Service interface: `LearningProgressService` (in `lib/learning-progress.ts`) abstracts all data access, making it straightforward to add a database layer behind it

**Why not implemented now**: The on-chain program uses wallet pubkeys as account owners. Adding a database layer for account linking requires infrastructure beyond the program's scope. The current `LearningProgressService` abstraction is designed to be extended with a persistence layer (e.g., Prisma + PostgreSQL) without changing consumer code.

## Testing

| Layer | Framework | Count | Scope |
|---|---|---|---|
| Unit | Vitest + happy-dom | 102 tests (8 files) | bitmap, level, format, errors, quiz-data, pda, rate-limit, streak |
| E2E | Playwright (chromium) | 67 tests (11 files) | navigation, theme, i18n, responsive, SEO, catalog, a11y, dashboard, course-detail, onboarding, error-pages |

Run: `npm run test:unit` (unit) / `npx playwright test` (E2E)

## Key Libraries

| Library | Purpose |
|---|---|
| `@coral-xyz/anchor` | Anchor IDL, program interaction |
| `@solana/wallet-adapter-react` | Wallet connection, signing |
| `@tanstack/react-query` | Server state, caching, optimistic updates |
| `next-intl` | i18n with 3 locales |
| `next-themes` | Dark/light/system theme |
| `motion` | Animations (Framer Motion v12) |
| `sonner` | Toast notifications |
| `canvas-confetti` | Completion celebration |
| `@monaco-editor/react` | Code challenges |
| `@sanity/client` | CMS content fetching |
| `@portabletext/react` | Rich text rendering |
| `html-to-image` | Certificate PNG export |
