"use client";

import { useEffect, useRef } from "react";
import type { LessonBlock } from "@superteam-lms/types";

/** The same tab does not ask again within this window. */
export const BUILD_WARM_INTERVAL_MS = 5 * 60_000;

const STORAGE_KEY = "superteam:build-warm-at";

function warmedRecently(now: number): boolean {
  try {
    const at = Number(window.sessionStorage.getItem(STORAGE_KEY));
    return at > 0 && at <= now && now - at < BUILD_WARM_INTERVAL_MS;
  } catch {
    return false;
  }
}

function markWarmed(now: number): void {
  try {
    window.sessionStorage.setItem(STORAGE_KEY, String(now));
  } catch {
    // No storage: the per-view guard and the route's own limit still hold.
  }
}

/**
 * Starts the build server while the learner reads, so their first build
 * doesn't wait for it. Fires once per page view, after render, and only for a
 * signed-in learner on a lesson that has a buildable code block. The answer
 * and any failure are ignored: nothing here may block or change the page.
 */
export function useBuildWarmup({
  signedIn,
  blocks,
}: {
  signedIn: boolean;
  blocks: readonly LessonBlock[];
}): void {
  const enabled =
    signedIn &&
    blocks.some((b) => b._type === "code" && b.buildType === "buildable");
  const firedRef = useRef(false);

  useEffect(() => {
    if (!enabled || firedRef.current) return;

    const fire = () => {
      if (firedRef.current) return;
      firedRef.current = true;
      const now = Date.now();
      if (warmedRecently(now)) return;
      markWarmed(now);
      try {
        void fetch("/api/build-program/warm", { method: "POST" }).catch(
          () => {}
        );
      } catch {
        // Fire-and-forget.
      }
    };

    if (typeof window.requestIdleCallback === "function") {
      const id = window.requestIdleCallback(fire, { timeout: 2_000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(fire, 0);
    return () => window.clearTimeout(id);
  }, [enabled]);
}
