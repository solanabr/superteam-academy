# XP & Level Service

**Status**: Frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |

---

## Overview

The XP Service manages XP balance display and level calculation. XP is stored on-chain as Token-2022, levels are derived client-side.

## Level Formula

```
Level = floor(sqrt(totalXP / 100))
```

| Level | XP Required |
|-------|-------------|
| 1 | 0-99 |
| 2 | 100-399 |
| 3 | 400-899 |
| 4 | 900-1599 |
| 5 | 1600-2499 |
| 10 | 10,000 |
| 20 | 40,000 |
| 50 | 250,000 |
| 100 | 1,000,000 |

## Implementation

### 1. XP Balance Hook

```typescript
// hooks/useXpBalance.ts
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { Connection, PublicKey } from '@solana/web3.js';
import { getAssociatedTokenAddressSync } from '@solana/spl-token';
import { TOKEN_2022_PROGRAM_ID } from '@solana/spl-token';

export function useXpBalance(xpMint: PublicKey | null) {
  const { publicKey } = useWallet();
  const connection = new Connection(process.env.NEXT_PUBLIC_RPC_URL!);
  
  return useQuery({
    queryKey: ['xpBalance', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey || !xpMint) return 0;
      
      const ata = getAssociatedTokenAddressSync(
        xpMint,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );
      
      try {
        const balance = await connection.getTokenAccountBalance(ata);
        return Number(balance.value.amount);
      } catch {
        return 0;
      }
    },
    enabled: !!publicKey && !!xpMint,
    refetchInterval: 30000,
  });
}
```

### 2. XP Mint Hook

```typescript
// hooks/useXpMint.ts
import { useQuery } from '@tanstack/react-query';
import { useProgram } from './useProgram';
import { deriveConfigPda } from '@/lib/pda';
import { PROGRAM_ID } from '@/lib/constants';

export function useXpMint() {
  const { program } = useProgram();
  const configPda = deriveConfigPda(PROGRAM_ID);
  
  return useQuery({
    queryKey: ['xpMint'],
    queryFn: async () => {
      const config = await program.account.config.fetch(configPda);
      return config.xpMint;
    },
    staleTime: Infinity,
  });
}
```

### 3. Level Utilities

```typescript
// lib/levels.ts
export function calculateLevel(xp: number): number {
  if (xp < 0) return 1;
  return Math.floor(Math.sqrt(xp / 100)) + 1;
}

export function getXpForLevel(level: number): number {
  if (level <= 1) return 0;
  return (level - 1) * (level - 1) * 100;
}

export function getXpToNextLevel(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  return nextLevelXp - currentXp;
}

export function getLevelProgress(currentXp: number): number {
  const currentLevel = calculateLevel(currentXp);
  const currentLevelXp = getXpForLevel(currentLevel);
  const nextLevelXp = getXpForLevel(currentLevel + 1);
  
  const xpInLevel = currentXp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  
  return Math.min(100, (xpInLevel / xpNeeded) * 100);
}

export function getLevelTitle(level: number): string {
  if (level >= 100) return 'Legend';
  if (level >= 75) return 'Master';
  if (level >= 50) return 'Expert';
  if (level >= 25) return 'Veteran';
  if (level >= 10) return 'Skilled';
  if (level >= 5) return 'Apprentice';
  return 'Novice';
}
```

### 4. XP Balance Card Component

```typescript
// components/xp/XpBalanceCard.tsx
'use client';

import { useXpBalance } from '@/hooks/useXpBalance';
import { useXpMint } from '@/hooks/useXpMint';
import { calculateLevel, getLevelProgress, getLevelTitle, getXpToNextLevel } from '@/lib/levels';

export function XpBalanceCard() {
  const { data: xpMint } = useXpMint();
  const { data: xp = 0 } = useXpBalance(xpMint || null);
  
  const level = calculateLevel(xp);
  const progress = getLevelProgress(xp);
  const xpToNext = getXpToNextLevel(xp);
  const title = getLevelTitle(level);
  
  return (
    <div className="xp-balance-card">
      <div className="card-header">
        <span className="xp-icon">⚡</span>
        <span className="xp-label">Experience Points</span>
      </div>
      
      <div className="xp-display">
        <span className="xp-value">{xp.toLocaleString()}</span>
        <span className="xp-unit">XP</span>
      </div>
      
      <div className="level-section">
        <div className="level-badge">
          <span className="level-number">{level}</span>
          <span className="level-title">{title}</span>
        </div>
        
        <div className="level-progress">
          <div className="progress-bar">
            <div 
              className="progress-fill" 
              style={{ width: `${progress}%` }}
            />
          </div>
          <span className="progress-text">
            {xpToNext.toLocaleString()} XP to Level {level + 1}
          </span>
        </div>
      </div>
    </div>
  );
}
```

### 5. XP Gain Animation

```typescript
// components/xp/XpGainAnimation.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface XpGainAnimationProps {
  amount: number;
  show: boolean;
}

export function XpGainAnimation({ amount, show }: XpGainAnimationProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="xp-gain-animation"
          initial={{ opacity: 0, y: 20, scale: 0.5 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.5 }}
          transition={{ duration: 0.5 }}
        >
          <span className="xp-plus">+</span>
          <span className="xp-amount">{amount}</span>
          <span className="xp-label">XP</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## XP Rewards Configuration

| Action | XP |
|--------|-----|
| Complete lesson (Easy) | 10 XP |
| Complete lesson (Medium) | 25 XP |
| Complete lesson (Hard) | 50 XP |
| Complete challenge | 25-100 XP |
| Complete course | 500-2000 XP |
| Daily streak bonus | 10 XP |
| First completion of day | 25 XP |
| Achievement unlock | Variable |

## XP History

Track XP gains in local storage for display:

```typescript
// hooks/useXpHistory.ts
export function useXpHistory() {
  return useQuery({
    queryKey: ['xpHistory'],
    queryFn: async () => {
      // For MVP, read from local storage
      // In production, fetch from backend/events
      const stored = localStorage.getItem('xp_history');
      return stored ? JSON.parse(stored) : [];
    },
  });
}

export function recordXpGain(amount: number, source: string) {
  const history = JSON.parse(localStorage.getItem('xp_history') || '[]');
  history.unshift({
    amount,
    source,
    timestamp: Date.now(),
  });
  // Keep last 100 entries
  localStorage.setItem('xp_history', JSON.stringify(history.slice(0, 100)));
}
```
