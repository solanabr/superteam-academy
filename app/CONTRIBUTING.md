# Contributing to Superteam Academy

Thank you for your interest in contributing to Superteam Academy — the open-source Solana learning platform built for crypto-native developers. This guide covers everything you need to get started.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Local Development Setup](#local-development-setup)
- [Project Structure](#project-structure)
- [Coding Standards](#coding-standards)
- [Component Guidelines](#component-guidelines)
- [Service Layer Conventions](#service-layer-conventions)
- [Internationalization (i18n)](#internationalization-i18n)
- [Testing Guide](#testing-guide)
- [Pull Request Process](#pull-request-process)
- [Commit Convention](#commit-convention)
- [Troubleshooting](#troubleshooting)

---

## Prerequisites

| Tool       | Version  | Check              |
| ---------- | -------- | ------------------ |
| Node.js    | ≥ 18.0   | `node -v`          |
| pnpm       | ≥ 9.0    | `pnpm -v`          |
| Git        | ≥ 2.30   | `git --version`    |

Optional (for on-chain features):

| Tool             | Purpose                       |
| ---------------- | ----------------------------- |
| Solana CLI       | Devnet wallet & transactions  |
| Anchor CLI       | Program interaction           |
| Phantom/Solflare | Browser wallet testing        |

## Local Development Setup

### 1. Fork & Clone

```bash
# Fork on GitHub, then:
git clone https://github.com/<your-username>/superteam-academy.git
cd superteam-academy/app
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Configure Environment

```bash
cp .env.example .env.local
```

The app runs fully with mock data — no external services required for local development. To enable optional integrations, fill in the relevant keys:

| Variable                         | Required | Purpose                |
| -------------------------------- | -------- | ---------------------- |
| `NEXT_PUBLIC_SOLANA_RPC_URL`     | No       | Solana RPC (defaults to devnet) |
| `NEXT_PUBLIC_SANITY_PROJECT_ID`  | No       | Sanity CMS (falls back to mock data) |
| `NEXT_PUBLIC_GA4_ID`             | No       | Google Analytics       |
| `NEXT_PUBLIC_POSTHOG_KEY`        | No       | PostHog analytics      |
| `NEXT_PUBLIC_SENTRY_DSN`         | No       | Sentry error tracking  |
| `NEXT_PUBLIC_HELIUS_API_KEY`     | No       | Helius DAS API         |

### 4. Start Development Server

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). The app uses Turbopack for fast HMR.

### 5. Verify Setup

```bash
pnpm lint          # ESLint checks
pnpm test          # Unit tests (Vitest)
pnpm build         # Production build
```

All three must pass before submitting a PR.

---

## Project Structure

```
src/
├── app/                        # Next.js App Router pages
│   ├── (route)/
│   │   ├── page.tsx            # Route page component
│   │   ├── loading.tsx         # Suspense loading skeleton
│   │   └── error.tsx           # Error boundary
│   ├── layout.tsx              # Root layout (providers, fonts, metadata)
│   └── template.tsx            # Page transition wrapper
├── components/
│   ├── auth/                   # Authentication components
│   ├── certificate/            # Certificate display components
│   ├── course/                 # Course catalog, detail, lesson components
│   ├── editor/                 # Code editor (Monaco) components
│   ├── gamification/           # XP, levels, streaks, achievements
│   ├── icons/                  # SVG illustrations and brand logos
│   ├── layout/                 # Header, footer, page transition
│   ├── profile/                # Profile page components
│   ├── settings/               # Settings tabs
│   └── ui/                     # shadcn/ui primitives + shared UI
├── lib/
│   ├── hooks/                  # Custom React hooks
│   ├── onchain/                # Solana/Anchor integration
│   ├── services/               # Service layer (progress, analytics)
│   ├── constants.ts            # App-wide constants
│   ├── mock-data.ts            # Mock achievements & helpers
│   ├── mock-courses.ts         # Mock course catalog data
│   └── utils.ts                # Utility functions
├── messages/                   # i18n translation files
│   ├── en.json                 # English
│   ├── pt-BR.json              # Portuguese (Brazil)
│   └── es.json                 # Spanish
├── types/                      # TypeScript type definitions
│   └── index.ts                # Shared types & interfaces
└── __tests__/                  # Unit tests (Vitest)
```

Each component directory has a barrel export (`index.ts`) for clean imports:

```ts
// Good — use barrel exports
import { CourseCard, CourseGrid, CourseFilters } from "@/components/course";

// Avoid — direct file imports
import { CourseCard } from "@/components/course/course-card";
```

---

## Coding Standards

### TypeScript

- **Strict mode** is enforced (`strict: true` in tsconfig.json)
- **No `any` types** — use proper interfaces, generics, or `unknown`
- **No `@ts-ignore`** or `@ts-nocheck` directives
- Export prop interfaces for all components:

```ts
export interface CourseCardProps {
  course: Course;
  progress?: number;
  onEnroll?: (slug: string) => void;
}

export function CourseCard({ course, progress, onEnroll }: CourseCardProps) {
  // ...
}
```

### File Size

- **Maximum 400 lines per file** — decompose larger files into focused modules
- Extract reusable logic into hooks (`lib/hooks/`)
- Extract complex sub-sections into child components

### Styling

- Use **Tailwind CSS** utility classes with semantic design tokens:

```tsx
// Good — semantic tokens that adapt to light/dark mode
<div className="bg-card text-card-foreground border border-border rounded-lg">

// Avoid — hardcoded colors
<div className="bg-gray-800 text-white border border-gray-700 rounded-lg">
```

- Use **CVA** (class-variance-authority) for component variants — see `components/ui/button.tsx`
- Use the `cn()` utility from `lib/utils.ts` for conditional class merging

### Imports

- Use the `@/` path alias for all imports from `src/`:

```ts
import { Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import type { Course } from "@/types";
```

### Server vs Client Components

- **Default to Server Components** — no `"use client"` unless you need interactivity
- Push client boundaries to the smallest leaf component possible
- Use `next/dynamic` with `ssr: false` for heavy client-only libraries (Monaco, Recharts, wallet adapter)

---

## Component Guidelines

### Creating a New Component

1. **Choose the right directory** based on the feature domain:
   - `components/course/` — course catalog, detail, lesson-related
   - `components/editor/` — code editor and challenge UI
   - `components/gamification/` — XP, levels, achievements, streaks
   - `components/profile/` — user profile sections
   - `components/settings/` — settings page tabs
   - `components/ui/` — generic reusable primitives
   - `components/icons/` — SVG illustrations and logos

2. **Name files in kebab-case**: `course-card.tsx`, `test-runner.tsx`

3. **Export from the barrel** — add your component to the directory's `index.ts`

4. **Follow the prop interface pattern**:

```tsx
"use client";

import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader } from "@/components/ui";

export interface MyComponentProps {
  title: string;
  description?: string;
  className?: string;
}

export function MyComponent({ title, description, className }: MyComponentProps) {
  const t = useTranslations("myNamespace");

  return (
    <Card className={className}>
      <CardHeader>{title}</CardHeader>
      {description && <CardContent>{description}</CardContent>}
    </Card>
  );
}
```

### Using shadcn/ui

We use [shadcn/ui](https://ui.shadcn.com/) primitives (built on Radix UI). Available components are in `components/ui/`. To add a new shadcn component:

```bash
pnpm dlx shadcn@latest add <component-name>
```

Always prefer existing primitives over custom implementations for accessibility.

### Skeleton Loading States

Every route has a `loading.tsx` file with a skeleton matching the real page layout. When adding a new data-fetching component, create a matching skeleton:

```tsx
import { Skeleton } from "@/components/ui/skeleton";

export function MyComponentSkeleton() {
  return (
    <div className="space-y-3">
      <Skeleton className="h-6 w-48" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-3/4" />
    </div>
  );
}
```

### Error Boundaries

Route-level error boundaries use the shared `RouteError` component. See `components/ui/route-error.tsx` for the pattern.

---

## Service Layer Conventions

The app uses a **service interface pattern** to abstract data access. This enables swapping localStorage for on-chain calls without changing UI code.

### Core Interface

```ts
// lib/services/learning-progress.ts
interface LearningProgressService {
  getProgress(userId: string, courseId: string): Promise<Progress>;
  completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void>;
  getXP(userId: string): Promise<number>;
  getStreak(userId: string): Promise<StreakData>;
  getLeaderboard(timeframe: "weekly" | "monthly" | "alltime"): Promise<LeaderboardEntry[]>;
  getCredentials(wallet: PublicKey): Promise<Credential[]>;
  // ... see full interface in source
}
```

### Implementations

| Service                         | Backend          | Usage              |
| ------------------------------- | ---------------- | ------------------ |
| `LocalStorageProgressService`   | localStorage     | Offline / dev mode |
| `OnChainProgressService`        | Solana devnet    | Connected wallet   |
| `HybridProgressService`         | Auto-selects     | Production default |

When adding new data operations, follow this pattern:
1. Add the method to the `LearningProgressService` interface
2. Implement in `LocalStorageProgressService` (mock/offline)
3. Implement in `OnChainProgressService` (on-chain)
4. Wire up in `HybridProgressService`

### Data Service (CMS)

Course content is fetched via `lib/services/data-service.ts`, which queries Sanity CMS with automatic fallback to mock data when Sanity is not configured.

---

## Internationalization (i18n)

All user-facing strings must be externalized using [next-intl](https://next-intl-docs.vercel.app/).

### Adding a Translation Key

1. Add the key to **all three** locale files in `src/messages/`:
   - `en.json` (English)
   - `pt-BR.json` (Portuguese — Brazil)
   - `es.json` (Spanish)

2. Use ICU message format for plurals:

```json
{
  "courses": {
    "resultsCount": "{count, plural, =0 {No courses found} one {1 course found} other {# courses found}}"
  }
}
```

3. Use in components:

```tsx
// Client components
const t = useTranslations("courses");
return <p>{t("resultsCount", { count: results.length })}</p>;

// Server components
const t = await getTranslations("courses");
```

### Verifying Translation Completeness

An automated test (`i18n-completeness.test.ts`) ensures all three locale files have identical keys. Run `pnpm test` to verify.

---

## Testing Guide

### Unit Tests (Vitest)

Tests live in `src/__tests__/` and use [Vitest](https://vitest.dev/) with jsdom.

```bash
pnpm test              # Run all tests once
pnpm test:watch        # Watch mode for development
```

**Writing a test:**

```ts
// src/__tests__/my-feature.test.ts
import { describe, it, expect } from "vitest";
import { myFunction } from "@/lib/my-module";

describe("myFunction", () => {
  it("returns expected value", () => {
    expect(myFunction("input")).toBe("expected");
  });
});
```

**Conventions:**
- File naming: `<module>.test.ts` or `<module>.test.tsx`
- Use `describe` blocks to group related tests
- Test behavior, not implementation details
- Use the `@/` path alias (configured in `vitest.config.ts`)

### E2E Tests (Playwright)

E2E tests live in `e2e/` and use [Playwright](https://playwright.dev/).

```bash
pnpm e2e               # Run E2E tests headless
pnpm e2e:ui            # Run with interactive UI
```

**Writing an E2E test:**

```ts
// e2e/my-flow.spec.ts
import { test, expect } from "@playwright/test";

test("user can navigate to courses", async ({ page }) => {
  await page.goto("/");
  await page.click('text="Explore Courses"');
  await expect(page).toHaveURL("/courses");
  await expect(page.locator("h1")).toContainText("Courses");
});
```

**Conventions:**
- File naming: `<flow>.spec.ts`
- Playwright auto-starts the dev server (configured in `playwright.config.ts`)
- Tests run against Chrome desktop viewport
- Use semantic selectors (`text=`, `role=`, `data-testid=`) over CSS selectors

### What to Test

| Layer          | Tool       | What to test                                    |
| -------------- | ---------- | ----------------------------------------------- |
| Utility fns    | Vitest     | Pure logic: XP calculations, formatting, utils  |
| Services       | Vitest     | Data operations, state management, edge cases   |
| i18n           | Vitest     | Translation key completeness across locales     |
| User flows     | Playwright | Navigation, enrollment, lesson completion       |
| Accessibility  | Playwright | Keyboard navigation, ARIA attributes, focus     |

---

## Pull Request Process

### 1. Create a Feature Branch

```bash
git checkout main
git pull origin main
git checkout -b feat/your-feature-name
```

Branch naming convention:
- `feat/` — new features
- `fix/` — bug fixes
- `docs/` — documentation changes
- `refactor/` — code restructuring
- `test/` — adding or updating tests

### 2. Make Your Changes

- Follow the coding standards above
- Add/update tests for new functionality
- Add i18n keys for any new user-facing strings
- Keep files under 400 lines

### 3. Verify Before Pushing

```bash
pnpm lint              # No ESLint errors
pnpm test              # All unit tests pass
pnpm build             # Production build succeeds
```

All three checks must pass. Do not submit PRs with build failures or test regressions.

### 4. Submit the Pull Request

- Write a clear PR title using the commit convention prefix
- Include a description of **what** changed and **why**
- Reference any related issues
- Include screenshots for UI changes
- Ensure CI checks pass

### 5. Code Review

- At least one maintainer review is required
- Address review feedback with new commits (don't force-push during review)
- Keep the PR focused — one feature or fix per PR

---

## Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>: <description>
```

| Type       | Usage                                          |
| ---------- | ---------------------------------------------- |
| `feat`     | New feature or capability                      |
| `fix`      | Bug fix                                        |
| `docs`     | Documentation only                             |
| `refactor` | Code restructuring (no behavior change)        |
| `test`     | Adding or updating tests                       |
| `perf`     | Performance improvement                        |
| `style`    | Formatting, whitespace (no code change)        |
| `chore`    | Build config, dependencies, tooling            |

**Examples:**
```
feat: add course review submission with star ratings
fix: correct XP calculation for streak bonus
docs: add API reference for service interfaces
refactor: extract lesson sidebar into standalone component
test: add E2E tests for enrollment flow
perf: dynamic import Monaco editor to reduce initial bundle
```

Keep the description concise (under 72 characters). Use the commit body for additional detail if needed.

---

## Troubleshooting

### Common Issues

**Build fails with module not found:**
```bash
rm -rf node_modules .next
pnpm install
pnpm build
```

**Turbopack HMR not working:**
```bash
# Clear Next.js cache
rm -rf .next
pnpm dev
```

**Wallet adapter errors in dev:**
- Wallet features require a browser extension (Phantom, Solflare)
- The app gracefully degrades without a wallet — progress uses localStorage

**Sanity CMS not loading content:**
- The app falls back to mock data when Sanity env vars are not set
- To use Sanity, set `NEXT_PUBLIC_SANITY_PROJECT_ID` and `SANITY_API_TOKEN` in `.env.local`
- See [CMS_GUIDE.md](./CMS_GUIDE.md) for full Sanity setup

**Tests failing after adding i18n keys:**
- Ensure the key exists in **all three** locale files (`en.json`, `pt-BR.json`, `es.json`)
- Run `pnpm test` — the i18n completeness test will show which keys are missing

### Getting Help

- **Telegram:** [t.me/kauenet](https://t.me/kauenet)
- **Discord:** discord.gg/superteambrasil
- **Twitter:** [@SuperteamBR](https://twitter.com/SuperteamBR)

---

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](./LICENSE).
