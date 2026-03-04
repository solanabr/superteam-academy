# Superteam Academy — Web3 Integration Guide

## What Was Fixed and Added

### 🐛 Build Errors Fixed

| File | Line | Error | Fix |
|------|------|-------|-----|
| `components/lesson/LessonView.tsx` | 164 | `react/no-unescaped-entities` — raw `'` in JSX | Replace with `&apos;` |
| `lib/services/course.ts` | 71 | `@next/next/no-assign-module-variable` | Rename `module` var to `courseModule` |

### ✨ New Files Added

```
components/providers/WalletProvider.tsx   ← Full wallet adapter setup
components/wallet/WalletConnectButton.tsx ← Drop-in connect button + XP display
lib/services/learning-progress.ts        ← ILearningProgressService + all impls
lib/services/course.ts                   ← Fixed course service
app/layout.tsx                           ← Updated to inject WalletProvider
```

---

## Step 1 — Install Dependencies

```bash
npm install \
  @solana/wallet-adapter-base \
  @solana/wallet-adapter-react \
  @solana/wallet-adapter-react-ui \
  @solana/wallet-adapter-wallets \
  @solana/web3.js
```

If you need Supabase (optional, for production backend):
```bash
npm install @supabase/supabase-js
```

---

## Step 2 — Copy the Files

Place each file at the path shown in its header comment:

```
components/providers/WalletProvider.tsx
components/wallet/WalletConnectButton.tsx
lib/services/learning-progress.ts
lib/services/course.ts       ← replaces the broken one
app/layout.tsx
```

---

## Step 3 — Add Wallet Adapter CSS

In `app/globals.css`, add this at the top:

```css
@import "@solana/wallet-adapter-react-ui/styles.css";
```

Or it's already done in `app/layout.tsx` via the import at the top.

---

## Step 4 — Set Environment Variables

Create `.env.local` (copy from `.env.example`):

```bash
# Minimum config for zero-setup demo:
NEXT_PUBLIC_BACKEND=localstorage
NEXT_PUBLIC_SOLANA_NETWORK=devnet
```

---

## Step 5 — Replace the Connect Button in Your Nav

Find wherever `Conectar Carteira` or `Connect Wallet` is rendered, e.g. in your `Navbar.tsx`, and replace with:

```tsx
import { WalletConnectButton } from "@/components/wallet/WalletConnectButton";

// Inside your nav:
<WalletConnectButton />
```

---

## Step 6 — Use the Service in Lesson Pages

```tsx
import { learningProgressService } from "@/lib/services/learning-progress";
import { useWallet } from "@solana/wallet-adapter-react";

export function useLessonComplete(courseId: string, lessonIndex: number) {
  const { publicKey } = useWallet();

  const complete = async () => {
    if (!publicKey) return;
    const userId = publicKey.toBase58();
    const result = await learningProgressService.completeLesson(
      userId, courseId, lessonIndex
    );
    if (result.leveledUp) {
      // Show level-up toast!
    }
    return result;
  };

  return { complete };
}
```

---

## Step 7 (Optional) — Switch to Supabase

1. Create a free project at [supabase.com](https://supabase.com)
2. Run the SQL schema from the comment in `lib/services/learning-progress.ts`
3. Update `.env.local`:
   ```
   NEXT_PUBLIC_BACKEND=supabase
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```
4. No other code changes needed — the same interface is used.

---

## Architecture Overview

```
ILearningProgressService (interface contract)
         │
         ├── LocalStorageProgressService   (NEXT_PUBLIC_BACKEND=localstorage)
         │     Zero-config, browser localStorage, great for demos
         │
         ├── SupabaseProgressService       (NEXT_PUBLIC_BACKEND=supabase)
         │     Production Postgres, real-time leaderboard
         │
         └── OnChainProgressService        (NEXT_PUBLIC_BACKEND=onchain)
               Future Anchor/Solana integration stub
```

**To swap backends: change ONE env var. Zero UI changes required.**

---

## Gamification Formula

```
Level = floor(sqrt(totalXP / 100))
```

| XP    | Level |
|-------|-------|
| 0     | 0     |
| 100   | 1     |
| 400   | 2     |
| 900   | 3     |
| 1,600 | 4     |
| 10,000 | 10  |

Streak bonuses:
- 3+ day streak → +10 XP per lesson
- 7+ day streak → +20 XP per lesson

---

## i18n — Default to English

The `app/layout.tsx` sets `lang="en"` by default.  
Your existing `next-intl` setup handles PT-BR and ES.  
No changes needed — the wallet adapter UI inherits whatever locale you pass.

---

## Vercel Environment Variables

Set these in your Vercel dashboard under **Settings → Environment Variables**:

```
NEXT_PUBLIC_BACKEND          = localstorage
NEXT_PUBLIC_SOLANA_NETWORK   = devnet
```

For Supabase (optional):
```
NEXT_PUBLIC_SUPABASE_URL     = https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY = eyJ...
```
