"use client";

import { useState, useEffect, useCallback } from "react";
import { useConnection } from "@solana/wallet-adapter-react";
import { fetchCourse } from "../academy-reads";
import { PROGRAM_ID } from "../pda";

interface UseOnChainCourseResult {
  course: Record<string, unknown> | null;
  isLoading: boolean;
  error: string | null;
}

export function useOnChainCourse(courseId: string): UseOnChainCourseResult {
  const { connection } = useConnection();
  const [course, setCourse] = useState<Record<string, unknown> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    if (!courseId) {
      setCourse(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const data = await fetchCourse(courseId, connection, PROGRAM_ID);
      setCourse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch course");
      setCourse(null);
    } finally {
      setIsLoading(false);
    }
  }, [courseId, connection]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { course, isLoading, error };
}
