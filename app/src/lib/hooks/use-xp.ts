'use client';

import { useMemo } from 'react';
import { useUserStore } from '@/lib/stores/user-store';
import { xpProgressPercent, xpToNextLevel, getLevelTitle } from '@/lib/solana/xp';

interface UseXpReturn {
  xp: number;
  level: number;
  progress: number;
  toNextLevel: number;
  levelTitle: string;
  isLoading: boolean;
}

/**
 * Reactive XP state derived from the user store.
 * Computes progress percentage, XP to next level, and level title
 * from the raw xpBalance without additional network calls.
 */
export function useXp(): UseXpReturn {
  const xp = useUserStore((s) => s.xpBalance);
  const level = useUserStore((s) => s.level);
  const isLoading = useUserStore((s) => s.isLoading);

  const derived = useMemo(() => ({
    progress: xpProgressPercent(xp),
    toNextLevel: xpToNextLevel(xp),
    levelTitle: getLevelTitle(level),
  }), [xp, level]);

  return {
    xp,
    level,
    progress: derived.progress,
    toNextLevel: derived.toNextLevel,
    levelTitle: derived.levelTitle,
    isLoading,
  };
}
