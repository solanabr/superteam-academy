"use client";

import { useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { LeaderboardTable } from "@/components/leaderboard/LeaderboardTable";
import { events } from "@/lib/analytics";
import type { LeaderboardEntry } from "@/types";

export function LeaderboardClient({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  const { publicKey } = useWallet();

  useEffect(() => {
    events.leaderboardView("all");
  }, []);

  return (
    <LeaderboardTable entries={entries} currentWallet={publicKey?.toBase58()} />
  );
}
