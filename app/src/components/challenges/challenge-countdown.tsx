"use client";

import { useState, useEffect } from "react";
import { Clock } from "lucide-react";
import { getSecondsUntilReset } from "@/lib/daily-challenges";

function formatCountdown(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

interface ChallengeCountdownProps {
  label: string;
}

/** Live countdown timer to the next daily challenge reset (UTC midnight). */
export function ChallengeCountdown({ label }: ChallengeCountdownProps) {
  const [seconds, setSeconds] = useState(() => getSecondsUntilReset());

  useEffect(() => {
    const interval = setInterval(() => {
      setSeconds(getSecondsUntilReset());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
      <Clock className="h-3.5 w-3.5" />
      <span>{label}:</span>
      <span className="font-mono font-medium tabular-nums text-foreground">
        {formatCountdown(seconds)}
      </span>
    </div>
  );
}
