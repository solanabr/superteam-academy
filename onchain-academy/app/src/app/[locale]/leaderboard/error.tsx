"use client";

import { useEffect } from "react";
import { PageError } from "@/components/ui/page-error";

export default function LeaderboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Leaderboard error:", error);
  }, [error]);

  return <PageError section="leaderboard" reset={reset} />;
}
