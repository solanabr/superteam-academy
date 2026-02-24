"use client";

import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import {
  onboardingService,
  type OnboardingAssessment,
} from "@/lib/services/onboarding-service";

export function useOnboarding() {
  const { publicKey } = useWallet();
  const [isOnboarded, setIsOnboarded] = useState(false);
  const [assessment, setAssessment] = useState<OnboardingAssessment | null>(
    null,
  );
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const walletAddress = publicKey?.toBase58();
    const onboarded = onboardingService.isOnboarded(walletAddress);
    const stored = onboardingService.getAssessment(walletAddress);
    setIsOnboarded(onboarded);
    setAssessment(stored);
    setLoading(false);
  }, [publicKey]);

  return { isOnboarded, assessment, loading };
}
