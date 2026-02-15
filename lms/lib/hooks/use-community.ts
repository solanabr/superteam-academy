"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useWallet } from "@solana/wallet-adapter-react";
import { getService } from "@/lib/services";

export function useThreads(params?: { type?: string; tag?: string; sort?: string; page?: number }) {
  return useQuery({
    queryKey: ["threads", params],
    queryFn: () => getService().getThreads(params),
    staleTime: 10_000,
  });
}

export function useThread(id: string) {
  return useQuery({
    queryKey: ["thread", id],
    queryFn: () => getService().getThread(id),
    enabled: !!id,
    staleTime: 10_000,
  });
}

export function useReplies(threadId: string) {
  return useQuery({
    queryKey: ["replies", threadId],
    queryFn: () => getService().getReplies(threadId),
    enabled: !!threadId,
    staleTime: 10_000,
  });
}

export function useEndorsements() {
  const { publicKey } = useWallet();
  const wallet = publicKey?.toBase58() ?? "";

  return useQuery({
    queryKey: ["endorsements", wallet],
    queryFn: () => getService().getEndorsements(wallet),
    enabled: !!publicKey,
    staleTime: 30_000,
  });
}

export function useCommunityStats() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";

  return useQuery({
    queryKey: ["communityStats", userId],
    queryFn: () => getService().getCommunityStats(userId),
    enabled: !!publicKey,
    staleTime: 10_000,
  });
}

export function useCreateThread() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ title, body, type, tags }: { title: string; body: string; type: string; tags: string[] }) =>
      getService().createThread(userId, title, body, type, tags),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["communityStats"] });
    },
  });
}

export function useCreateReply() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, body }: { threadId: string; body: string }) =>
      getService().createReply(userId, threadId, body),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["replies", variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["thread", variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["communityStats"] });
    },
  });
}

export function useUpvote() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ targetId, targetType }: { targetId: string; targetType: "thread" | "reply" }) =>
      getService().upvote(userId, targetId, targetType),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["thread"] });
      queryClient.invalidateQueries({ queryKey: ["replies"] });
    },
  });
}

export function useMarkSolution() {
  const { publicKey } = useWallet();
  const userId = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ threadId, replyId }: { threadId: string; replyId: string }) =>
      getService().markSolution(userId, threadId, replyId),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["thread", variables.threadId] });
      queryClient.invalidateQueries({ queryKey: ["threads"] });
      queryClient.invalidateQueries({ queryKey: ["communityStats"] });
    },
  });
}

export function useEndorseUser() {
  const { publicKey } = useWallet();
  const endorser = publicKey?.toBase58() ?? "guest";
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ endorsee, message }: { endorsee: string; message?: string }) =>
      getService().endorseUser(endorser, endorsee, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["endorsements"] });
      queryClient.invalidateQueries({ queryKey: ["communityStats"] });
    },
  });
}
