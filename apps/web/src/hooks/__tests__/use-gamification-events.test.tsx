// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import type { DailyQuest } from "@superteam-lms/types";
import {
  resetAnalyticsEventDedupeForTests,
  trackCredentialMinted,
} from "@/lib/analytics/events";
import {
  pickSurpriseBonusToasts,
  pickQuestRewardToasts,
  __resetServerXpFeedbackForTests,
} from "@/lib/gamification/server-xp-feedback";
import { useGamificationEvents } from "../use-gamification-events";

// Real events + server-xp-feedback modules between hook and facades — asserts
// the wire format, the cross-path dedupe with the manual-mint observation, AND
// the shared surprise-bonus dedupe with the #796 dashboard poll.
const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  dispatchCertificateMinted: vi.fn(),
  dispatchLevelUp: vi.fn(),
  // Level seeded by the hook's `user_xp` select; null = no row (ref stays null,
  // so the first UPDATE cannot false-trigger).
  seedLevel: null as number | null,
  dispatchSurpriseBonus: vi.fn(),
  dispatchQuestReward: vi.fn(),
  handlers: new Map<string, (payload: unknown) => void>(),
  // Realtime auth plumbing (#800)
  getSession: vi.fn(),
  setAuth: vi.fn(async (_token?: string | null) => {}),
  authCallback: null as ((event: string, session: unknown) => void) | null,
  authUnsubscribe: vi.fn(),
  // Ordered log of auth/subscribe operations so tests can assert setAuth
  // happens BEFORE subscribe.
  order: [] as string[],
}));

vi.mock("@/lib/analytics", () => ({ trackEvent: h.trackEvent }));

vi.mock("@/components/gamification/achievement-popup", () => ({
  dispatchAchievementUnlock: vi.fn(),
  dispatchAchievementXp: vi.fn(),
}));
vi.mock("@/components/gamification/certificate-popup", () => ({
  dispatchCertificateMinted: h.dispatchCertificateMinted,
}));
vi.mock("@/components/gamification/level-up-popup", () => ({
  dispatchLevelUp: h.dispatchLevelUp,
}));
vi.mock("@/components/gamification/surprise-bonus-toast", () => ({
  dispatchSurpriseBonus: h.dispatchSurpriseBonus,
}));
vi.mock("@/components/gamification/quest-reward-toast", () => ({
  dispatchQuestReward: h.dispatchQuestReward,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: () => {
    const channel = {
      on: (
        _type: string,
        filter: { table: string; event: string },
        callback: (payload: unknown) => void
      ) => {
        h.handlers.set(`${filter.table}:${filter.event}`, callback);
        return channel;
      },
      subscribe: () => {
        h.order.push("subscribe");
        return channel;
      },
    };
    return {
      from: () => ({
        select: () => ({
          eq: () => ({
            maybeSingle: () =>
              Promise.resolve({
                data: h.seedLevel === null ? null : { level: h.seedLevel },
              }),
          }),
        }),
      }),
      channel: () => channel,
      removeChannel: vi.fn(),
      auth: {
        getSession: h.getSession,
        onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
          h.authCallback = cb;
          return {
            data: { subscription: { unsubscribe: h.authUnsubscribe } },
          };
        },
      },
      realtime: {
        setAuth: (token?: string | null) => {
          h.order.push(`setAuth:${token}`);
          return h.setAuth(token);
        },
      },
    };
  },
}));

const SESSION = {
  data: { session: { access_token: "tok-1", user: { id: "user-1" } } },
};

function certInsert(id: string, courseId: string): unknown {
  return { new: { id, course_id: courseId, user_id: "user-1" } };
}

async function mountHook(userId = "user-1") {
  const utils = renderHook(() => useGamificationEvents(userId));
  // The effect is async (getSession → setAuth → subscribe). Wait on the
  // observable end-state (the channel subscribed) rather than a fixed number of
  // microtask ticks — that way an added await in connect() fails loudly here
  // (subscribe never observed → timeout) instead of silently under-flushing.
  await waitFor(() => expect(h.order).toContain("subscribe"));
  return utils;
}

async function waitForHandler(
  key: string
): Promise<(payload: unknown) => void> {
  let cb: ((payload: unknown) => void) | undefined;
  await waitFor(() => {
    cb = h.handlers.get(key);
    expect(cb).toBeDefined();
  });
  return cb as (payload: unknown) => void;
}

/** Counts the `xp-gain` CustomEvents dispatchXpGain puts on the window. */
function countXpGains(): { count: () => number; stop: () => void } {
  let n = 0;
  const onGain = () => {
    n += 1;
  };
  window.addEventListener("xp-gain", onGain);
  return {
    count: () => n,
    stop: () => window.removeEventListener("xp-gain", onGain),
  };
}

beforeEach(() => {
  h.trackEvent.mockClear();
  h.dispatchCertificateMinted.mockClear();
  h.dispatchLevelUp.mockClear();
  h.seedLevel = null;
  h.dispatchSurpriseBonus.mockClear();
  h.dispatchQuestReward.mockClear();
  h.setAuth.mockClear();
  h.authUnsubscribe.mockClear();
  h.getSession.mockReset();
  h.getSession.mockResolvedValue(SESSION);
  h.authCallback = null;
  h.handlers.clear();
  h.order.length = 0;
  resetAnalyticsEventDedupeForTests();
  __resetServerXpFeedbackForTests();
});

describe("useGamificationEvents — Realtime socket auth (#800)", () => {
  it("calls realtime.setAuth with the session token BEFORE subscribing", async () => {
    await mountHook();
    await waitFor(() => expect(h.order).toContain("subscribe"));

    expect(h.setAuth).toHaveBeenCalledWith("tok-1");
    const setAuthIdx = h.order.indexOf("setAuth:tok-1");
    const subscribeIdx = h.order.indexOf("subscribe");
    expect(setAuthIdx).toBeGreaterThanOrEqual(0);
    expect(subscribeIdx).toBeGreaterThan(setAuthIdx);
  });

  it("re-authenticates the socket on TOKEN_REFRESHED and SIGNED_IN", async () => {
    await mountHook();
    await waitFor(() => expect(h.authCallback).toBeTypeOf("function"));
    h.setAuth.mockClear();

    act(() =>
      h.authCallback?.("TOKEN_REFRESHED", {
        access_token: "tok-2",
        user: { id: "user-1" },
      })
    );
    expect(h.setAuth).toHaveBeenCalledWith("tok-2");

    act(() =>
      h.authCallback?.("SIGNED_IN", {
        access_token: "tok-3",
        user: { id: "user-1" },
      })
    );
    expect(h.setAuth).toHaveBeenCalledWith("tok-3");

    // Unrelated events (e.g. SIGNED_OUT) must not re-set the socket token.
    h.setAuth.mockClear();
    act(() => h.authCallback?.("SIGNED_OUT", null));
    expect(h.setAuth).not.toHaveBeenCalled();
  });

  it("unsubscribes the auth listener on cleanup", async () => {
    const { unmount } = await mountHook();
    await waitFor(() => expect(h.authCallback).toBeTypeOf("function"));
    unmount();
    expect(h.authUnsubscribe).toHaveBeenCalledTimes(1);
  });

  it("degrades gracefully with no session: no setAuth, still subscribes", async () => {
    h.getSession.mockResolvedValue({ data: { session: null } });
    await mountHook();
    await waitFor(() => expect(h.order).toContain("subscribe"));
    expect(h.setAuth).not.toHaveBeenCalled();
  });

  it("does not revert the socket to a stale token when a refresh races a slow getSession", async () => {
    // Hold getSession() open so connect() is suspended mid-await, then land a
    // TOKEN_REFRESHED before it resolves. connect() must not overwrite the
    // fresher token with the pre-refresh one it captured (#806 stale-token race).
    let resolveSession!: (value: unknown) => void;
    h.getSession.mockReturnValue(
      new Promise((resolve) => {
        resolveSession = resolve;
      })
    );

    renderHook(() => useGamificationEvents("user-1"));
    // The auth listener registers synchronously while connect() awaits getSession.
    await waitFor(() => expect(h.authCallback).toBeTypeOf("function"));

    // Refresh lands while getSession is still in flight → newer token applied.
    act(() =>
      h.authCallback?.("TOKEN_REFRESHED", {
        access_token: "tok-new",
        user: { id: "user-1" },
      })
    );
    expect(h.setAuth).toHaveBeenCalledWith("tok-new");

    // getSession finally resolves with the PRE-refresh (now stale) token.
    await act(async () => {
      resolveSession({
        data: {
          session: { access_token: "tok-stale", user: { id: "user-1" } },
        },
      });
      await Promise.resolve();
      await Promise.resolve();
    });
    await waitFor(() => expect(h.order).toContain("subscribe"));

    // The socket must remain on the newer token: the stale one is never pushed,
    // and the last token applied is the refreshed one.
    expect(h.setAuth).not.toHaveBeenCalledWith("tok-stale");
    const appliedTokens = h.order
      .filter((entry) => entry.startsWith("setAuth:"))
      .map((entry) => entry.slice("setAuth:".length));
    expect(appliedTokens.at(-1)).toBe("tok-new");
  });
});

describe("useGamificationEvents — credential_minted (Realtime INSERT path)", () => {
  it("fires credential_minted with the row's course id on a certificates INSERT", async () => {
    await mountHook();
    const onCertInsert = await waitForHandler("certificates:INSERT");

    act(() => onCertInsert(certInsert("cert-1", "course-solana-101")));

    expect(h.trackEvent).toHaveBeenCalledTimes(1);
    expect(h.trackEvent).toHaveBeenCalledWith("credential_minted", {
      courseId: "course-solana-101",
      source: "realtime",
    });
    expect(h.dispatchCertificateMinted).toHaveBeenCalledWith("cert-1");
  });

  it("ignores Realtime replays of the same row", async () => {
    await mountHook();
    const onCertInsert = await waitForHandler("certificates:INSERT");

    act(() => onCertInsert(certInsert("cert-1", "course-solana-101")));
    act(() => onCertInsert(certInsert("cert-1", "course-solana-101")));

    expect(h.trackEvent).toHaveBeenCalledTimes(1);
    expect(h.dispatchCertificateMinted).toHaveBeenCalledTimes(1);
  });

  it("does not double-fire when the manual mint already observed this mint", async () => {
    await mountHook();
    const onCertInsert = await waitForHandler("certificates:INSERT");

    // Manual-mint success (course-completion-mint.tsx) fired moments earlier.
    trackCredentialMinted("course-solana-101", "manual_mint");
    act(() => onCertInsert(certInsert("cert-1", "course-solana-101")));

    const mintEvents = h.trackEvent.mock.calls.filter(
      (call) => call[0] === "credential_minted"
    );
    expect(mintEvents).toHaveLength(1);
    expect(mintEvents[0]?.[1]).toEqual({
      courseId: "course-solana-101",
      source: "manual_mint",
    });
    // The popup still shows — only the analytics event is deduped.
    expect(h.dispatchCertificateMinted).toHaveBeenCalledWith("cert-1");
  });
});

describe("useGamificationEvents — level-up popup (restored 2026-08-01)", () => {
  /**
   * Mounts with `level` as the established last-known level and returns the
   * user_xp handler. The seed select supplies it, and the same-level UPDATE
   * below pins the ref to it regardless of seed timing (every UPDATE writes the
   * ref) — so these tests never race the seed query.
   */
  async function mountSeeded(level: number) {
    h.seedLevel = level;
    await mountHook();
    const onXpUpdate = await waitForHandler("user_xp:UPDATE");
    act(() => onXpUpdate({ new: { level } }));
    h.dispatchLevelUp.mockClear();
    return onXpUpdate;
  }

  it("seeds the ref from user_xp so the FIRST UPDATE after sign-in can level up", async () => {
    // No priming UPDATE here: the seed query is the only thing that could have
    // set the baseline, so this asserts the seed path itself.
    h.seedLevel = 3;
    await mountHook();
    const onXpUpdate = await waitForHandler("user_xp:UPDATE");

    act(() => onXpUpdate({ new: { level: 4 } }));

    expect(h.dispatchLevelUp).toHaveBeenCalledTimes(1);
    expect(h.dispatchLevelUp).toHaveBeenCalledWith(4);
  });

  it("dispatches exactly ONE level-up when an xp UPDATE crosses a level boundary", async () => {
    const onXpUpdate = await mountSeeded(3);

    act(() => onXpUpdate({ new: { level: 4 } }));

    expect(h.dispatchLevelUp).toHaveBeenCalledTimes(1);
    expect(h.dispatchLevelUp).toHaveBeenCalledWith(4);
  });

  it("dispatches nothing for an xp UPDATE that stays on the same level", async () => {
    const onXpUpdate = await mountSeeded(3);

    // XP moved (most lesson completions do this) but the level did not.
    act(() => onXpUpdate({ new: { level: 3 } }));
    act(() => onXpUpdate({ new: { level: 3 } }));

    expect(h.dispatchLevelUp).not.toHaveBeenCalled();
  });

  it("dedupes per level: a replayed UPDATE at the new level is silent", async () => {
    const onXpUpdate = await mountSeeded(3);

    act(() => onXpUpdate({ new: { level: 4 } }));
    // Realtime replay / reconnection redelivery of the same row.
    act(() => onXpUpdate({ new: { level: 4 } }));

    expect(h.dispatchLevelUp).toHaveBeenCalledTimes(1);
  });

  it("never fires on mount before the seed resolves (no false level-up on refresh)", async () => {
    // No user_xp row → the ref stays null, so the very first UPDATE observed
    // cannot be read as an increase from an unknown baseline.
    h.seedLevel = null;
    await mountHook();
    const onXpUpdate = await waitForHandler("user_xp:UPDATE");

    act(() => onXpUpdate({ new: { level: 7 } }));

    expect(h.dispatchLevelUp).not.toHaveBeenCalled();
  });

  it("does not dispatch on a level DECREASE (admin correction / rollback)", async () => {
    const onXpUpdate = await mountSeeded(5);

    act(() => onXpUpdate({ new: { level: 4 } }));

    expect(h.dispatchLevelUp).not.toHaveBeenCalled();
  });
});

describe("useGamificationEvents — surprise bonus no-double-toast invariant", () => {
  it("fires only ONE toast when the authed Realtime path and the #796 poll see the same award", async () => {
    // Seed the tab: the first poll observation silently marks existing history
    // seen, so subsequent claims of a NEW award are the ones that would toast.
    // Same userId the hook uses so both paths share the per-user dedupe (#796).
    pickSurpriseBonusToasts([], "user-1");

    await mountHook();
    const onXpInsert = await waitForHandler("xp_transactions:INSERT");

    // Authed Realtime delivers the surprise bonus first → toasts once and
    // claims the shared key.
    act(() =>
      onXpInsert({
        new: {
          id: "xtx-1",
          amount: 25,
          reason: "surprise_bonus:lesson-what-is-a-pda",
          tx_signature: "sig-1",
          idempotency_key: "sb-1",
        },
      })
    );
    expect(h.dispatchSurpriseBonus).toHaveBeenCalledTimes(1);
    expect(h.dispatchSurpriseBonus).toHaveBeenCalledWith(25);

    // #796 dashboard poll then re-scans recent transactions and sees the SAME
    // award (same idempotency_key). The shared claimSurpriseBonus dedupe must
    // make it a no-op — no second toast amount.
    const pollToasts = pickSurpriseBonusToasts(
      [
        {
          reason: "surprise_bonus:lesson-what-is-a-pda",
          amount: 25,
          tx_signature: "sig-1",
          idempotency_key: "sb-1",
          created_at: new Date().toISOString(),
        },
      ],
      "user-1"
    );
    expect(pollToasts).toEqual([]);
    expect(h.dispatchSurpriseBonus).toHaveBeenCalledTimes(1);
  });

  const surpriseCredit = () => ({
    new: {
      id: "xtx-sb1",
      amount: 25,
      reason: "surprise_bonus:lesson-what-is-a-pda",
      tx_signature: "sig-sb1",
      idempotency_key: "sb-1",
    },
  });

  const pollRow = () => ({
    reason: "surprise_bonus:lesson-what-is-a-pda",
    amount: 25,
    tx_signature: "sig-sb1",
    idempotency_key: "sb-1",
    created_at: new Date().toISOString(),
  });

  it("Realtime first, then poll: ONE toast and ONE xp-gain for the same award", async () => {
    pickSurpriseBonusToasts([], "user-1"); // seed the tab
    const gains = countXpGains();
    await mountHook();
    const onXpInsert = await waitForHandler("xp_transactions:INSERT");

    act(() => onXpInsert(surpriseCredit()));
    expect(h.dispatchSurpriseBonus).toHaveBeenCalledTimes(1);
    expect(gains.count()).toBe(1);

    // The dashboard poll then sees the SAME award — the shared seen-set makes
    // it a no-op, so it dispatches neither a toast nor an XP bump.
    expect(pickSurpriseBonusToasts([pollRow()], "user-1")).toEqual([]);
    expect(gains.count()).toBe(1);
    gains.stop();
  });

  it("poll first, then Realtime: no second toast and NO second xp-gain (#926)", async () => {
    pickSurpriseBonusToasts([], "user-1"); // seed the tab
    const gains = countXpGains();
    await mountHook();
    const onXpInsert = await waitForHandler("xp_transactions:INSERT");

    // The dashboard poll wins the claim and does its own dispatchXpGain —
    // modelled here by the single claim below.
    expect(pickSurpriseBonusToasts([pollRow()], "user-1")).toEqual([25]);

    // Realtime then observes the SAME award. It must neither toast NOR bump
    // the counter: the header's optimistic XP is monotonic (never pulls back
    // down), so a second bump would inflate the displayed balance for the
    // rest of the session.
    act(() => onXpInsert(surpriseCredit()));
    expect(h.dispatchSurpriseBonus).toHaveBeenCalledTimes(0);
    expect(gains.count()).toBe(0);
    gains.stop();
  });
});

describe("useGamificationEvents — daily-quest reward: one toast, one XP bump", () => {
  const PERIOD = new Date().toISOString().slice(0, 10);

  const questCredit = () => ({
    new: {
      id: "xtx-q1",
      amount: 25,
      reason: "daily_quest:quest-complete-lesson",
      idempotency_key: `quest-complete-lesson:${PERIOD}`,
      created_at: new Date().toISOString(),
    },
  });

  const pollQuest = (): DailyQuest => ({
    id: "quest-complete-lesson",
    type: "lesson",
    name: "Complete a Lesson",
    description: "",
    icon: "BookOpen",
    xpReward: 25,
    targetValue: 1,
    currentValue: 1,
    completed: true,
    resetType: "daily",
    justAwarded: true,
  });

  it("Realtime alone (no dashboard open) celebrates and bumps XP exactly once", async () => {
    const gains = countXpGains();
    await mountHook();
    const onXpInsert = await waitForHandler("xp_transactions:INSERT");

    act(() => onXpInsert(questCredit()));

    expect(h.dispatchQuestReward).toHaveBeenCalledTimes(1);
    expect(h.dispatchQuestReward).toHaveBeenCalledWith({
      questId: "quest-complete-lesson",
      xpReward: 25,
    });
    expect(gains.count()).toBe(1);
    gains.stop();
  });

  it("poll first, then Realtime: ONE toast and ONE xp-gain for the same award", async () => {
    const gains = countXpGains();
    await mountHook();
    const onXpInsert = await waitForHandler("xp_transactions:INSERT");

    // The dashboard poll wins the claim (it evaluated and saw justAwarded) and
    // does its own dispatchXpGain — modelled here by the single claim below.
    expect(pickQuestRewardToasts([pollQuest()], PERIOD, "user-1")).toHaveLength(
      1
    );

    // The queued credit then lands and Realtime observes the SAME award. It
    // must neither toast NOR bump the counter: the header's optimistic XP is
    // monotonic (never pulls back down), so a second bump here would inflate
    // the displayed balance for the rest of the session.
    act(() => onXpInsert(questCredit()));

    expect(h.dispatchQuestReward).not.toHaveBeenCalled();
    expect(gains.count()).toBe(0);
    gains.stop();
  });

  it("Realtime first, then poll: the poll claims nothing (no second bump)", async () => {
    const gains = countXpGains();
    await mountHook();
    const onXpInsert = await waitForHandler("xp_transactions:INSERT");

    act(() => onXpInsert(questCredit()));
    expect(h.dispatchQuestReward).toHaveBeenCalledTimes(1);
    expect(gains.count()).toBe(1);

    // The learner opens the dashboard afterwards — the shared seen-set makes
    // the poll a no-op, so it dispatches neither a toast nor an XP bump.
    expect(pickQuestRewardToasts([pollQuest()], PERIOD, "user-1")).toEqual([]);
    expect(h.dispatchQuestReward).toHaveBeenCalledTimes(1);
    expect(gains.count()).toBe(1);
    gains.stop();
  });
});
