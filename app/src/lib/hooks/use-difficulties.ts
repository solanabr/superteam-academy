"use client";

import { useState, useEffect } from "react";
import { DIFFICULTIES } from "@/lib/constants";
import type { DifficultyMeta } from "@/lib/constants";

/**
 * Client-side hook for difficulty data.
 * Initializes with the hardcoded DIFFICULTIES constant (no hydration mismatch),
 * then fetches from /api/difficulties to get CMS-managed data.
 */
export function useDifficulties(): DifficultyMeta[] {
  const [difficulties, setDifficulties] =
    useState<DifficultyMeta[]>(DIFFICULTIES);

  useEffect(() => {
    fetch("/api/difficulties")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (Array.isArray(data) && data.length > 0) {
          setDifficulties(data);
        }
      })
      .catch(() => {
        // Keep fallback
      });
  }, []);

  return difficulties;
}
