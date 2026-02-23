"use client";

import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { useState, useEffect, useCallback } from "react";
import type { UserProfile, Credential, StreakData } from "@/lib/services/types";
import {
  getCredentialsByOwner,
  getCredentialsFromEnrollments,
} from "@/lib/services/credentials";
import { getXPBalance } from "@/lib/services/xp";
import { calculateLevel } from "@/lib/constants";
import { learningService } from "@/lib/services/learning-progress";

const EMPTY_STREAK: StreakData = {
  currentStreak: 0,
  longestStreak: 0,
  lastActivityDate: "",
  freezesAvailable: 0,
  activityHistory: {},
};

const DEFAULT_PROFILE: UserProfile = {
  wallet: undefined,
  displayName: "Learner",
  xp: 0,
  level: 0,
  streak: EMPTY_STREAK,
  achievements: [],
  credentials: [],
  skills: { rust: 0, anchor: 0, frontend: 0, security: 0, defi: 0, mobile: 0 },
  joinedAt: new Date().toISOString(),
  isPublic: true,
};

export function useUser() {
  const { publicKey, connected } = useWallet();
  const { connection } = useConnection();
  const [user, setUser] = useState<UserProfile>(DEFAULT_PROFILE);
  const [loading, setLoading] = useState(false);

  const fetchUserData = useCallback(async () => {
    if (!publicKey) {
      setUser(DEFAULT_PROFILE);
      return;
    }

    setLoading(true);
    const walletAddress = publicKey.toBase58();
    const shortWallet = `${walletAddress.slice(0, 4)}...${walletAddress.slice(-4)}`;

    let credentials: Credential[] = [];
    let xp = 0;

    // Fetch on-chain data with individual error isolation
    const [dasResult, enrollmentResult, xpResult] = await Promise.allSettled([
      getCredentialsByOwner(walletAddress),
      getCredentialsFromEnrollments(publicKey, connection),
      getXPBalance(walletAddress),
    ]);

    if (xpResult.status === "fulfilled") xp = xpResult.value;

    const dasCredentials =
      dasResult.status === "fulfilled" ? dasResult.value : [];
    const enrollmentCredentials =
      enrollmentResult.status === "fulfilled" ? enrollmentResult.value : [];

    const dasIds = new Set(dasCredentials.map((c) => c.id));
    credentials = [
      ...dasCredentials,
      ...enrollmentCredentials.filter((c) => !dasIds.has(c.id)),
    ];

    // Fallback: compute XP from localStorage when on-chain returns 0
    if (xp === 0) {
      const localXP = await learningService.getLocalXP(walletAddress);
      if (localXP > 0) xp = localXP;
    }

    const level = calculateLevel(xp);

    // Compute skills from credentials
    const skills: Record<string, number> = {
      rust: 0,
      anchor: 0,
      frontend: 0,
      security: 0,
      defi: 0,
      mobile: 0,
    };
    for (const cred of credentials) {
      skills[cred.track] = Math.min(
        100,
        cred.level * 25 + cred.coursesCompleted * 15,
      );
    }

    // Load streak data from localStorage
    const streak = await learningService.getStreak(walletAddress);

    setUser({
      wallet: shortWallet,
      displayName: shortWallet,
      xp,
      level,
      streak,
      achievements: [],
      credentials,
      skills: skills as UserProfile["skills"],
      joinedAt: new Date().toISOString(),
      isPublic: true,
    });

    setLoading(false);
  }, [publicKey, connection]);

  useEffect(() => {
    fetchUserData();
  }, [fetchUserData]);

  return {
    user,
    loading,
    connected,
    walletAddress: publicKey?.toBase58() ?? null,
    refresh: fetchUserData,
  };
}
