"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { Zap } from "lucide-react";
import { useXpBalance, useLevel } from "@/hooks/use-xp";
import { LevelBadge } from "@/components/gamification/level-badge";
import { formatXp } from "@/lib/solana/xp";
import { Skeleton } from "@/components/ui/skeleton";

export function XpHeader() {
  const { connected } = useWallet();
  const { data: xp, isLoading } = useXpBalance();
  const { level } = useLevel();

  if (!connected) return null;

  return (
    <div className="flex items-center gap-2">
      {isLoading ? (
        <Skeleton className="h-6 w-20" />
      ) : (
        <>
          <LevelBadge level={level ?? 0} size="sm" />
          <span className="flex items-center gap-1 text-sm font-medium">
            <Zap className="h-3.5 w-3.5 text-superteam-green" />
            {formatXp(xp ?? 0)}
          </span>
        </>
      )}
    </div>
  );
}
