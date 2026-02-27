"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  fetchActivityFeed,
  type ActivityEvent,
} from "@/lib/services/activity-feed-service";

const fallbackEvents: ActivityEvent[] = [
  {
    type: "lesson_complete",
    user: "EsyB...P4Ub",
    detail: "Completed Intro to Anchor",
    xp: 40,
    timestamp: Date.now() - 120_000,
    signature: "mock-1",
  },
  {
    type: "course_finalize",
    user: "CryptoKing",
    detail: "Finalized Rust Fundamentals",
    xp: 500,
    timestamp: Date.now() - 300_000,
    signature: "mock-2",
  },
  {
    type: "xp_earned",
    user: "Sol_Dev42",
    detail: "Earned XP for lesson completion",
    xp: 60,
    timestamp: Date.now() - 480_000,
    signature: "mock-3",
  },
];

export function useActivityFeed(intervalMs = 30_000) {
  const [events, setEvents] = useState<ActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await fetchActivityFeed();
      if (data.length > 0) {
        setEvents(data);
        setError(null);
      } else {
        setEvents(fallbackEvents);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch feed");
      setEvents(fallbackEvents);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();

    intervalRef.current = setInterval(load, intervalMs);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [load, intervalMs]);

  return { events, loading, error };
}
