"use client";

import { useState, useEffect } from "react";
import { Timer } from "lucide-react";

function formatElapsed(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface ChallengeTimerProps {
  startedAt: string;
  stopped?: boolean;
  label: string;
}

export function ChallengeTimer({
  startedAt,
  stopped,
  label,
}: ChallengeTimerProps) {
  const [elapsed, setElapsed] = useState(() => {
    return Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000);
  });

  useEffect(() => {
    if (stopped) return;
    const interval = setInterval(() => {
      setElapsed(
        Math.floor((Date.now() - new Date(startedAt).getTime()) / 1000),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [startedAt, stopped]);

  return (
    <div className="flex items-center gap-1.5 rounded-md bg-muted px-2.5 py-1 text-base font-semibold">
      <Timer className="h-4 w-4 text-muted-foreground" />
      <span className="font-mono tabular-nums text-foreground">
        {formatElapsed(elapsed)}
      </span>
    </div>
  );
}
