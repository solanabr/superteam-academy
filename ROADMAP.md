# Superteam Academy — Implementation Plan (ROADMAP)

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a production-ready LMS dApp frontend for Solana developer education with 10 core pages, on-chain integration, gamification, CMS, and 8 bonus features.

**Architecture:** Next.js 14+ App Router with service abstraction layer (`lib/solana/`) isolating all on-chain interactions. Sanity CMS for content, Zustand for state, shadcn/ui for components, Unified Wallet Kit for wallets, next-intl for i18n. API routes handle backend-signer operations.

**Tech Stack:** Next.js 14+, TypeScript strict, Tailwind CSS, shadcn/ui, Sanity, Zustand, next-intl, Monaco Editor, Unified Wallet Kit (Jupiter), @coral-xyz/anchor, @solana/spl-token (Token-2022), Helius DAS, Vitest, Playwright, Vercel.

**Design Doc:** [docs/plans/2026-02-24-superteam-academy-design.md](docs/plans/2026-02-24-superteam-academy-design.md)

**Existing Program Docs:**
- `onchain-academy/` — Anchor program (DO NOT modify)
- `docs/SPEC.md` — Program specification (v3.0)
- `docs/ARCHITECTURE.md` — Account maps, CU budgets
- `docs/INTEGRATION.md` — Frontend integration guide (TypeScript examples, PDA helpers, bitmap helpers)

---

## Phase 0: Project Scaffold & Infrastructure

**Milestone:** Next.js app boots, all tooling configured, deploys to Vercel.

### Task 0.1: Initialize Next.js App

**Files:**
- Create: `app/package.json`
- Create: `app/tsconfig.json`
- Create: `app/next.config.ts`
- Create: `app/tailwind.config.ts`
- Create: `app/postcss.config.mjs`
- Create: `app/src/app/layout.tsx`
- Create: `app/src/app/page.tsx`
- Create: `app/src/styles/globals.css`

**Step 1: Scaffold Next.js 14+ with App Router**

```bash
cd ~/local-dev/superteam-academy
pnpm create next-app@latest app --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --use-pnpm
```

**Step 2: Verify dev server boots**

```bash
cd app && pnpm dev
```
Expected: App running on localhost:3000

**Step 3: Configure TypeScript strict mode**

In `app/tsconfig.json`, ensure:
```json
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "forceConsistentCasingInFileNames": true
  }
}
```

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: scaffold Next.js 14+ app with TypeScript strict"
```

---

### Task 0.2: Install Core Dependencies

**Files:**
- Modify: `app/package.json`

**Step 1: Install all dependencies**

```bash
cd app

# UI
pnpm add @radix-ui/react-slot class-variance-authority clsx tailwind-merge lucide-react

# Solana
pnpm add @coral-xyz/anchor @solana/web3.js @solana/spl-token @solana/wallet-adapter-base @solana/wallet-adapter-react @unified-wallet-adapter-with-plugin/react

# Metaplex
pnpm add @metaplex-foundation/mpl-core @metaplex-foundation/umi @metaplex-foundation/umi-bundle-defaults @metaplex-foundation/umi-web3js-adapters

# State & Data
pnpm add zustand sanity next-sanity @sanity/image-url

# i18n
pnpm add next-intl

# Theming
pnpm add next-themes

# Charts
pnpm add chart.js react-chartjs-2 recharts

# Editor
pnpm add @monaco-editor/react

# Analytics
pnpm add @vercel/analytics @sentry/nextjs

# Utils
pnpm add date-fns bn.js bs58

# Dev
pnpm add -D @types/bn.js prettier eslint-config-prettier vitest @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom
```

**Step 2: Verify no dependency conflicts**

```bash
pnpm ls --depth 0
```

**Step 3: Commit**

```bash
git add app/package.json app/pnpm-lock.yaml
git commit -m "feat: install core dependencies"
```

---

### Task 0.3: Configure shadcn/ui

**Files:**
- Create: `app/components.json`
- Create: `app/src/lib/utils.ts`
- Modify: `app/src/styles/globals.css`
- Modify: `app/tailwind.config.ts`

**Step 1: Initialize shadcn/ui**

```bash
cd app
pnpm dlx shadcn@latest init
```

Select: New York style, Zinc base color, CSS variables.

**Step 2: Add essential components**

```bash
pnpm dlx shadcn@latest add button card input label tabs badge avatar dropdown-menu dialog sheet separator skeleton tooltip accordion progress scroll-area command popover select switch textarea navigation-menu breadcrumb table sonner
```

**Step 3: Configure CSS variables for Solana theme**

In `app/src/styles/globals.css`, set custom CSS variables:
```css
:root {
  --primary: 262 83% 58%;          /* Solana purple */
  --accent: 142 76% 36%;           /* Solana green */
}
.dark {
  --primary: 262 83% 68%;
  --accent: 142 76% 46%;
}
```

**Step 4: Commit**

```bash
git add app/
git commit -m "feat: configure shadcn/ui with Solana theme"
```

---

### Task 0.4: Configure next-intl

**Files:**
- Create: `app/src/i18n/request.ts`
- Create: `app/src/i18n/routing.ts`
- Create: `app/src/middleware.ts`
- Create: `app/src/messages/en.json`
- Create: `app/src/messages/pt.json`
- Create: `app/src/messages/es.json`
- Modify: `app/src/app/layout.tsx` → move to `app/src/app/[locale]/layout.tsx`

**Step 1: Set up next-intl routing**

Create `app/src/i18n/routing.ts`:
```typescript
import { defineRouting } from 'next-intl/routing';

export const routing = defineRouting({
  locales: ['en', 'pt', 'es'],
  defaultLocale: 'en',
});
```

Create `app/src/i18n/request.ts`:
```typescript
import { getRequestConfig } from 'next-intl/server';
import { routing } from './routing';

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale;
  if (!locale || !routing.locales.includes(locale as any)) {
    locale = routing.defaultLocale;
  }
  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default,
  };
});
```

**Step 2: Create middleware**

Create `app/src/middleware.ts`:
```typescript
import createMiddleware from 'next-intl/middleware';
import { routing } from './i18n/routing';

export default createMiddleware(routing);

export const config = {
  matcher: ['/', '/(pt|es|en)/:path*'],
};
```

**Step 3: Create initial translation files**

`app/src/messages/en.json`:
```json
{
  "common": {
    "connect_wallet": "Connect Wallet",
    "loading": "Loading...",
    "error": "Something went wrong",
    "back": "Back",
    "next": "Next",
    "save": "Save",
    "cancel": "Cancel",
    "search": "Search...",
    "view_all": "View All"
  },
  "nav": {
    "courses": "Courses",
    "dashboard": "Dashboard",
    "leaderboard": "Leaderboard",
    "community": "Community",
    "settings": "Settings"
  }
}
```

Create `pt.json` and `es.json` with translated equivalents.

**Step 4: Restructure to [locale] layout**

Move `app/src/app/layout.tsx` → `app/src/app/[locale]/layout.tsx`. Add `NextIntlClientProvider`.

**Step 5: Verify locale routing works**

```bash
pnpm dev
# Visit /en, /pt, /es — all should render
```

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: configure next-intl with en/pt/es locales"
```

---

### Task 0.5: Configure next-themes (Light/Dark)

**Files:**
- Create: `app/src/components/providers/theme-provider.tsx`
- Modify: `app/src/app/[locale]/layout.tsx`

**Step 1: Create theme provider**

```typescript
'use client';
import { ThemeProvider as NextThemesProvider } from 'next-themes';

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return (
    <NextThemesProvider attribute="class" defaultTheme="light" enableSystem disableTransitionOnChange>
      {children}
    </NextThemesProvider>
  );
}
```

**Step 2: Wrap layout with ThemeProvider**

**Step 3: Add theme toggle component**

```bash
pnpm dlx shadcn@latest add dropdown-menu
```

Create `app/src/components/ui/theme-toggle.tsx`.

**Step 4: Verify light/dark toggle works**

**Step 5: Commit**

```bash
git add app/
git commit -m "feat: configure light/dark theme with next-themes"
```

---

### Task 0.6: Configure Wallet Adapter (Unified Wallet Kit)

**Files:**
- Create: `app/src/components/providers/wallet-provider.tsx`
- Create: `app/src/lib/solana/constants.ts`
- Modify: `app/src/app/[locale]/layout.tsx`

**Step 1: Create Solana constants**

```typescript
// app/src/lib/solana/constants.ts
import { PublicKey } from '@solana/web3.js';

export const PROGRAM_ID = new PublicKey(process.env.NEXT_PUBLIC_PROGRAM_ID!);
export const XP_MINT = new PublicKey(process.env.NEXT_PUBLIC_XP_MINT!);
export const CLUSTER = process.env.NEXT_PUBLIC_CLUSTER || 'devnet';
export const HELIUS_RPC = process.env.NEXT_PUBLIC_HELIUS_RPC_URL!;
export const TOKEN_2022_PROGRAM_ID = new PublicKey('TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb');
```

**Step 2: Create wallet provider with Unified Wallet Kit**

```typescript
'use client';
import { UnifiedWalletProvider } from '@jup-ag/wallet-adapter';
import { CLUSTER, HELIUS_RPC } from '@/lib/solana/constants';

export function WalletProvider({ children }: { children: React.ReactNode }) {
  return (
    <UnifiedWalletProvider
      wallets={[]}
      config={{
        autoConnect: true,
        env: CLUSTER as 'devnet',
        metadata: {
          name: 'Superteam Academy',
          description: 'Learn Solana Development',
          url: 'https://superteam-academy.vercel.app',
          iconUrls: ['/logo.png'],
        },
        theme: 'light',
      }}
    >
      {children}
    </UnifiedWalletProvider>
  );
}
```

**Step 3: Create .env.example**

```env
NEXT_PUBLIC_PROGRAM_ID=ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
NEXT_PUBLIC_XP_MINT=xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
NEXT_PUBLIC_CLUSTER=devnet
NEXT_PUBLIC_HELIUS_RPC_URL=
NEXT_PUBLIC_SANITY_PROJECT_ID=
NEXT_PUBLIC_SANITY_DATASET=production
BACKEND_SIGNER_KEYPAIR=
NEXT_PUBLIC_GA_MEASUREMENT_ID=
SENTRY_DSN=
```

**Step 4: Wire providers in layout** (ThemeProvider → WalletProvider → NextIntlClientProvider)

**Step 5: Verify wallet connect modal opens**

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: configure Unified Wallet Kit with devnet"
```

---

### Task 0.7: Configure Sanity CMS

**Files:**
- Create: `app/sanity/sanity.config.ts`
- Create: `app/sanity/sanity.cli.ts`
- Create: `app/sanity/schemas/index.ts`
- Create: `app/src/lib/sanity/client.ts`
- Create: `app/src/lib/sanity/queries.ts`
- Create: `app/src/app/[locale]/studio/[[...tool]]/page.tsx`

**Step 1: Initialize Sanity project**

```bash
cd app
pnpm add sanity @sanity/vision @sanity/icons
pnpm dlx sanity@latest init --env .env.local
```

**Step 2: Create content schemas** (course, module, lesson, testCase, track, achievement, dailyChallenge — per design doc Section 7)

**Step 3: Create Sanity client**

```typescript
// app/src/lib/sanity/client.ts
import { createClient } from 'next-sanity';

export const client = createClient({
  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!,
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET!,
  apiVersion: '2026-02-24',
  useCdn: true,
});
```

**Step 4: Embed Sanity Studio at /studio route**

**Step 5: Verify studio loads and schemas appear**

**Step 6: Commit**

```bash
git add app/
git commit -m "feat: configure Sanity CMS with content schemas"
```

---

### Task 0.8: Configure Vercel Analytics + Sentry

**Files:**
- Create: `app/sentry.client.config.ts`
- Create: `app/sentry.server.config.ts`
- Create: `app/src/lib/analytics.ts`
- Modify: `app/src/app/[locale]/layout.tsx`

**Step 1: Add Vercel Analytics**

```typescript
import { Analytics } from '@vercel/analytics/react';
// Add <Analytics /> to root layout
```

**Step 2: Configure Sentry**

```bash
pnpm dlx @sentry/wizard@latest -i nextjs
```

**Step 3: Create analytics helper for custom events**

```typescript
// app/src/lib/analytics.ts
export function trackEvent(name: string, properties?: Record<string, unknown>) {
  if (typeof window !== 'undefined' && window.gtag) {
    window.gtag('event', name, properties);
  }
}
```

**Step 4: Add GA4 script to layout (via next/script)**

**Step 5: Commit**

```bash
git add app/
git commit -m "feat: configure Vercel Analytics, GA4, and Sentry"
```

---

### Task 0.9: Set Up Vitest

**Files:**
- Create: `app/vitest.config.ts`
- Create: `app/src/__tests__/setup.ts`

**Step 1: Configure Vitest**

```typescript
// app/vitest.config.ts
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/__tests__/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
  resolve: {
    alias: { '@': path.resolve(__dirname, './src') },
  },
});
```

**Step 2: Add test scripts to package.json**

```json
{
  "scripts": {
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage"
  }
}
```

**Step 3: Write a smoke test**

```typescript
// app/src/__tests__/smoke.test.ts
import { describe, it, expect } from 'vitest';

describe('smoke', () => {
  it('should pass', () => {
    expect(true).toBe(true);
  });
});
```

**Step 4: Run tests**

```bash
cd app && pnpm test:run
```
Expected: 1 test passed

**Step 5: Commit**

```bash
git add app/
git commit -m "feat: configure Vitest with jsdom environment"
```

---

### Task 0.10: Deploy to Vercel

**Step 1: Deploy**

```bash
cd app && pnpm dlx vercel --yes
```

**Step 2: Set environment variables on Vercel**

```bash
vercel env add NEXT_PUBLIC_PROGRAM_ID
vercel env add NEXT_PUBLIC_XP_MINT
# ... etc
```

**Step 3: Verify deployment URL loads**

**Step 4: Commit any Vercel config**

```bash
git add app/
git commit -m "chore: configure Vercel deployment"
```

---

## Phase 1: Solana Service Layer

**Milestone:** All on-chain read/write operations abstracted into clean services with tests.

### Task 1.1: PDA Derivation Helpers

**Files:**
- Create: `app/src/lib/solana/pda.ts`
- Create: `app/src/lib/solana/__tests__/pda.test.ts`

**Step 1: Write failing tests for all 6 PDA derivations**

```typescript
import { describe, it, expect } from 'vitest';
import { PublicKey } from '@solana/web3.js';
import { configPda, coursePda, enrollmentPda, minterRolePda, achievementTypePda, achievementReceiptPda } from '../pda';

describe('PDA derivations', () => {
  const programId = new PublicKey('ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf');

  it('derives config PDA deterministically', () => {
    const [pda, bump] = configPda(programId);
    expect(pda).toBeInstanceOf(PublicKey);
    expect(bump).toBeGreaterThanOrEqual(0);
    // Same inputs = same output
    const [pda2] = configPda(programId);
    expect(pda.equals(pda2)).toBe(true);
  });

  it('derives course PDA from courseId', () => {
    const [pda1] = coursePda('solana-core-101', programId);
    const [pda2] = coursePda('defi-basics', programId);
    expect(pda1.equals(pda2)).toBe(false);
  });

  it('derives enrollment PDA from courseId + learner', () => {
    const learner = PublicKey.unique();
    const [pda] = enrollmentPda('solana-core-101', learner, programId);
    expect(pda).toBeInstanceOf(PublicKey);
  });

  it('derives minter role PDA from minter pubkey', () => {
    const minter = PublicKey.unique();
    const [pda] = minterRolePda(minter, programId);
    expect(pda).toBeInstanceOf(PublicKey);
  });

  it('derives achievement type PDA from achievementId', () => {
    const [pda] = achievementTypePda('first-course', programId);
    expect(pda).toBeInstanceOf(PublicKey);
  });

  it('derives achievement receipt PDA from achievementId + recipient', () => {
    const recipient = PublicKey.unique();
    const [pda] = achievementReceiptPda('first-course', recipient, programId);
    expect(pda).toBeInstanceOf(PublicKey);
  });
});
```

**Step 2: Run test, verify fails**

```bash
cd app && pnpm test:run src/lib/solana/__tests__/pda.test.ts
```

**Step 3: Implement PDA helpers**

```typescript
// app/src/lib/solana/pda.ts
import { PublicKey } from '@solana/web3.js';
import { PROGRAM_ID } from './constants';

export function configPda(programId = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('config')], programId);
}

export function coursePda(courseId: string, programId = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('course'), Buffer.from(courseId)], programId);
}

export function enrollmentPda(courseId: string, learner: PublicKey, programId = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('enrollment'), Buffer.from(courseId), learner.toBuffer()],
    programId,
  );
}

export function minterRolePda(minter: PublicKey, programId = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('minter'), minter.toBuffer()], programId);
}

export function achievementTypePda(achievementId: string, programId = PROGRAM_ID): [PublicKey, number] {
  return PublicKey.findProgramAddressSync([Buffer.from('achievement'), Buffer.from(achievementId)], programId);
}

export function achievementReceiptPda(
  achievementId: string,
  recipient: PublicKey,
  programId = PROGRAM_ID,
): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('achievement_receipt'), Buffer.from(achievementId), recipient.toBuffer()],
    programId,
  );
}
```

**Step 4: Run tests, verify passes**

**Step 5: Commit**

```bash
git add app/src/lib/solana/pda.ts app/src/lib/solana/__tests__/pda.test.ts
git commit -m "feat: implement PDA derivation helpers with tests"
```

---

### Task 1.2: Bitmap Helpers

**Files:**
- Create: `app/src/lib/solana/bitmap.ts`
- Create: `app/src/lib/solana/__tests__/bitmap.test.ts`

**Step 1: Write failing tests**

Test cases: `isLessonComplete` for index 0, 63, 64, 127, 255. `countCompletedLessons` for empty, partial, full. `getProgressPercentage`. Reference `docs/INTEGRATION.md` for bitmap format — `[u64; 4]` represented as `BN[]` in TypeScript.

**Step 2: Run test, verify fails**

**Step 3: Implement bitmap helpers**

Follow exact patterns from `docs/INTEGRATION.md` — `isLessonComplete`, `countCompletedLessons`, `getProgressPercentage`, `renderBitmap`.

**Step 4: Run tests, verify passes**

**Step 5: Commit**

```bash
git add app/src/lib/solana/bitmap.ts app/src/lib/solana/__tests__/bitmap.test.ts
git commit -m "feat: implement lesson bitmap helpers with tests"
```

---

### Task 1.3: XP & Level Helpers

**Files:**
- Create: `app/src/lib/solana/xp.ts`
- Create: `app/src/lib/solana/__tests__/xp.test.ts`

**Step 1: Write failing tests**

Test: `calculateLevel(0)` = 0, `calculateLevel(100)` = 1, `calculateLevel(400)` = 2, `calculateLevel(10000)` = 10. Test: `xpToNextLevel`, `xpProgressPercent`. Test: `getXpBalance` with mocked connection.

**Step 2: Run test, verify fails**

**Step 3: Implement**

```typescript
export function calculateLevel(xp: number): number {
  return Math.floor(Math.sqrt(xp / 100));
}

export function xpForLevel(level: number): number {
  return level * level * 100;
}

export function xpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
}

export function xpProgressPercent(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = xpForLevel(currentLevel);
  const nextLevelXp = xpForLevel(currentLevel + 1);
  return ((currentXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;
}
```

`getXpBalance`: read Token-2022 ATA using `getAssociatedTokenAddressSync` with `TOKEN_2022_PROGRAM_ID`.

**Step 4: Run tests, verify passes**

**Step 5: Commit**

```bash
git add app/src/lib/solana/xp.ts app/src/lib/solana/__tests__/xp.test.ts
git commit -m "feat: implement XP and level calculation helpers with tests"
```

---

### Task 1.4: Anchor Program Instance + Account Readers

**Files:**
- Create: `app/src/lib/solana/program.ts`
- Create: `app/src/lib/solana/accounts.ts`
- Create: `app/src/lib/solana/__tests__/accounts.test.ts`

**Step 1: Create program instance factory**

Uses IDL from `onchain-academy/target/idl/onchain_academy.json`. Copy IDL to `app/src/lib/solana/idl/`.

**Step 2: Create account reader functions**

```typescript
export async function fetchConfig(connection: Connection): Promise<Config>
export async function fetchCourse(connection: Connection, courseId: string): Promise<Course>
export async function fetchEnrollment(connection: Connection, courseId: string, learner: PublicKey): Promise<Enrollment | null>
export async function fetchAllCourses(connection: Connection): Promise<Course[]>
export async function fetchUserEnrollments(connection: Connection, learner: PublicKey): Promise<Enrollment[]>
```

**Step 3: Write tests with mocked connection (or integration tests for devnet reads)**

**Step 4: Commit**

```bash
git add app/src/lib/solana/
git commit -m "feat: implement Anchor program instance and account readers"
```

---

### Task 1.5: Enrollment Service (Client-Side Transactions)

**Files:**
- Create: `app/src/lib/solana/enrollment.ts`
- Create: `app/src/lib/solana/__tests__/enrollment.test.ts`

**Step 1: Implement `enroll` and `closeEnrollment`**

Both are learner-signed (wallet adapter). `enroll` handles optional prerequisite via remaining_accounts. Reference `docs/INTEGRATION.md` for exact account layout.

**Step 2: Write tests (transaction building, not signing)**

**Step 3: Commit**

```bash
git add app/src/lib/solana/enrollment.ts app/src/lib/solana/__tests__/enrollment.test.ts
git commit -m "feat: implement enrollment service (enroll + close)"
```

---

### Task 1.6: Credential Service (Helius DAS)

**Files:**
- Create: `app/src/lib/solana/credentials.ts`
- Create: `app/src/lib/solana/__tests__/credentials.test.ts`

**Step 1: Implement Helius DAS queries**

```typescript
export async function getCredentialsByOwner(owner: PublicKey): Promise<Credential[]>
export async function getCredentialById(assetId: string): Promise<Credential>
export async function verifyCredential(assetId: string): Promise<VerificationResult>
```

Uses Helius DAS `getAssetsByOwner`, `getAsset`. Filter by `updateAuthority === configPda`.

**Step 2: Write tests with mocked DAS responses**

**Step 3: Commit**

```bash
git add app/src/lib/solana/credentials.ts app/src/lib/solana/__tests__/credentials.test.ts
git commit -m "feat: implement credential service with Helius DAS"
```

---

### Task 1.7: Achievement Service

**Files:**
- Create: `app/src/lib/solana/achievements.ts`
- Create: `app/src/lib/solana/__tests__/achievements.test.ts`

**Step 1: Implement achievement queries**

```typescript
export async function getAchievementTypes(connection: Connection): Promise<AchievementType[]>
export async function getAchievementsByOwner(connection: Connection, owner: PublicKey): Promise<AchievementReceipt[]>
export async function hasAchievement(connection: Connection, achievementId: string, owner: PublicKey): Promise<boolean>
```

**Step 2: Tests + Commit**

---

### Task 1.8: API Routes (Backend Signer Operations)

**Files:**
- Create: `app/src/app/api/lessons/complete/route.ts`
- Create: `app/src/app/api/courses/finalize/route.ts`
- Create: `app/src/app/api/credentials/issue/route.ts`
- Create: `app/src/app/api/credentials/upgrade/route.ts`
- Create: `app/src/app/api/achievements/award/route.ts`
- Create: `app/src/app/api/leaderboard/route.ts`
- Create: `app/src/lib/solana/server/signer.ts`

**Step 1: Create backend signer loader**

```typescript
// app/src/lib/solana/server/signer.ts
import { Keypair } from '@solana/web3.js';
import fs from 'fs';

export function loadBackendSigner(): Keypair {
  const keypairPath = process.env.BACKEND_SIGNER_KEYPAIR!;
  const secretKey = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'));
  return Keypair.fromSecretKey(Uint8Array.from(secretKey));
}
```

**Step 2: Implement each API route**

Each route:
1. Validates request body
2. Verifies wallet signature (anti-spoof)
3. Checks on-chain state (enrollment exists, lesson not already done)
4. Builds + signs transaction with backend signer
5. Sends and confirms
6. Returns tx signature

**Step 3: Add rate limiting middleware**

```typescript
// Simple in-memory rate limiter (upgrade to Redis for production)
const rateLimit = new Map<string, { count: number; resetAt: number }>();
```

**Step 4: Commit**

```bash
git add app/src/app/api/ app/src/lib/solana/server/
git commit -m "feat: implement backend signer API routes with rate limiting"
```

---

## Phase 2: Zustand Stores & React Hooks

**Milestone:** All client state management and data-fetching hooks ready.

### Task 2.1: User Store

**Files:**
- Create: `app/src/lib/stores/user-store.ts`
- Create: `app/src/lib/stores/__tests__/user-store.test.ts`

```typescript
interface UserState {
  wallet: PublicKey | null;
  xpBalance: number;
  level: number;
  streak: StreakState;
  enrollments: Map<string, EnrollmentData>;
  credentials: Credential[];
  achievements: string[];
  isLoading: boolean;
  // Actions
  fetchUserData: (wallet: PublicKey) => Promise<void>;
  updateStreak: () => void;
  reset: () => void;
}
```

**Test + implement + commit.**

---

### Task 2.2: Course Store

**Files:**
- Create: `app/src/lib/stores/course-store.ts`

```typescript
interface CourseState {
  courses: CourseWithMeta[];
  filters: CourseFilters;
  searchQuery: string;
  filteredCourses: CourseWithMeta[];
  // Actions
  fetchCourses: () => Promise<void>;
  setFilters: (filters: Partial<CourseFilters>) => void;
  setSearchQuery: (query: string) => void;
}
```

---

### Task 2.3: Custom Hooks

**Files:**
- Create: `app/src/lib/hooks/use-xp.ts`
- Create: `app/src/lib/hooks/use-enrollment.ts`
- Create: `app/src/lib/hooks/use-credentials.ts`
- Create: `app/src/lib/hooks/use-leaderboard.ts`
- Create: `app/src/lib/hooks/use-achievements.ts`
- Create: `app/src/lib/hooks/use-streak.ts`
- Create: `app/src/lib/hooks/use-course.ts`

Each hook wraps store access + handles loading/error states. Example:

```typescript
export function useXp() {
  const { xpBalance, level } = useUserStore();
  const progress = xpProgressPercent(xpBalance);
  const toNext = xpToNextLevel(xpBalance);
  return { xp: xpBalance, level, progress, toNext };
}
```

**Test all hooks + commit per hook or batch.**

---

## Phase 3: Layout & Navigation Components

**Milestone:** App shell with header, footer, sidebar, responsive nav, theme toggle, wallet connect, language switcher.

### Task 3.1: Header Component

**Files:**
- Create: `app/src/components/layout/header.tsx`
- Create: `app/src/components/layout/mobile-nav.tsx`

Desktop: Logo | Courses | Leaderboard | Community | [Theme Toggle] [Language] [Connect Wallet]
Mobile: Logo | Hamburger → Sheet with nav links + wallet + theme + language

### Task 3.2: Footer Component

**Files:**
- Create: `app/src/components/layout/footer.tsx`

Links, social icons, language switcher, theme toggle, copyright.

### Task 3.3: Platform Sidebar (for authenticated routes)

**Files:**
- Create: `app/src/components/layout/sidebar.tsx`

Dashboard, My Courses, Leaderboard, Profile, Achievements, Settings. XP bar + level badge at bottom.

### Task 3.4: Route Group Layouts

**Files:**
- Create: `app/src/app/[locale]/(marketing)/layout.tsx` — Header + Footer (no sidebar)
- Create: `app/src/app/[locale]/(platform)/layout.tsx` — Header + Sidebar + Footer (auth required)
- Create: `app/src/app/[locale]/(admin)/layout.tsx` — Admin header + sidebar

**Commit each component.**

---

## Phase 4: Core Pages (10)

**Milestone:** All 10 core pages implemented with real data.

### Task 4.1: Landing Page

**Files:**
- Create: `app/src/app/[locale]/(marketing)/page.tsx`
- Create: `app/src/components/landing/hero-section.tsx`
- Create: `app/src/components/landing/featured-courses.tsx`
- Create: `app/src/components/landing/how-it-works.tsx`
- Create: `app/src/components/landing/tracks-overview.tsx`
- Create: `app/src/components/landing/gamification-preview.tsx`
- Create: `app/src/components/landing/social-proof.tsx`
- Create: `app/src/components/landing/cta-banner.tsx`

Each component per design doc Section 4.1. Featured courses from Sanity (ISR). Stats from on-chain (cached). Fully responsive. All text via next-intl.

---

### Task 4.2: Course Catalog

**Files:**
- Create: `app/src/app/[locale]/(platform)/courses/page.tsx`
- Create: `app/src/components/courses/search-bar.tsx`
- Create: `app/src/components/courses/filter-sidebar.tsx`
- Create: `app/src/components/courses/course-grid.tsx`
- Create: `app/src/components/courses/course-card.tsx`
- Create: `app/src/components/courses/difficulty-badge.tsx`
- Create: `app/src/components/courses/track-badge.tsx`

Per design doc Section 4.2. Cmd+K search shortcut. Client-side filtering. Progress bar for enrolled courses.

---

### Task 4.3: Course Detail

**Files:**
- Create: `app/src/app/[locale]/(platform)/courses/[courseId]/page.tsx`
- Create: `app/src/components/courses/course-header.tsx`
- Create: `app/src/components/courses/enroll-button.tsx`
- Create: `app/src/components/courses/curriculum-list.tsx`
- Create: `app/src/components/courses/module-accordion.tsx`
- Create: `app/src/components/courses/lesson-row.tsx`
- Create: `app/src/components/courses/prerequisite-card.tsx`
- Create: `app/src/components/courses/credential-preview.tsx`

Tabbed: Overview | Curriculum | Reviews. Enrollment triggers `enroll` instruction.

---

### Task 4.4: Lesson View

**Files:**
- Create: `app/src/app/[locale]/(platform)/courses/[courseId]/lessons/[lessonIndex]/page.tsx`
- Create: `app/src/components/lessons/lesson-sidebar.tsx`
- Create: `app/src/components/lessons/lesson-content.tsx`
- Create: `app/src/components/lessons/lesson-complete-button.tsx`
- Create: `app/src/components/editor/monaco-editor-wrapper.tsx`
- Create: `app/src/components/editor/code-runner.tsx`
- Create: `app/src/components/editor/output-panel.tsx`
- Create: `app/src/components/gamification/xp-toast.tsx`
- Create: `app/src/components/gamification/confetti-animation.tsx`

Split layout per design. Monaco lazy-loaded. Auto-save localStorage. Lesson completion flow through API route.

---

### Task 4.5: Code Challenge

**Files:**
- Create: `app/src/app/[locale]/(platform)/courses/[courseId]/challenge/page.tsx`
- Create: `app/src/components/challenges/challenge-instructions.tsx`
- Create: `app/src/components/challenges/hint-accordion.tsx`
- Create: `app/src/components/challenges/test-results-panel.tsx`
- Create: `app/src/components/challenges/test-case-row.tsx`
- Create: `app/src/components/editor/monaco-editor-tabs.tsx`

Test cases from Sanity. Web Worker execution. Visual results.

---

### Task 4.6: User Dashboard

**Files:**
- Create: `app/src/app/[locale]/(platform)/dashboard/page.tsx`
- Create: `app/src/components/dashboard/welcome-banner.tsx`
- Create: `app/src/components/gamification/xp-progress-bar.tsx`
- Create: `app/src/components/gamification/level-badge.tsx`
- Create: `app/src/components/gamification/streak-counter.tsx`
- Create: `app/src/components/dashboard/quick-stats.tsx`
- Create: `app/src/components/dashboard/activity-heatmap.tsx`
- Create: `app/src/components/dashboard/continue-learning.tsx`
- Create: `app/src/components/dashboard/recent-achievements.tsx`
- Create: `app/src/components/credentials/credential-gallery.tsx`
- Create: `app/src/components/dashboard/recommended-courses.tsx`

All data from on-chain reads + stores.

---

### Task 4.7: User Profile

**Files:**
- Create: `app/src/app/[locale]/(platform)/profile/[wallet]/page.tsx`
- Create: `app/src/components/profile/profile-header.tsx`
- Create: `app/src/components/profile/skill-radar.tsx`
- Create: `app/src/components/profile/stats-summary.tsx`
- Create: `app/src/components/profile/achievement-grid.tsx`
- Create: `app/src/components/profile/achievement-badge.tsx`
- Create: `app/src/components/profile/completed-courses-list.tsx`

Skill radar: Chart.js radar chart with track axes.

---

### Task 4.8: Leaderboard

**Files:**
- Create: `app/src/app/[locale]/(platform)/leaderboard/page.tsx`
- Create: `app/src/components/leaderboard/time-filter.tsx`
- Create: `app/src/components/leaderboard/podium-top3.tsx`
- Create: `app/src/components/leaderboard/leaderboard-table.tsx`
- Create: `app/src/components/leaderboard/leaderboard-row.tsx`
- Create: `app/src/components/leaderboard/your-rank-sticky.tsx`

All-time from Helius DAS. Weekly/monthly from Supabase or stubbed.

---

### Task 4.9: Settings

**Files:**
- Create: `app/src/app/[locale]/(platform)/settings/page.tsx`
- Create: `app/src/components/settings/settings-nav.tsx`
- Create: `app/src/components/settings/profile-form.tsx`
- Create: `app/src/components/settings/appearance-settings.tsx`
- Create: `app/src/components/settings/language-selector.tsx`
- Create: `app/src/components/settings/notification-preferences.tsx`
- Create: `app/src/components/settings/wallet-settings.tsx`
- Create: `app/src/components/settings/privacy-settings.tsx`

---

### Task 4.10: Credential Viewer

**Files:**
- Create: `app/src/app/[locale]/(platform)/credentials/[assetId]/page.tsx`
- Create: `app/src/components/credentials/certificate-display.tsx`
- Create: `app/src/components/credentials/on-chain-verification.tsx`
- Create: `app/src/components/credentials/attributes-list.tsx`
- Create: `app/src/components/credentials/share-buttons.tsx`
- Create: `app/src/app/[locale]/(platform)/credentials/[assetId]/opengraph-image.tsx`

OG image via Next.js Image Response API. Share to Twitter.

---

## Phase 5: Bonus Features (8)

**Milestone:** All bonus features implemented.

### Task 5.1: Admin Dashboard

**Files:**
- Create: `app/src/app/[locale]/(admin)/admin/page.tsx`
- Create: `app/src/app/[locale]/(admin)/admin/courses/page.tsx`
- Create: `app/src/app/[locale]/(admin)/admin/users/page.tsx`
- Create: `app/src/app/[locale]/(admin)/admin/achievements/page.tsx`
- Create: `app/src/app/[locale]/(admin)/admin/analytics/page.tsx`
- Create: `app/src/app/[locale]/(admin)/admin/config/page.tsx`
- Create: `app/src/components/admin/stats-cards.tsx`
- Create: `app/src/components/admin/enrollment-chart.tsx`
- Create: `app/src/components/admin/activity-feed.tsx`
- Create: `app/src/components/admin/course-table.tsx`
- Create: `app/src/components/admin/user-table.tsx`
- Create: `app/src/components/admin/analytics-charts.tsx`

Access control: check `config.authority` against connected wallet. Recharts for analytics.

---

### Task 5.2: E2E Tests (Playwright)

**Files:**
- Create: `app/e2e/fixtures/wallet.ts`
- Create: `app/e2e/fixtures/test-data.ts`
- Create: `app/e2e/pages/*.page.ts` (Page Object Model for each page)
- Create: `app/e2e/tests/*.spec.ts` (13 test suites per design doc)
- Create: `app/playwright.config.ts`

Install: `pnpm add -D @playwright/test`

Test suites: navigation, course-catalog, course-enrollment, lesson-view, code-challenge, dashboard, leaderboard, credentials, i18n, theme, responsive, accessibility, performance.

---

### Task 5.3: Community/Forum

**Files:**
- Create: `app/src/app/[locale]/(platform)/community/page.tsx`
- Create: `app/src/app/[locale]/(platform)/community/[threadId]/page.tsx`
- Create: `app/src/components/community/thread-list.tsx`
- Create: `app/src/components/community/thread-card.tsx`
- Create: `app/src/components/community/thread-detail.tsx`
- Create: `app/src/components/community/reply-form.tsx`
- Create: `app/src/components/community/vote-buttons.tsx`
- Create: `app/src/components/community/new-thread-dialog.tsx`
- Create: `app/src/lib/supabase/client.ts`
- Create: `app/src/lib/supabase/forum.ts`

Supabase tables: threads, replies, votes. Real-time subscriptions for live replies.

---

### Task 5.4: Onboarding Quiz

**Files:**
- Create: `app/src/app/[locale]/onboarding/page.tsx`
- Create: `app/src/components/onboarding/quiz-step.tsx`
- Create: `app/src/components/onboarding/experience-step.tsx`
- Create: `app/src/components/onboarding/programming-step.tsx`
- Create: `app/src/components/onboarding/interests-step.tsx`
- Create: `app/src/components/onboarding/goals-step.tsx`
- Create: `app/src/components/onboarding/results-step.tsx`
- Create: `app/src/lib/utils/recommendation.ts`

4-step wizard. Recommendation algorithm in `recommendation.ts`.

---

### Task 5.5: PWA Support

**Files:**
- Create: `app/public/manifest.json`
- Create: `app/public/icons/icon-192.png`
- Create: `app/public/icons/icon-512.png`
- Create: `app/src/components/ui/offline-indicator.tsx`
- Modify: `app/next.config.ts` (add next-pwa)

Install: `pnpm add next-pwa`

Service worker config: cache static assets + viewed lessons. Network-first for on-chain data.

---

### Task 5.6: Daily Challenges

**Files:**
- Create: `app/src/app/[locale]/(platform)/challenges/page.tsx`
- Create: `app/src/components/challenges/daily-challenge-card.tsx`
- Create: `app/src/components/challenges/challenge-timer.tsx`
- Create: `app/src/components/challenges/past-challenges.tsx`
- Create: `app/src/components/challenges/speed-leaderboard.tsx`

Daily challenge from Sanity (scheduled by date). Same code challenge interface. One attempt/day/wallet.

---

### Task 5.7: Course Creator Dashboard

**Files:**
- Create: `app/src/app/[locale]/(platform)/creator/page.tsx`
- Create: `app/src/components/creator/my-courses.tsx`
- Create: `app/src/components/creator/course-analytics.tsx`
- Create: `app/src/components/creator/creator-rewards.tsx`
- Create: `app/src/components/creator/drafts.tsx`

Access: wallet matches `course.creator` for any course.

---

### Task 5.8: Deep Devnet Integration

**Files:**
- Create: `app/src/lib/solana/events.ts`
- Create: `app/src/lib/hooks/use-program-events.ts`
- Create: `app/src/components/devnet/transaction-history.tsx`
- Create: `app/src/components/devnet/account-explorer.tsx`

Real-time event subscriptions via `connection.onLogs`. Transaction timeline. Account explorer with Explorer links.

---

## Phase 6: CMS Content & Sample Data

**Milestone:** Sanity populated with sample course, all content rendering correctly.

### Task 6.1: Import Sample Course

Create sample course in Sanity Studio with:
- 1 full course (5 lessons across 2 modules + 1 challenge)
- Content in all 3 languages (en, pt, es)
- Code editor exercises in 2+ lessons
- Achievement types (5+ defined)
- 1 track defined

### Task 6.2: Verify End-to-End Content Flow

- Course appears in catalog
- Course detail renders all sections
- Lessons render rich content + code editor
- Challenge test cases work
- i18n switching works for all content

---

## Phase 7: Polish & Performance

**Milestone:** All Lighthouse targets met, micro-animations, responsive perfected.

### Task 7.1: Lighthouse Optimization

- Run Lighthouse audit on all pages
- Fix any Performance < 90 issues (lazy-load, image optimization, ISR)
- Fix any Accessibility < 95 issues (ARIA, contrast, focus management)
- Fix any SEO < 90 issues (metadata, sitemap, robots.txt)

### Task 7.2: Micro-Animations

- XP gain: floating "+50 XP" animation
- Level up: celebration modal with confetti
- Achievement unlock: slide-in toast
- Lesson complete: checkmark animation
- Page transitions: fade/slide
- Button hover states
- Loading skeletons for all data-dependent sections

### Task 7.3: Responsive Audit

- Test all pages at 320px, 375px, 768px, 1024px, 1440px
- Fix any layout issues
- Verify touch targets (48px minimum)
- Test navigation on mobile (sheet/bottom nav)

### Task 7.4: SEO & Metadata

- Create: `app/src/app/[locale]/sitemap.ts`
- Create: `app/src/app/[locale]/robots.ts`
- Add metadata to all pages via Next.js Metadata API
- OG images for courses and credentials

---

## Phase 8: Documentation & Submission

**Milestone:** All deliverables complete, submitted.

### Task 8.1: Documentation

- Write: `app/ARCHITECTURE.md`
- Write: `app/CMS_GUIDE.md`
- Write: `app/CUSTOMIZATION.md`
- Update: `app/README.md` (final version with all setup instructions)

### Task 8.2: Demo Video

Record 3-5 minute demo covering:
1. Landing page + theme + i18n
2. Course catalog + enrollment
3. Lesson view + code editor
4. Code challenge + test cases
5. Dashboard + gamification
6. Leaderboard + profile
7. Admin dashboard + CMS
8. Bonus features
9. Credential viewer + verification

### Task 8.3: Twitter Post

Tweet tagging @SuperteamBR with deployed URL + highlights.

### Task 8.4: Fork & PR Submission

1. Fork `solanabr/superteam-academy`
2. Copy `app/` directory into fork
3. Create PR with comprehensive description
4. Verify deployed app URL in PR

---

## Dependency Graph

```
Phase 0 (Scaffold) ─────────────────────────────────┐
  │                                                   │
  ├─► Phase 1 (Solana Services) ─► Phase 2 (Stores/Hooks)
  │                                    │
  ├─► Phase 3 (Layout Components) ─────┤
  │                                    │
  │                                    ├─► Phase 4 (Core Pages)
  │                                    │        │
  │                                    │        ├─► Phase 5 (Bonus Features)
  │                                    │        │
  │                                    │        ├─► Phase 6 (CMS Content)
  │                                    │        │
  │                                    │        └─► Phase 7 (Polish)
  │                                    │                 │
  └────────────────────────────────────┴─────────────────┴─► Phase 8 (Docs & Submit)
```

**Parallelizable:**
- Phase 1 + Phase 3 (services + layout are independent)
- Tasks within Phase 4 (pages can be built in parallel after stores/hooks)
- Tasks within Phase 5 (bonus features are independent)
- Phase 6 + Phase 7 (content + polish are independent)
