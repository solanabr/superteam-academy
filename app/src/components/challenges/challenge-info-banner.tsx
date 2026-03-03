"use client";

import { useState, useEffect } from "react";
import { Info, X } from "lucide-react";

const STORAGE_KEY = "sta_challenge_info_dismissed";

interface ChallengeInfoBannerProps {
  message: string;
  dismissLabel: string;
  title: string;
}

export function ChallengeInfoBanner({ message, dismissLabel, title }: ChallengeInfoBannerProps) {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "true");
  }, []);

  if (dismissed) return null;

  return (
    <div className="glass relative rounded-xl border border-primary/20 bg-primary/5 p-4">
      <div className="flex items-start gap-3 pr-8">
        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
        <div>
          <h3 className="mb-1 text-sm font-semibold">{title}</h3>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
      </div>
      <button
        onClick={() => {
          setDismissed(true);
          localStorage.setItem(STORAGE_KEY, "true");
        }}
        className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        aria-label={dismissLabel}
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
