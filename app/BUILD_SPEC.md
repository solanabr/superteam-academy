# Superteam Academy Frontend - Build Specification

## Stack
- Next.js 14+ App Router, TypeScript strict, Tailwind CSS
- @solana/wallet-adapter-react for wallet connection
- @coral-xyz/anchor for program interaction
- Radix UI primitives for components
- lucide-react for icons
- next-intl for i18n (PT-BR, ES, EN)
- @monaco-editor/react for code editor

## Program Details
- Program ID: ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf
- XP Mint: xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3
- Cluster: devnet
- See docs/SPEC.md, docs/INTEGRATION.md, docs/ARCHITECTURE.md

## Pages to Build
1. **/** - Landing page with hero, feature highlights, stats
2. **/courses** - Course catalog with filtering by track/difficulty
3. **/courses/[courseId]** - Course detail with lesson list, enrollment, progress
4. **/leaderboard** - XP leaderboard ranked by Token-2022 balance
5. **/profile** - User profile with XP, enrolled courses, credentials, achievements
6. **/achievements** - Achievement gallery

## Core Features (IMPLEMENTED)
1. Wallet auth via @solana/wallet-adapter (Phantom, Backpack, Solflare)
2. XP balance display from Token-2022 soulbound token
3. Course enrollment (learner-signed transaction)
4. Credential NFT display via Helius DAS API
5. Leaderboard by indexing XP balances
6. Course progress display from enrollment bitmap

## Features (STUBBED with clean interfaces)
1. Lesson completion flow (needs backend signer)
2. Course finalization (needs backend signer)
3. Achievement claiming (needs minter role)
4. Streak tracking (frontend-only placeholder)

## Design Requirements
- Dark theme, modern, polished
- Solana purple (#9945FF) as primary accent
- Glassmorphism cards, subtle animations
- Responsive (mobile-first)
- PT-BR as default locale, with EN and ES
