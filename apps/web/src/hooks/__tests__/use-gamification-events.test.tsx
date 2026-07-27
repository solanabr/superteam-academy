// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";
import {
  resetAnalyticsEventDedupeForTests,
  trackCredentialMinted,
} from "@/lib/analytics/events";
import {
  pickSurpriseBonusToasts,
  __resetServerXpFeedbackForTests,
} from "@/lib/gamification/server-xp-feedback";
import { useGamificationEvents } from "../use-gamification-events";

// Real events + server-xp-feedback modules between hook and facades — asserts
// the wire format, the cross-path dedupe with the manual-mint observation, AND
// the shared surprise-bonus dedupe with the #796 dashboard poll.
const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  dispatchCertificateMinted: vi.fn(),
  dispatchSurpriseBonus: vi.fn(),
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
  dispatchLevelUp: vi.fn(),
}));
vi.mock("@/components/gamification/surprise-bonus-toast", () => ({
  dispatchSurpriseBonus: h.dispatchSurpriseBonus,
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
            maybeSingle: () => Promise.resolve({ data: null }),
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
  // The effect is now async (getSession → setAuth → subscribe); flush the
  // microtask chain so the channel is subscribed and handlers registered.
  await act(async () => {
    await Promise.resolve();
    await Promise.resolve();
    await Promise.resolve();
  });
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

beforeEach(() => {
  h.trackEvent.mockClear();
  h.dispatchCertificateMinted.mockClear();
  h.dispatchSurpriseBonus.mockClear();
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
});
