// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useGamificationEvents } from "../use-gamification-events";
import {
  resetAnalyticsEventDedupeForTests,
  trackCredentialMinted,
} from "@/lib/analytics/events";

// Real events module between hook and facade — asserts the wire format AND
// the cross-path dedupe with the manual-mint observation.
const h = vi.hoisted(() => ({
  trackEvent: vi.fn(),
  dispatchCertificateMinted: vi.fn(),
  handlers: new Map<string, (payload: unknown) => void>(),
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
      subscribe: () => channel,
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
    };
  },
}));

function certInsert(id: string, courseId: string): unknown {
  return { new: { id, course_id: courseId, user_id: "user-1" } };
}

beforeEach(() => {
  h.trackEvent.mockClear();
  h.dispatchCertificateMinted.mockClear();
  h.handlers.clear();
  resetAnalyticsEventDedupeForTests();
});

describe("useGamificationEvents — credential_minted (Realtime INSERT path)", () => {
  it("fires credential_minted with the row's course id on a certificates INSERT", () => {
    renderHook(() => useGamificationEvents("user-1"));
    const onCertInsert = h.handlers.get("certificates:INSERT");
    expect(onCertInsert).toBeDefined();

    act(() => onCertInsert?.(certInsert("cert-1", "course-solana-101")));

    expect(h.trackEvent).toHaveBeenCalledTimes(1);
    expect(h.trackEvent).toHaveBeenCalledWith("credential_minted", {
      courseId: "course-solana-101",
      source: "realtime",
    });
    expect(h.dispatchCertificateMinted).toHaveBeenCalledWith("cert-1");
  });

  it("ignores Realtime replays of the same row", () => {
    renderHook(() => useGamificationEvents("user-1"));
    const onCertInsert = h.handlers.get("certificates:INSERT");

    act(() => onCertInsert?.(certInsert("cert-1", "course-solana-101")));
    act(() => onCertInsert?.(certInsert("cert-1", "course-solana-101")));

    expect(h.trackEvent).toHaveBeenCalledTimes(1);
    expect(h.dispatchCertificateMinted).toHaveBeenCalledTimes(1);
  });

  it("does not double-fire when the manual mint already observed this mint", () => {
    renderHook(() => useGamificationEvents("user-1"));
    const onCertInsert = h.handlers.get("certificates:INSERT");

    // Manual-mint success (course-completion-mint.tsx) fired moments earlier.
    trackCredentialMinted("course-solana-101", "manual_mint");
    act(() => onCertInsert?.(certInsert("cert-1", "course-solana-101")));

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
