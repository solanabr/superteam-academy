"use client";

import { useEffect } from "react";
import { refreshAuth } from "@dynamic-labs-sdk/client";
import { getDynamicClient } from "@/lib/dynamic/client";

/**
 * Keep the Dynamic session alive while the learner is using the app.
 *
 * In JWT mode Dynamic does not refresh the session for us: the SDK sets a
 * timer, and when it fires it simply logs the learner out. A learner who
 * leaves a tab open over lunch comes back signed out of their wallet — with no
 * event to notice on a reload, which is what made the expiry so hard to
 * recover from in the first place.
 *
 * Prevention, not the fix: the reauth prompt still has to exist for the cases
 * this cannot catch (tab closed the whole time, refresh itself refused). So
 * every failure here is swallowed — a refused refresh means the session is
 * over, and the SDK raises its own `logout` event for that, which
 * `useDynamicSessionState` is already listening to.
 *
 * Throttled at MODULE scope, not per instance: a scoped provider stack
 * (`ScopedAuthProviders`) can mount a second copy of this on a page that
 * already has one, and two refreshes a second apart would be pointless load.
 */
const INTERVAL_MS = 30 * 60_000;
const MIN_GAP_MS = 5 * 60_000;

let lastRefreshAt = 0;

export function DynamicSessionKeepalive() {
  useEffect(() => {
    const tick = () => {
      // A hidden tab is not a learner about to act; the focus listener covers
      // the moment they come back.
      if (document.visibilityState === "hidden") return;

      const client = getDynamicClient();
      // No user means there is no session to keep alive — including the whole
      // external-wallet population, who never touch Dynamic.
      if (!client?.user) return;

      const now = Date.now();
      if (now - lastRefreshAt < MIN_GAP_MS) return;
      lastRefreshAt = now;

      void refreshAuth(client).catch(() => {
        // Best-effort by design — see the docblock.
      });
    };

    window.addEventListener("focus", tick);
    document.addEventListener("visibilitychange", tick);
    const interval = window.setInterval(tick, INTERVAL_MS);
    tick();

    return () => {
      window.removeEventListener("focus", tick);
      document.removeEventListener("visibilitychange", tick);
      window.clearInterval(interval);
    };
  }, []);

  return null;
}
