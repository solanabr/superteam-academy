"use client";

import { useEffect, useRef } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
import { trackCredentialMinted } from "@/lib/analytics/events";
import { createClient } from "@/lib/supabase/client";
import {
  claimQuestRewardFromCredit,
  QUEST_XP_REASON_PREFIX,
} from "@/lib/gamification/server-xp-feedback";
import {
  dispatchAchievementUnlock,
  dispatchAchievementXp,
} from "@/components/gamification/achievement-unlock";
import { dispatchCertificateMinted } from "@/components/gamification/certificate-popup";
import { dispatchLevelUp } from "@/components/gamification/level-up-popup";
import { dispatchQuestReward } from "@/components/gamification/quest-reward-toast";

let xpEventCounter = 0;

export function dispatchXpGain(amount: number): void {
  if (typeof window === "undefined") return;
  xpEventCounter++;
  window.dispatchEvent(
    new CustomEvent("xp-gain", {
      detail: { amount, id: xpEventCounter },
    })
  );
}

/**
 * Subscribe to Supabase Realtime for gamification events.
 * Dispatches browser CustomEvents that the existing popup components listen to.
 *
 * Level-up detection uses a local ref instead of payload.old because Supabase
 * Realtime UPDATE events only include old PK columns without REPLICA IDENTITY FULL.
 * The ref comparison is also what dedupes the popup per level: only a strict
 * increase dispatches, so repeated UPDATEs at the same level (and a remount or
 * page refresh, which re-seeds the ref from the CURRENT level) are silent.
 *
 * The header's optimistic level badge also moves on xp-gain. Both signals
 * firing is intended: the badge is ambient, the popup is the moment.
 */
export function useGamificationEvents(userId: string | undefined) {
  const lastKnownLevelRef = useRef<number | null>(null);
  // Deduplicate Realtime events — Supabase may deliver the same row multiple
  // times (e.g. React Strict Mode double-mount, reconnection replays).
  const seenIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!userId) return;

    const supabase = createClient();
    // The effect is async now (we await the session before subscribing), so a
    // component that unmounts mid-await must not leave a dangling channel or
    // subscribe after teardown. `cancelled` guards the await points; `channel`
    // is assigned only once the socket is authed and subscribed.
    let cancelled = false;
    let channel: RealtimeChannel | null = null;

    // Seed the ref with the current level so the first UPDATE doesn't false-trigger.
    // Guard: only write the seed if no Realtime event has already set the ref —
    // a stale seed overwriting a newer Realtime value causes false level-ups.
    supabase
      .from("user_xp")
      .select("level")
      .eq("user_id", userId)
      .maybeSingle()
      .then(({ data }) => {
        if (data && lastKnownLevelRef.current === null) {
          lastKnownLevelRef.current = data.level ?? 0;
        }
      });

    // Monotonic guard against a stale-token race: bumped every time a token is
    // pushed to the socket. If a TOKEN_REFRESHED lands while connect()'s
    // getSession() is in flight, the auth listener pushes the newer token and
    // bumps this; connect() then sees the generation moved and must NOT
    // overwrite the socket with the older token it captured before the refresh.
    let authGeneration = 0;

    // Push a JWT to the Realtime socket. setAuth's rejection contract isn't
    // guaranteed across supabase-js versions, so swallow rejections — a failed
    // re-auth must never surface as unhandled-rejection noise.
    function pushRealtimeAuth(token: string): Promise<void> {
      authGeneration += 1;
      return supabase.realtime.setAuth(token).catch(() => {});
    }

    // Authenticate the Realtime socket BEFORE subscribing. The browser client's
    // socket otherwise joins as `anon`, and own-row RLS on xp_transactions (and
    // the other gamification tables) then filters every event server-side while
    // the channel still reports SUBSCRIBED — so no popup ever fires. Awaiting
    // the session here also closes a hydration race: the subscribe used to run
    // synchronously on mount, before the cookie session had been recovered.
    async function connect() {
      const generationBefore = authGeneration;
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (cancelled) return;
      // No session → leave the socket anon (graceful degrade); own-row RLS
      // yields nothing but the hook still subscribes without erroring. Skip the
      // push if a fresher token was applied by the auth listener while
      // getSession() was in flight — reverting to this now-stale token would
      // silently de-auth the socket until the next refresh.
      if (session?.access_token && authGeneration === generationBefore) {
        await pushRealtimeAuth(session.access_token);
        if (cancelled) return;
      }

      channel = supabase
        .channel(`gamification:${userId}`)
        // XP changes → detect level-up via local ref comparison
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table: "user_xp",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const newLevel = (payload.new as { level?: number }).level ?? 0;
            const previousLevel = lastKnownLevelRef.current;
            // Only celebrate a genuine increase — the ref starts null until the
            // seed query resolves, so the first UPDATE can't false-trigger.
            if (previousLevel !== null && newLevel > previousLevel) {
              dispatchLevelUp(newLevel);
            }
            lastKnownLevelRef.current = newLevel;
          }
        )
        // New XP transactions → XP popup (or enrich achievement popup)
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "xp_transactions",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as {
              id?: string;
              amount?: number;
              reason?: string;
              tx_signature?: string;
              idempotency_key?: string;
              created_at?: string;
            };

            // Deduplicate by row id (primary defence) or tx_signature (fallback)
            const dedupeKey = row.id ?? row.tx_signature;
            if (dedupeKey) {
              if (seenIdsRef.current.has(dedupeKey)) return;
              seenIdsRef.current.add(dedupeKey);
              setTimeout(() => seenIdsRef.current.delete(dedupeKey), 15_000);
            }

            const amount = row.amount;
            if (!amount || amount <= 0) return;

            // Achievement XP → enrich the achievement popup instead of separate XP popup
            const achievementMatch = row.reason?.match(
              /^Achievement reward: (.+)$/
            );
            if (achievementMatch?.[1]) {
              dispatchAchievementXp(achievementMatch[1], amount);
              dispatchXpGain(amount);
              return;
            }

            // Daily quest XP → celebrate wherever the learner is.
            //
            // Quest evaluation runs from the ACTION paths (lesson complete,
            // review grade, test-out, the completion webhook), so the award
            // routinely lands while the learner is on a lesson page — deferring
            // to the dashboard's quests panel would make it silent there.
            //
            // claimQuestRewardFromCredit is the SAME session-wide seen-set the
            // poll path claims through (keyed questId + period, with the period
            // read off the queue row's idempotency_key), so whichever channel
            // observes the award first toasts and the other is a no-op — the
            // two can never double-toast one reward.
            if (row.reason?.startsWith(QUEST_XP_REASON_PREFIX)) {
              const questId = claimQuestRewardFromCredit(row, userId);
              if (questId) {
                dispatchQuestReward({ questId, xpReward: amount });
                // The counter bump belongs to the channel that WON the claim,
                // never to both. The header's optimistic XP is a monotonic
                // `Math.max(supabaseXp, prev + amount)` that never pulls back
                // down, so dispatching here when the poll path already counted
                // this same credit would permanently inflate the displayed XP
                // for the session. The poll path mirrors this: it only bumps
                // for entries pickQuestRewardToasts actually claimed.
                dispatchXpGain(amount);
              }
              return;
            }

            // Any other credit (including a historical `surprise_bonus:` row,
            // now that the bonus itself is retired) just moves the XP counter —
            // no popup, no celebration.
            dispatchXpGain(amount);
          }
        )
        // New achievements → achievement popup
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "user_achievements",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as {
              id?: string;
              achievement_id?: string;
            };
            const key = row.id ?? row.achievement_id;
            if (key) {
              if (seenIdsRef.current.has(key)) return;
              seenIdsRef.current.add(key);
              setTimeout(() => seenIdsRef.current.delete(key), 15_000);
            }
            if (row.achievement_id) {
              const displayName = row.achievement_id
                .replace(/_/g, " ")
                .replace(/\b\w/g, (c) => c.toUpperCase());
              dispatchAchievementUnlock(row.achievement_id, displayName);
            }
          }
        )
        // New certificates → certificate popup
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "certificates",
            filter: `user_id=eq.${userId}`,
          },
          (payload) => {
            const row = payload.new as { id?: string; course_id?: string };
            if (!row.id) return;
            if (seenIdsRef.current.has(row.id)) return;
            seenIdsRef.current.add(row.id);
            const certId = row.id;
            setTimeout(() => seenIdsRef.current.delete(certId), 15_000);
            // credential_minted baseline (LX-F1) — the helper dedupes per
            // course, so the manual-mint success firing moments earlier (or
            // later) never double-counts the same mint.
            if (row.course_id) {
              trackCredentialMinted(row.course_id, "realtime");
            }
            dispatchCertificateMinted(certId);
          }
        )
        .subscribe();
    }
    // getSession() can reject; swallow so the initial connect can't surface as
    // unhandled-rejection noise (the setAuth push inside is already guarded).
    connect().catch(() => {});

    // Keep the socket authed across the page's lifetime. When GoTrue rotates
    // the JWT (TOKEN_REFRESHED) or a sign-in completes on this page (SIGNED_IN),
    // re-set the Realtime token so the connection doesn't silently fall back to
    // filtering everything. This callback must stay synchronous — GoTrue awaits
    // onAuthStateChange callbacks during init, and an async body that reached
    // getSession would deadlock; setAuth takes the token straight off the event.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event !== "TOKEN_REFRESHED" && event !== "SIGNED_IN") return;
      if (session?.access_token) {
        // pushRealtimeAuth swallows rejections internally, so the floating
        // promise here can never become unhandled-rejection noise.
        void pushRealtimeAuth(session.access_token);
      }
    });

    const seenIds = seenIdsRef.current;
    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (channel) supabase.removeChannel(channel);
      seenIds.clear();
    };
  }, [userId]);
}
