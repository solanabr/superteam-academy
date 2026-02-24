"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Thread } from "@/lib/supabase/types";

interface UseThreadsOptions {
  category?: string;
  courseId?: string;
  search?: string;
}

const PAGE_SIZE = 20;

export function useThreads(filters?: UseThreadsOptions) {
  const [threads, setThreads] = useState<Thread[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [hasMore, setHasMore] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const fetchThreads = useCallback(
    async (pageNum: number, append: boolean) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (!append) setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        params.set("page", String(pageNum));
        params.set("limit", String(PAGE_SIZE));
        if (filters?.category && filters.category !== "all") {
          params.set("category", filters.category);
        }
        if (filters?.courseId) {
          params.set("course_id", filters.courseId);
        }
        if (filters?.search) {
          params.set("search", filters.search);
        }

        const res = await fetch(`/api/community/threads?${params.toString()}`, {
          signal: controller.signal,
        });
        if (!res.ok) {
          const data = await res.json().catch(() => ({}));
          throw new Error(data.error || "Failed to fetch threads");
        }

        const data = await res.json();
        setThreads((prev) => (append ? [...prev, ...data.threads] : data.threads));
        setTotal(data.total);
        setHasMore(data.hasMore);
        setPage(pageNum);
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError(err instanceof Error ? err.message : "Failed to fetch threads");
      } finally {
        setLoading(false);
      }
    },
    [filters?.category, filters?.courseId, filters?.search],
  );

  useEffect(() => {
    fetchThreads(1, false);
    return () => abortRef.current?.abort();
  }, [fetchThreads]);

  const loadMore = useCallback(() => {
    if (hasMore && !loading) {
      fetchThreads(page + 1, true);
    }
  }, [hasMore, loading, page, fetchThreads]);

  const refresh = useCallback(() => {
    fetchThreads(1, false);
  }, [fetchThreads]);

  return { threads, loading, error, hasMore, total, loadMore, refresh };
}
