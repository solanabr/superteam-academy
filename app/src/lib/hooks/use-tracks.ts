"use client";

import { useState, useEffect } from "react";
import { TRACKS } from "@/lib/constants";
import type { TrackMeta } from "@/lib/tracks-service";

/**
 * Client-side hook for tracks data.
 * Initializes with the hardcoded TRACKS constant (no hydration mismatch),
 * then fetches from /api/tracks to get CMS-managed data.
 */
export function useTracks(): Record<number, TrackMeta> {
  const [tracks, setTracks] = useState<Record<number, TrackMeta>>(TRACKS);

  useEffect(() => {
    fetch("/api/tracks")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && typeof data === "object" && Object.keys(data).length > 0) {
          setTracks(data);
        }
      })
      .catch(() => {
        // Keep fallback
      });
  }, []);

  return tracks;
}
