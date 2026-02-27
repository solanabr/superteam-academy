# Superteam Academy - Frontend Architecture

## Overview

Superteam Academy is a Next.js 15 application designed for high performance, utilizing React Server Components (RSC) and a modern stack including Tailwind CSS, Shadcn/UI, and Solana Web3 integration.

## Key Technologies

- **Framework**: Next.js 15 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS v4, Shadcn/UI, Framer Motion
- **State Management**: React Context (`GamificationContext`, `WalletContext`)
- **Web3**: Solana Wallet Adapter, Helius DAS API
- **Editor**: Monaco Editor (`@monaco-editor/react`)
- **AI**: Groq (Llama 3.3) via API Routes
- **CMS**: Sanity (Headless)
- **i18n**: next-intl

## Directory Structure

- `src/app`: Page routes and layouts.
  - `[locale]`: Internationalized routes.
  - `api`: Backend API routes (AI, Auth).
- `src/components`: UI components.
  - `ui`: Base design system (Shadcn).
  - `layout`: Navbar, Footer.
  - `gamification`: XP, Streak, Badges.
  - `editor`: Code Editor and Runner.
- `src/lib`: Utilities and Services.
  - `content.ts`: Mock content service (interfaces for Sanity).
  - `runner.ts`: Code execution logic.
  - `solana`: Helius and Web3 utilities.
- `src/context`: React Context providers.

## Key Flows

### 1. Code Execution

User enters TypeScript code in `CodeEditor`. `LessonWorkspace` sends code to `runner.ts`, which uses a transpiler (simulated or `typescript` package) to convert to JS and executes it in a sandboxed `Function` scope with mocked `console` to capture output.

### 2. Gamification

`GamificationProvider` tracks XP and Streak. Actions like completing a lesson trigger `addXP`. `XPDisplay` listens to changes and animates updates. Achievements are unlocked based on state thresholds.

### 3. AI Assistance

`LessonWorkspace` calls `/api/ai/review` or `/api/ai/hint`. These routes proxy requests to Anthropic API to avoid exposing keys, returning advice or rewritten code.

### 4. Web3 Integration

`WalletProvider` wraps the app. `Navbar` contains `WalletMultiButton`. Leaderboard fetches data from High-throughput Helius API to display top earners based on on-chain XP tokens (Soulbound).

## Performance Optimizations

- **Dynamic Imports**: `WalletMultiButton` and `CodeEditor` are lazy-loaded.
- **RSC**: Marketing and Content pages are Server Components for fast FCP.
- **Images**: All assets use `next/image`.
- **Fonts**: `next/font` for self-hosted optimized fonts.
