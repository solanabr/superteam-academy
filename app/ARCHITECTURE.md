# Superteam Academy -- Frontend Architecture

## 1. System Overview

```
+------------------------------------------------------------------+
|                          Browser                                  |
|                                                                   |
|  +--------------------+   +----------------------------------+    |
|  | Phantom Wallet     |   | Next.js 15 App (React 19)        |    |
|  | Extension          |<->| App Router + next-intl            |    |
|  +--------------------+   |                                  |    |
|                            |  +----------+  +-------------+  |    |
|                            |  | Monaco   |  | Recharts    |  |    |
|                            |  | Editor   |  | Dashboard   |  |    |
|                            |  +----------+  +-------------+  |    |
|                            +----------------------------------+    |
+------------------------------------------------------------------+
         |                            |                    |
         v                            v                    v
+------------------+    +-------------------+    +------------------+
| Solana Devnet    |    | next-intl         |    | Tailwind CSS 4   |
| RPC (web3.js)    |    | Middleware        |    | + next-themes    |
|                  |    | Locale Detection  |    | Dark-first       |
| - Token-2022 XP  |    | & Routing         |    +------------------+
| - Metaplex Core  |    +-------------------+
|   Credentials    |
| - Anchor Program |
|   ACADBRCB3z...  |
+------------------+
```

**Stack summary:**

| Layer            | Technology                                           |
|------------------|------------------------------------------------------|
| Framework        | Next.js 15.2 (App Router, React 19)                  |
| Language         | TypeScript 5, strict mode                            |
| i18n             | next-intl 3.26 (pt-BR default, en, es)               |
| Styling          | Tailwind CSS 4, next-themes, clsx + tailwind-merge   |
| UI Primitives    | Radix UI (dialog, dropdown, tabs, toast, tooltip ...) |
| Icons            | Lucide React                                         |
| Animation        | Framer Motion 12                                     |
| Charts           | Recharts 2.15                                        |
| Code Editor      | Monaco Editor (@monaco-editor/react 4.7)             |
| Forms            | React Hook Form + Zod                                |
| Blockchain       | @solana/web3.js 1.98, @solana/spl-token 0.4          |
| Wallet           | @solana/wallet-adapter-react (Phantom)                |
| On-chain Program | Anchor 0.31 (program ID: ACADBRCB3zGvo1KSCbkztS33...)  |
| Deployment       | Vercel                                               |

---

## 2. Directory Structure

```
app/                             <-- project root (Next.js)
|-- app/
|   |-- layout.tsx               <-- Root layout (pass-through, no HTML)
|   |-- page.tsx                 <-- Root page (Next.js default, not locale-routed)
|   |-- globals.css              <-- Tailwind import + CSS custom properties
|   `-- [locale]/
|       |-- layout.tsx           <-- Locale layout (HTML shell, providers, nav, footer)
|       |-- page.tsx             <-- Landing page (hero, features, courses, CTA)
|       |-- courses/
|       |   |-- page.tsx         <-- Course catalog (search, filter, grid)
|       |   `-- [slug]/
|       |       `-- page.tsx     <-- Course detail (curriculum, sidebar, enrollment)
|       |-- lessons/
|       |   `-- [id]/
|       |       `-- page.tsx     <-- Lesson viewer (content + Monaco editor)
|       |-- challenges/
|       |   `-- [id]/
|       |       `-- page.tsx     <-- Code challenge (split: description | editor + tests)
|       |-- dashboard/
|       |   `-- page.tsx         <-- Learner dashboard (XP chart, progress, achievements)
|       |-- leaderboard/
|       |   `-- page.tsx         <-- XP leaderboard (podium + table)
|       |-- profile/
|       |   `-- [address]/
|       |       `-- page.tsx     <-- Public profile (skills, credentials, courses)
|       |-- certificates/
|       |   `-- [id]/
|       |       `-- page.tsx     <-- Certificate view (NFT credential card)
|       `-- settings/
|           `-- page.tsx         <-- User settings (language, theme, notifications)
|
|-- components/
|   |-- Nav.tsx                  <-- Top navigation (wallet button, locale switcher, theme toggle)
|   |-- Footer.tsx               <-- Site footer (links, social, copyright)
|   |-- WalletProviderWrapper.tsx <-- Solana wallet adapter context providers
|   |-- providers.tsx            <-- Combined provider tree (alternative composition)
|   |-- course-card.tsx          <-- Reusable course card with i18n titles
|   `-- xp-bar.tsx               <-- XP progress bar with level/streak display
|
|-- lib/
|   |-- utils.ts                 <-- cn() utility (clsx + tailwind-merge)
|   |-- solana-program.ts        <-- PDA derivation helpers, RPC connection, program constants
|   |-- gamification.ts          <-- XP leveling math, streak multipliers, achievements
|   `-- mock-data.ts             <-- Course, learner, certificate mock data (typed)
|
|-- i18n/
|   |-- routing.ts               <-- Locale definitions, localized pathnames
|   `-- request.ts               <-- Server-side locale resolution + message loading
|
|-- messages/
|   |-- pt-BR.json               <-- Portuguese (Brazil) -- default
|   |-- en.json                  <-- English
|   `-- es.json                  <-- Spanish
|
|-- middleware.ts                 <-- next-intl middleware (locale detection + redirect)
|-- next.config.ts               <-- Next.js config with next-intl plugin
|-- tsconfig.json                <-- TypeScript config (strict, @/* path alias)
|-- postcss.config.mjs           <-- PostCSS with @tailwindcss/postcss
|-- eslint.config.mjs            <-- ESLint (next core-web-vitals + typescript)
`-- package.json                 <-- Dependencies and scripts
```

---

## 3. Routing Architecture

### App Router + `[locale]` Segment

All user-facing pages live under `app/[locale]/`. The root `app/layout.tsx` is a pass-through that renders `{children}` with no HTML wrapper. The `app/[locale]/layout.tsx` owns the `<html>` and `<body>` tags and wraps content in the provider hierarchy.

### Middleware Flow

```
Incoming request: GET /cursos
         |
         v
+---------------------+
| middleware.ts        |
| createMiddleware()   |
| from next-intl      |
+---------------------+
         |
         | 1. Extracts locale from:
         |    - URL prefix (/pt-BR/...)
         |    - Accept-Language header
         |    - Cookie (NEXT_LOCALE)
         |
         | 2. Redirects bare paths:
         |    /cursos --> /pt-BR/cursos
         |    /courses --> /en/courses
         |
         | 3. Matcher excludes:
         |    api/*, _next/*, _vercel/*, static files (*.*)
         |
         v
+---------------------+
| app/[locale]/...    |
| Server component    |
| renders with locale |
+---------------------+
```

**Matcher pattern:** `['/((?!api|_next|_vercel|.*\\..*).*)']`

### Localized Pathnames

Defined in `i18n/routing.ts`:

| Canonical Path   | pt-BR           | en             | es              |
|------------------|-----------------|----------------|-----------------|
| `/`              | `/`             | `/`            | `/`             |
| `/courses`       | `/cursos`       | `/courses`     | `/cursos`       |
| `/dashboard`     | `/painel`       | `/dashboard`   | `/panel`        |
| `/leaderboard`   | `/classificacao`| `/leaderboard` | `/clasificacion`|

### Route Segments

| Route Pattern                       | Dynamic Params      | Rendering  |
|-------------------------------------|---------------------|------------|
| `[locale]/`                         | `locale`            | Client     |
| `[locale]/courses`                  | `locale`            | Client     |
| `[locale]/courses/[slug]`           | `locale`, `slug`    | Server     |
| `[locale]/lessons/[id]`             | `locale`, `id`      | Client     |
| `[locale]/challenges/[id]`          | `locale`, `id`      | Client     |
| `[locale]/dashboard`                | `locale`            | Client     |
| `[locale]/leaderboard`              | `locale`            | Client     |
| `[locale]/profile/[address]`        | `locale`, `address` | Server     |
| `[locale]/certificates/[id]`        | `locale`, `id`      | Server     |
| `[locale]/settings`                 | `locale`            | Client     |

---

## 4. Component Architecture

### Server vs Client Components

**Server Components** (no `'use client'` directive):
- `app/[locale]/layout.tsx` -- fetches messages, validates locale, renders HTML shell
- `app/[locale]/courses/[slug]/page.tsx` -- course detail with async params
- `app/[locale]/certificates/[id]/page.tsx` -- certificate display
- `app/[locale]/profile/[address]/page.tsx` -- public profile
- `components/Footer.tsx` -- static footer (no interactivity needed)

**Client Components** (`'use client'`):
- `app/[locale]/page.tsx` -- landing page (Framer Motion animations)
- `app/[locale]/courses/page.tsx` -- catalog (search/filter state)
- `app/[locale]/lessons/[id]/page.tsx` -- Monaco editor, tab switching
- `app/[locale]/challenges/[id]/page.tsx` -- Monaco editor, test runner
- `app/[locale]/dashboard/page.tsx` -- wallet connection check, Recharts
- `app/[locale]/leaderboard/page.tsx` -- period toggle state
- `app/[locale]/settings/page.tsx` -- form state, toggles
- `components/Nav.tsx` -- mobile menu, theme toggle, wallet button, locale switcher
- `components/WalletProviderWrapper.tsx` -- Solana wallet adapter context
- `components/xp-bar.tsx` -- animated XP progress bar
- `components/course-card.tsx` -- interactive course card with i18n

### Provider Hierarchy

```
<html lang={locale}>
  <body>
    ThemeProvider (next-themes)              -- class-based dark mode
      NextIntlClientProvider (messages)      -- i18n translations
        WalletProviderWrapper               -- Solana wallet stack
          ConnectionProvider (devnet RPC)
            WalletProvider (PhantomAdapter, autoConnect)
              WalletModalProvider            -- connect/disconnect modal
                <Nav />                      -- sticky top nav
                <main>{children}</main>      -- page content
                <Footer />                   -- site footer
```

The locale layout (`app/[locale]/layout.tsx`) is an async server component that:
1. Validates the locale against the routing config
2. Calls `getMessages()` to load the JSON translation file
3. Renders the full HTML document with providers

---

## 5. Data Flow

### Wallet Connection --> Enrollment --> Lesson Completion --> XP --> Credential

```
[1] WALLET CONNECTION
    User clicks "Conectar Carteira" in Nav
         |
         v
    WalletModalProvider shows Phantom connect dialog
    useWallet() hook exposes: { connected, publicKey, signTransaction }
         |
         v
[2] ENROLLMENT
    User navigates to /courses/[slug] and clicks "Comecar Curso"
         |
         v
    Frontend derives Enrollment PDA:
      seeds = ["enrollment", courseId, userPubkey]
      Program: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
         |
         v
    Sends `enroll` instruction to on-chain program
    (wallet signs transaction)
         |
         v
[3] LESSON COMPLETION
    User reads content, interacts with Monaco editor
    Clicks "Marcar como Completo (+XP)"
         |
         v
    Frontend derives Progress PDA:
      seeds = ["progress", courseId, userPubkey]
         |
         v
    Sends `complete_lesson` instruction
    Backend signer co-signs (anti-cheat)
         |
         v
[4] XP AWARD
    On-chain program mints Token-2022 XP tokens to user ATA
    XP tokens are soulbound:
      - NonTransferable extension (cannot be sent)
      - PermanentDelegate extension (cannot self-burn)
         |
         v
    Frontend reads XP balance from Token-2022 ATA
    Gamification logic (lib/gamification.ts) computes:
      - Level = floor(sqrt(totalXP / 100))
      - Streak multipliers: 7d=1.25x, 30d=1.5x, 100d=2x
      - Achievement unlocks
         |
         v
[5] CREDENTIAL ISSUANCE
    When all lessons in a course are completed:
         |
         v
    `finalize_course` instruction records completion on-chain
         |
         v
    `issue_credential` instruction mints Metaplex Core NFT
    Credential is soulbound:
      - PermanentFreezeDelegate plugin (frozen after mint)
      - Owned by learner wallet, non-transferable
         |
         v
    Certificate page reads NFT metadata
    Displays verifiable credential with Solana Explorer link
```

### Current State

The frontend currently uses **mock data** (`lib/mock-data.ts`) for courses, learners, and certificates. The on-chain integration layer (`lib/solana-program.ts`) provides PDA derivation functions and RPC connection setup. Actual instruction submission is not yet wired up -- the PDA helpers and program ID are in place as the integration surface.

---

## 6. On-Chain Integration

### Program ID

```
ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
```

Note: `lib/solana-program.ts` currently has a placeholder (`ACadEMy111...`). This will be updated to the deployed program ID.

### RPC Endpoint

```typescript
const RPC_ENDPOINT = process.env.NEXT_PUBLIC_RPC_ENDPOINT ?? 'https://api.devnet.solana.com';
```

### PDA Derivation Map

All PDAs derived from `lib/solana-program.ts`:

| PDA              | Seeds                                        | Purpose                          |
|------------------|----------------------------------------------|----------------------------------|
| Config           | `["config"]`                                 | Platform configuration           |
| Course           | `["course", courseId]`                        | Course metadata                  |
| Enrollment       | `["enrollment", courseId, userPubkey]`        | User enrollment in a course      |
| Progress         | `["progress", courseId, userPubkey]`          | Lesson completion tracking       |
| Credential       | `["credential", courseId, userPubkey]`        | Soulbound NFT credential         |
| LearnerProfile   | `["learner", userPubkey]`                     | Learner profile data             |

### Transaction Signing

The wallet adapter provides `signTransaction` and `sendTransaction` via the `useWallet()` hook. All on-chain operations follow:

1. Build transaction with Anchor instruction
2. Add recent blockhash
3. Wallet signs (Phantom popup)
4. Send and confirm via `Connection.sendRawTransaction`

### Token Standards

**XP Tokens (Token-2022):**
- Mint with `NonTransferable` extension -- tokens cannot leave the wallet
- Mint with `PermanentDelegate` extension -- program authority controls burn
- User balance queried via Associated Token Account (ATA)

**Credentials (Metaplex Core):**
- Soulbound NFTs via `PermanentFreezeDelegate` plugin
- Frozen immediately after minting
- Metadata includes course name, completion date, skills
- Visible in wallet UIs that support Metaplex Core

---

## 7. i18n Architecture

### Three-File Setup

```
i18n/
  routing.ts    <-- locale list, default locale, localized pathnames
  request.ts    <-- server-side config: resolves locale, loads messages

messages/
  pt-BR.json    <-- default (Portuguese Brazil)
  en.json       <-- English
  es.json       <-- Spanish

middleware.ts   <-- creates next-intl middleware from routing config
```

### Locale Resolution (request.ts)

```typescript
export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale)) {
    locale = routing.defaultLocale; // 'pt-BR'
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
```

### Message Namespace Structure

Messages are organized by page/feature:

| Namespace     | Used By                  |
|---------------|--------------------------|
| `nav`         | Nav.tsx                  |
| `landing`     | Landing page             |
| `courses`     | Course catalog, card     |
| `dashboard`   | Dashboard page           |
| `lesson`      | Lesson viewer            |
| `challenge`   | Code challenge           |
| `leaderboard` | Leaderboard page         |
| `profile`     | Profile page             |
| `settings`    | Settings page            |
| `certificate` | Certificate page         |
| `common`      | Shared strings           |

### Usage in Components

**Server components:** Messages loaded via `getMessages()` and passed to `NextIntlClientProvider`.

**Client components:** Access translations via `useTranslations('namespace')`:
```typescript
const t = useTranslations('courses');
// t('enroll') --> "Matricular" (pt-BR) / "Enroll" (en)
```

### Locale Switching

The `Nav` component implements client-side locale switching by replacing the first path segment:

```typescript
function switchLocale(newLocale: string) {
  const segments = pathname.split('/');
  segments[1] = newLocale;
  router.push(segments.join('/'));
}
```

### next-intl Plugin Integration

`next.config.ts` wraps the config with `createNextIntlPlugin()`, which:
- Adds the `i18n/request.ts` configuration
- Enables server-side message loading
- Configures Webpack for message file resolution

---

## 8. Styling System

### Tailwind CSS 4

The project uses Tailwind CSS v4 with the new `@tailwindcss/postcss` plugin (not the legacy `tailwindcss` PostCSS plugin).

**globals.css:**
```css
@import "tailwindcss";

:root {
  --background: #ffffff;
  --foreground: #171717;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}
```

Tailwind v4 uses `@theme inline` blocks for design token registration rather than `tailwind.config.js`.

### Dark Theme (Default)

- `next-themes` with `attribute="class"` and `defaultTheme="dark"`
- Body base classes: `bg-gray-950 text-gray-100`
- The entire UI is designed dark-first; light mode support exists via theme toggle but the visual identity is built around dark backgrounds with purple/indigo accent gradients.

### Typography

Two Google Fonts loaded via `next/font/google`:
- **Geist** (sans-serif) -- `--font-geist-sans`
- **Geist Mono** (monospace) -- `--font-geist-mono`

Applied via CSS variable classes on `<html>`.

### cn() Utility

```typescript
// lib/utils.ts
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

Combines `clsx` (conditional class joining) with `tailwind-merge` (deduplication of conflicting Tailwind classes). Used across all components for conditional styling.

Note: Several page-level components define a local `cn` using only `clsx` (without `tailwind-merge`). The canonical `cn` from `@/lib/utils` should be preferred.

### Design Language

| Element             | Pattern                                                       |
|---------------------|---------------------------------------------------------------|
| Cards               | `rounded-2xl border border-gray-800 bg-gray-900/60`          |
| Buttons (primary)   | `bg-gradient-to-r from-purple-600 to-indigo-600 text-white`  |
| Buttons (secondary) | `border border-gray-700 bg-gray-800 text-gray-300`           |
| Badges              | `rounded-full px-2.5 py-0.5 text-xs font-medium`            |
| Hover states        | `hover:border-gray-700 hover:bg-gray-900 transition-all`     |
| Accent gradients    | Purple-to-indigo (primary), various per-track colors          |
| Level badges        | Green (beginner), yellow (intermediate), red (advanced)       |
| XP indicators       | Yellow-400 text with Zap icon                                |

---

## 9. State Management

### No Global Store

The application does not use Redux, Zustand, or any global state library. State is managed through:

### React Hooks (Local State)

Each page manages its own UI state via `useState`:
- **Course catalog:** search query, level filter, track filter, sort order
- **Lesson viewer:** code content, completion status, active tab, language selection
- **Challenge page:** code content, test results, hints revealed, submission state
- **Leaderboard:** time period toggle
- **Settings:** language, theme, notification/privacy toggles

### Wallet Adapter Context

The `@solana/wallet-adapter-react` provides a React context tree:

```
ConnectionProvider         -- Solana RPC Connection
  WalletProvider           -- wallet list, autoConnect, connection state
    WalletModalProvider    -- connect/disconnect UI modal
```

Consumed via hooks:
- `useWallet()` -- `{ connected, publicKey, signTransaction, disconnect }`
- `useConnection()` -- `{ connection }` (Solana web3.js Connection)

The `connected` boolean gates authenticated views (e.g., Dashboard shows a "Connect Wallet" prompt when `!connected`).

### next-intl Context

`NextIntlClientProvider` makes messages and locale available to all client components via:
- `useTranslations(namespace)` -- type-safe translation access
- `useLocale()` -- current locale string

### next-themes Context

`ThemeProvider` exposes:
- `useTheme()` -- `{ theme, setTheme }` for dark/light/system toggle

### Derived State

The gamification module (`lib/gamification.ts`) computes derived values from XP totals:
- `calcLevel(totalXP)` -- `floor(sqrt(totalXP / 100))`
- `xpToNextLevel(totalXP)` -- current progress within level, XP required
- `applyStreakMultiplier(baseXP, streakDays)` -- 1x/1.25x/1.5x/2x multiplier
- `checkAchievements(...)` -- returns array of unlocked achievement IDs
- `getLevelTitle(level)` -- maps level number to rank title string

---

## 10. Security Considerations

### Wallet Signing

- All on-chain transactions require explicit wallet signature via Phantom popup
- `autoConnect` is enabled for convenience but requires prior user approval
- Private keys never leave the wallet extension; the app only receives `publicKey`
- Transaction simulation runs before sending to catch errors early

### Input Validation

- `zod` is available for schema validation (react-hook-form integration)
- Course slugs, lesson IDs, and challenge IDs are validated against known data sets
- Locale parameters are validated against the `routing.locales` array; invalid locales trigger `notFound()`
- Profile addresses are used as-is from URL params (Solana public keys are self-validating Base58)

### Content Security

- Monaco Editor is loaded via `next/dynamic` with `ssr: false` to prevent server-side execution
- Code challenges run simulated tests client-side; no server-side code execution
- External links use `rel="noopener noreferrer"` and `target="_blank"`

### On-Chain Security

- PDA derivation is deterministic and client-verifiable
- Backend signer co-signs lesson completion to prevent XP farming
- XP tokens are soulbound (NonTransferable + PermanentDelegate) -- cannot be traded or burned by user
- Credential NFTs are permanently frozen -- cannot be transferred after minting
- Program authority is managed via multisig (Squads) for mainnet

### CSP and Headers

- Next.js default security headers apply
- Vercel deployment adds standard security headers
- No custom CSP configuration is currently defined -- recommended to add via `next.config.ts` headers for production:
  - `Content-Security-Policy` restricting script sources
  - `X-Frame-Options: DENY`
  - `X-Content-Type-Options: nosniff`

### Environment Variables

- `NEXT_PUBLIC_RPC_ENDPOINT` -- public, used client-side for RPC connection
- No secrets are exposed to the client; backend signer keys are server-only
- Wallet adapter credentials are managed entirely by the browser extension

---

## API Layer

### Route Architecture

The API layer uses Next.js 15 App Router API routes (`app/api/`). All routes return JSON and follow RESTful conventions.

```
app/api/
├── auth/[...nextauth]/route.ts    # NextAuth.js handler
├── complete-lesson/route.ts       # On-chain lesson completion
├── quiz/validate/route.ts         # Server-side quiz answer validation
├── courses/route.ts               # GET: List courses (filters, pagination)
├── courses/[slug]/
│   ├── route.ts                   # GET: Course by slug
│   ├── enroll/route.ts            # POST: Enroll in course
│   ├── progress/route.ts          # GET: Course progress
│   └── reviews/route.ts           # GET/POST: Course reviews
├── leaderboard/route.ts           # GET: Leaderboard (filters)
├── profile/[address]/route.ts     # GET: Public profile
├── achievements/route.ts          # GET: Achievements with unlock status
├── certificates/
│   ├── route.ts                   # GET: List certificates
│   └── [id]/route.ts              # GET: Certificate by ID
├── challenges/
│   ├── route.ts                   # GET: Available challenges
│   └── submit/route.ts            # POST: Submit challenge solution
├── community/threads/
│   ├── route.ts                   # GET/POST: Forum threads
│   └── [id]/route.ts              # GET: Thread with replies
├── analytics/events/route.ts      # POST: Track analytics events
└── health/route.ts                # GET: Health check
```

### Data Flow

1. **Content routes** (`courses`, `leaderboard`, `certificates`) delegate to `lib/content.ts`, which checks Sanity CMS first and falls back to `lib/mock-data.ts`.
2. **Quiz validation** uses server-only answer keys in `lib/quiz-keys.ts` — these are never bundled into the client.
3. **Reviews and threads** use in-memory stores (Map) for demo purposes. In production, these would use a database (Supabase, PlanetScale, etc.).
4. **On-chain routes** (`complete-lesson`, `enroll`) interact with the Solana program via `@coral-xyz/anchor`.

### Quiz Security Model

```
Client                          Server
  │                               │
  ├─ POST /api/quiz/validate ────►│ Validate answer against server-only keys
  │◄──── { correct: true } ──────┤
  │                               │
  ├─ POST /api/complete-lesson ──►│ Only proceeds if quiz was passed
  │◄──── { signature: "..." } ───┤ Calls on-chain completeLesson
```

### Offline Architecture

The `lib/indexed-db.ts` module provides offline support:

1. **Course caching**: Enrolled course content is stored in IndexedDB for offline reading
2. **Completion queue**: Lesson completions are queued locally when offline
3. **Auto-sync**: When the browser comes back online, queued completions are synced to the server
4. **Storage structure**: Two object stores — `courses` (keyed by slug) and `completionQueue` (keyed by unique ID, indexed by sync status)



## PWA & Offline Architecture

### Service Worker (`public/sw.js`)
- **Cache-first** strategy for static assets (JS, CSS, images, fonts)
- **Network-first** strategy for API routes and page navigation
- Cache name versioned for clean updates
- Registered in `app/[locale]/layout.tsx` via `<script>` tag

### Web App Manifest (`public/manifest.json`)
- Standalone display mode for native-like experience
- 192x192 and 512x512 icons
- Theme color `#030712` matching the dark UI
- `start_url: /pt-BR` for Brazilian-first experience

### IndexedDB (`lib/indexed-db.ts`)
- **`courses` store**: Cached course content keyed by slug for offline reading
- **`completionQueue` store**: Pending lesson completions queued while offline, indexed by sync status
- Auto-sync via `navigator.onLine` event listener — completions POST to `/api/complete-lesson` when connectivity returns
- Typed wrappers: `saveOfflineCourse()`, `listOfflineCourses()`, `queueCompletion()`, `getUnsyncedCompletions()`, `syncCompletions()`

### Offline Page (`/[locale]/offline`)
- Client component showing saved courses from IndexedDB
- Pending sync queue with count badge
- Connection status indicator with real-time `online`/`offline` events
