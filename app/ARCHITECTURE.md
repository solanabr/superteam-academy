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
    ├── SolanaProvider (dynamic, no SSR)
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
