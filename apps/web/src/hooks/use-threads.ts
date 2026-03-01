"use client";

import { useState, useEffect, useCallback } from "react";

interface ThreadScope {
  categorySlug?: string;
  courseId?: string;
  lessonId?: string;
}

interface UseThreadsParams {
  scope?: ThreadScope;
  sort?: string;
  type?: string;
  limit?: number;
}

interface ThreadData {
  id: string;
  title: string;
  slug: string;
  short_id: string;
  type: "question" | "discussion";
  is_solved: boolean;
  is_pinned: boolean;
  vote_score: number;
  answer_count: number;
  view_count: number;
  created_at: string;
  last_activity_at: string;
  author_id: string;
  category: { id: string; name: string; slug: string } | null;
  author: { username: string | null; avatar_url: string | null; level: number };
  userVote: 1 | -1 | null;
}

interface UseThreadsReturn {
  threads: ThreadData[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  loadMore: () => void;
}

export function useThreads({
  scope,
  sort = "latest",
  type,
  limit = 20,
}: UseThreadsParams = {}): UseThreadsReturn {
  const [threads, setThreads] = useState<ThreadData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cursor, setCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(false);

  const fetchThreads = useCallback(
    async (currentCursor?: string | null) => {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (scope?.categorySlug) params.set("category", scope.categorySlug);
      if (scope?.courseId) params.set("courseId", scope.courseId);
      if (scope?.lessonId) params.set("lessonId", scope.lessonId);
      params.set("sort", sort);
      if (type) params.set("type", type);
      params.set("limit", String(limit));
      if (currentCursor) params.set("cursor", currentCursor);

      try {
        const res = await fetch(`/api/community/threads?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to fetch threads");
        const data = await res.json();

        if (currentCursor) {
          setThreads((prev) => [...prev, ...data.threads]);
        } else {
          setThreads(data.threads);
        }
        setCursor(data.nextCursor);
        setHasMore(!!data.nextCursor);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch threads"
        );
      } finally {
        setIsLoading(false);
      }
    },
    [scope?.categorySlug, scope?.courseId, scope?.lessonId, sort, type, limit]
  );

  useEffect(() => {
    setCursor(null);
    fetchThreads(null);
  }, [fetchThreads]);

  const loadMore = useCallback(() => {
    if (cursor && !isLoading) {
      fetchThreads(cursor);
    }
  }, [cursor, isLoading, fetchThreads]);

  return { threads, isLoading, error, hasMore, loadMore };
}
