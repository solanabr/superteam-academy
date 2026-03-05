"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/use-auth";

function getOnboardingKey(wallet: string) {
  return `st-academy:${wallet}:onboarding-completed`;
}

function getOnboardingResultKey(wallet: string) {
  return `st-academy:${wallet}:onboarding-result`;
}

export interface OnboardingResult {
  level: "beginner" | "intermediate" | "advanced";
  score: number;
  totalQuestions: number;
  recommendedTrack: string;
  completedAt: string;
}

/**
 * Detects if a wallet is an existing user (connected before onboarding existed).
 * Checks for any profile data, enrollment, lesson progress, or activity.
 */
function isExistingUser(wallet: string): boolean {
  try {
    // Has profile name set
    if (localStorage.getItem("st-academy:profile-name")) return true;
    // Has any enrollment (wallet-scoped)
    const enrollPrefix = `st-academy:${wallet}:enrolled:`;
    // Has any lesson progress (wallet-scoped)
    const lessonPrefix = `st-academy:${wallet}:lesson:`;
    // Has any progress data
    const progressPrefix = `st-academy:${wallet}:progress:`;
    // Has XP
    const xpKey = `st-academy:${wallet}:xp`;
    if (localStorage.getItem(xpKey)) return true;

    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (
        key.startsWith(enrollPrefix) ||
        key.startsWith(lessonPrefix) ||
        key.startsWith(progressPrefix)
      ) {
        return true;
      }
    }
  } catch {
    /* */
  }
  return false;
}

export function useOnboarding() {
  const { publicKey, connected } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const [completed, setCompleted] = useState<boolean | null>(null);
  const [result, setResult] = useState<OnboardingResult | null>(null);

  useEffect(() => {
    if (!walletAddr) {
      setCompleted(null);
      setResult(null);
      return;
    }
    // Already marked as completed
    if (localStorage.getItem(getOnboardingKey(walletAddr)) === "true") {
      setCompleted(true);
      try {
        const raw = localStorage.getItem(getOnboardingResultKey(walletAddr));
        if (raw) setResult(JSON.parse(raw) as OnboardingResult);
      } catch {
        /* */
      }
      return;
    }
    // Existing user who connected before onboarding feature — auto-skip
    if (isExistingUser(walletAddr)) {
      localStorage.setItem(getOnboardingKey(walletAddr), "true");
      setCompleted(true);
      return;
    }
    // Truly new user — needs onboarding
    setCompleted(false);
  }, [walletAddr]);

  const completeOnboarding = (res: OnboardingResult) => {
    if (!walletAddr) return;
    localStorage.setItem(getOnboardingKey(walletAddr), "true");
    localStorage.setItem(
      getOnboardingResultKey(walletAddr),
      JSON.stringify(res),
    );
    setCompleted(true);
    setResult(res);
  };

  const needsOnboarding = connected && completed === false;

  return { completed, needsOnboarding, result, completeOnboarding };
}
