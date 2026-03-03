"use client";

import { useState, useEffect, useCallback } from "react";
import { discussionApi } from "@/lib/services/discussion-api";
import type { ThreadListItem, ThreadListParams, VoteValue } from "@/types";

export function useDiscussionThreads(params: ThreadListParams) {
  const [threads, setThreads] = useState<ThreadListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [isLoadingMore, setIsLoadingMore] = useState(false);

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await discussionApi.listThreads(params);
      setThreads(data.threads);
      setNextCursor(data.nextCursor);
    } catch {
      // swallow
    } finally {
      setIsLoading(false);
    }
  }, [
    params.scope,
    params.category,
    params.lessonId,
    params.sort,
    params.search,
  ]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || isLoadingMore) return;
    setIsLoadingMore(true);
    try {
      const data = await discussionApi.listThreads({
        ...params,
        cursor: nextCursor,
      });
      setThreads((prev) => [...prev, ...data.threads]);
      setNextCursor(data.nextCursor);
    } catch {
      // swallow
    } finally {
      setIsLoadingMore(false);
    }
  }, [nextCursor, isLoadingMore, params]);

  const voteThread = useCallback(
    async (threadId: string, value: VoteValue) => {
      if (value === 0) return;
      // Optimistic update
      setThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const oldVote = t.userVote;
          const newVote: VoteValue = oldVote === value ? 0 : value;
          const scoreDelta = newVote - oldVote;
          return {
            ...t,
            userVote: newVote,
            voteScore: t.voteScore + scoreDelta,
          };
        }),
      );
      try {
        await discussionApi.voteThread(threadId, value);
      } catch {
        fetchThreads(); // revert on failure
      }
    },
    [fetchThreads],
  );

  return {
    threads,
    isLoading,
    nextCursor,
    isLoadingMore,
    loadMore,
    voteThread,
    refresh: fetchThreads,
  };
}
