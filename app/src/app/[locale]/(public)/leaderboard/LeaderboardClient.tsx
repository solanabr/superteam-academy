"use client";

import { useWallet } from "@solana/wallet-adapter-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import type { LeaderboardEntry } from "@/types";

export function LeaderboardClient({ entries }: { entries: LeaderboardEntry[] }) {
  const { publicKey } = useWallet();
  return <LeaderboardTable entries={entries} currentWallet={publicKey?.toBase58()} />;
}
