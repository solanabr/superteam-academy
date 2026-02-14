"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getService } from "@/lib/services";

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
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => getService().unenrollFromCourse(userId, courseId),
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
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (courseId: string) => getService().enrollInCourse(userId, courseId),
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
    mutationFn: ({ courseId, lessonIndex }: { courseId: string; lessonIndex: number }) =>
      getService().completeLesson(userId, courseId, lessonIndex),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["progress"] });
      queryClient.invalidateQueries({ queryKey: ["allProgress"] });
      queryClient.invalidateQueries({ queryKey: ["xp"] });
      queryClient.invalidateQueries({ queryKey: ["streak"] });
      queryClient.invalidateQueries({ queryKey: ["credentials"] });
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
    },
  });
}

export function usePracticeProgress() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["practiceProgress", userId],
    queryFn: () => getService().getPracticeProgress(userId),
    staleTime: 10_000,
  });
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
