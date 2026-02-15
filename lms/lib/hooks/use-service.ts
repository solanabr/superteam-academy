"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet, useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider } from "@coral-xyz/anchor";
import { Transaction } from "@solana/web3.js";
import { getService } from "@/lib/services";
import { getProgram } from "@/lib/solana/program";
import { fetchLearnerProfile, fetchConfig } from "@/lib/solana/readers";
import {
  buildInitLearnerTx,
  buildEnrollTx,
  buildUnenrollTx,
  ensureATAInstruction,
} from "@/lib/solana/transactions";
import { getLearnerTokenAccount } from "@/lib/solana/pda";

export function useXP() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["xp", userId],
    queryFn: () => getService().getXP(userId),
    staleTime: 30_000,
  });
}

export function useLevel() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["level", userId],
    queryFn: () => getService().getLevel(userId),
    staleTime: 30_000,
  });
}

export function useStreak() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["streak", userId],
    queryFn: () => getService().getStreak(userId),
    staleTime: 30_000,
  });
}

export function useProgress(courseId: string) {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["progress", userId, courseId],
    queryFn: () => getService().getProgress(userId, courseId),
    staleTime: 10_000,
  });
}

export function useAllProgress() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["allProgress", userId],
    queryFn: () => getService().getAllProgress(userId),
    staleTime: 10_000,
  });
}

export function useLeaderboard(timeframe: "weekly" | "monthly" | "all-time" = "all-time") {
  return useQuery({
    queryKey: ["leaderboard", timeframe],
    queryFn: () => getService().getLeaderboard(timeframe),
    staleTime: 60_000,
  });
}

export function useCourses() {
  return useQuery({
    queryKey: ["courses"],
    queryFn: () => getService().getCourses(),
    staleTime: 60_000,
  });
}

export function useCourse(courseId: string) {
  return useQuery({
    queryKey: ["course", courseId],
    queryFn: () => getService().getCourse(courseId),
    staleTime: 60_000,
  });
}

export function useAchievements() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["achievements", userId],
    queryFn: () => getService().getAchievements(userId),
    staleTime: 30_000,
  });
}

export function useProfile() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => getService().getProfile(userId),
    enabled: !!publicKey,
    staleTime: 30_000,
  });
}

export function useCredentials() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["credentials", userId],
    queryFn: () => getService().getCredentials(userId),
    enabled: !!publicKey,
    staleTime: 30_000,
  });
}

export function useDisplayName() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["displayName", userId],
    queryFn: () => getService().getDisplayName(userId),
    enabled: !!publicKey,
    staleTime: Infinity,
  });
}

export function useSetDisplayName() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (name: string) => getService().setDisplayName(userId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["displayName", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useBio() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["bio", userId],
    queryFn: () => getService().getBio(userId),
    enabled: !!publicKey,
    staleTime: Infinity,
  });
}

export function useSetBio() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (bio: string) => getService().setBio(userId, bio),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["bio", userId] });
      queryClient.invalidateQueries({ queryKey: ["profile", userId] });
    },
  });
}

export function useUnenroll() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string): Promise<{ txSignature: string | null }> => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      let txSignature: string | null = null;

      // Only attempt on-chain if program is initialized
      const config = await fetchConfig();
      if (config) {
        try {
          const provider = new AnchorProvider(
            connection,
            { publicKey, signTransaction, signAllTransactions: async (txs: any[]) => txs } as any,
            { commitment: "confirmed" }
          );
          const program = getProgram(provider);
          const tx = await buildUnenrollTx(program, publicKey, courseId);
          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signed = await signTransaction(tx);
          txSignature = await connection.sendRawTransaction(signed.serialize());
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (msg.includes("User rejected") || msg.includes("rejected the request")) {
            throw err;
          }
          console.warn("[unenroll] on-chain tx failed, falling back to MongoDB:", msg);
        }
      }

      // Sync to MongoDB
      await getService().unenrollFromCourse(userId, courseId);
      return { txSignature };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProgress", userId] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["courses"] });
    },
  });
}

export function useClaimAchievement() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (achievementId: number) => getService().claimAchievement(userId, achievementId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["achievements", userId] });
      queryClient.invalidateQueries({ queryKey: ["xp", userId] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useEnroll() {
  const { publicKey, signTransaction } = useWallet();
  const { connection } = useConnection();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (courseId: string): Promise<{ txSignature: string | null }> => {
      if (!publicKey || !signTransaction) {
        throw new Error("Wallet not connected");
      }

      let txSignature: string | null = null;

      // Check if program is initialized before prompting wallet
      const config = await fetchConfig();
      if (config) {
        try {
          const provider = new AnchorProvider(
            connection,
            { publicKey, signTransaction, signAllTransactions: async (txs: any[]) => txs } as any,
            { commitment: "confirmed" }
          );
          const program = getProgram(provider);

          const tx = new Transaction();

          // Check if LearnerProfile exists; if not, prepend init_learner
          const profile = await fetchLearnerProfile(publicKey);
          if (!profile) {
            const initTx = await buildInitLearnerTx(program, publicKey);
            tx.add(...initTx.instructions);
          }

          // Ensure Token-2022 ATA exists for XP mint
          const ataIx = await ensureATAInstruction(publicKey, publicKey, config.currentMint);
          if (ataIx) tx.add(ataIx);

          // Add enroll instruction
          const enrollTx = await buildEnrollTx(program, publicKey, courseId);
          tx.add(...enrollTx.instructions);

          tx.feePayer = publicKey;
          tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
          const signed = await signTransaction(tx);
          txSignature = await connection.sendRawTransaction(signed.serialize());
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (msg.includes("User rejected") || msg.includes("rejected the request")) {
            throw err;
          }
          console.warn("[enroll] on-chain tx failed, falling back to MongoDB:", msg);
        }
      }

      // Sync to MongoDB + get memo tx if wallet tx failed
      const result = await getService().enrollInCourse(userId, courseId);
      if (!txSignature && result.txSignature) {
        txSignature = result.txSignature;
      }
      return { txSignature };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allProgress", userId] });
      queryClient.invalidateQueries({ queryKey: ["progress"] });
    },
  });
}

export function useCompleteLesson() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ courseId, lessonIndex }: { courseId: string; lessonIndex: number }) => {
      return getService().completeLesson(userId, courseId, lessonIndex);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["allProgress"] });
      queryClient.invalidateQueries({ queryKey: ["xp"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      queryClient.invalidateQueries({ queryKey: ["certificates"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function useCertificates(trackId: number) {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery({
    queryKey: ["certificates", wallet, trackId],
    queryFn: () =>
      fetch(`/api/learning/certificates/${trackId}?wallet=${wallet}`).then(
        (r) => r.json()
      ) as Promise<
        {
          wallet: string;
          courseId: string;
          courseTitle: string;
          trackId: number;
          xpEarned: number;
          txHash: string;
          issuedAt: string;
        }[]
      >,
    enabled: !!publicKey,
    staleTime: 30_000,
  });
}

export function usePracticeProgress() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  const query = useQuery({
    queryKey: ["practiceProgress", userId],
    queryFn: () => getService().getPracticeProgress(userId),
    staleTime: 10_000,
  });

  return {
    ...query,
    completed: query.data?.completed ?? [],
    txHashes: query.data?.txHashes ?? {},
  };
}

export function useCompletePracticeChallenge() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ challengeId, xpReward }: { challengeId: string; xpReward: number }) =>
      getService().completePracticeChallenge(userId, challengeId, xpReward),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["practiceProgress"] });
      queryClient.invalidateQueries({ queryKey: ["xp"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}
