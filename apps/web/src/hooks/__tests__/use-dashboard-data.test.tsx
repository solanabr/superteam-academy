// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import {
  __resetServerXpFeedbackForTests,
  pickSurpriseBonusToasts,
} from "@/lib/gamification/server-xp-feedback";

// Real server-xp-feedback pickers between the hook and the toast facade — the
// point of this test is the HOOK's wiring of a poll-detected surprise bonus, so
// the picker stays real and only the dispatch surface is spied.
const h = vi.hoisted(() => ({
  dispatchXpGain: vi.fn(),
  dispatchSurpriseBonus: vi.fn(),
  dispatchToast: vi.fn(),
  celebrate: vi.fn(),
  transactions: [] as unknown[],
}));

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

vi.mock("@/hooks/use-gamification-events", () => ({
  dispatchXpGain: h.dispatchXpGain,
}));
vi.mock("@/components/gamification/surprise-bonus-toast", () => ({
  dispatchSurpriseBonus: h.dispatchSurpriseBonus,
}));
vi.mock("@/components/ui/toast-container", () => ({
  dispatchToast: h.dispatchToast,
}));
vi.mock("@/lib/gamification/celebration", () => ({
  celebrate: h.celebrate,
}));

// Content bundle queries — never reached before the surprise-bonus loop, but
// stubbed so the poll runs clean instead of hitting the network.
vi.mock("@/lib/content/client-queries", () => ({
  getCourseLessonOrders: vi.fn(async () => []),
  getCoursesByIds: vi.fn(async () => []),
  getLessonsByIds: vi.fn(async () => []),
  getRecommendedCourses: vi.fn(async () => []),
  getAllAchievements: vi.fn(async () => []),
  getAllLessonSkills: vi.fn(async () => []),
}));

vi.mock("@/lib/services", () => ({
  getProgressService: () => ({
    getXP: async () => 0,
    getStreak: async () => ({
      available: true,
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: "",
      streakHistory: {},
      frozenDays: [],
      freezesRemaining: 0,
    }),
  }),
}));

// Chainable Supabase stub. Terminal shape depends on the table + whether the
// query is a head/count read: profiles resolve a single row, the recent
// xp_transactions scan resolves the seeded surprise-bonus row, everything else
// resolves an empty set.
vi.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    from(table: string) {
      let columns = "";
      let head = false;
      const builder: Record<string, unknown> = {
        select(cols: string, opts?: { head?: boolean }) {
          columns = cols;
          head = Boolean(opts?.head);
          return builder;
        },
        eq: () => builder,
        gte: () => builder,
        order: () => builder,
        limit: () => builder,
        single: () =>
          Promise.resolve({
            data: { username: "Builder", name_rerolls_used: 0 },
          }),
        then(
          resolve: (v: unknown) => unknown,
          reject?: (e: unknown) => unknown
        ) {
          const value = head
            ? { count: 0 }
            : table === "xp_transactions" && columns.includes("amount")
              ? { data: h.transactions }
              : { data: [] };
          return Promise.resolve(value).then(resolve, reject);
        },
      };
      return builder;
    },
  }),
}));

import { useDashboardData } from "../use-dashboard-data";

beforeEach(() => {
  h.dispatchXpGain.mockClear();
  h.dispatchSurpriseBonus.mockClear();
  h.dispatchToast.mockClear();
  h.celebrate.mockClear();
  h.transactions = [];
  __resetServerXpFeedbackForTests();
  // /api/quests/daily poll — no quest rewards, isolate the surprise-bonus path.
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: true,
      json: async () => ({ quests: [], nextResetTime: "" }),
    }))
  );
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("useDashboardData — poll-detected surprise bonus", () => {
  it("dispatches an xp-gain for a surprise bonus the poll newly detects", async () => {
    // Seed the tab: the first observation silently marks existing history seen,
    // so a bonus that appears on a LATER poll is the one that toasts (#790).
    pickSurpriseBonusToasts([]);

    const AMOUNT = 25;
    h.transactions = [
      {
        amount: AMOUNT,
        reason: "surprise_bonus:lesson-what-is-a-pda",
        created_at: new Date().toISOString(),
        tx_signature: "5igNaTure",
        idempotency_key: "surprise-bonus-key-1",
      },
    ];

    renderHook(() => useDashboardData("user-1", false));

    // The surprise-bonus toast fires in both the buggy and fixed builds; wait on
    // it so the xp-gain assertion below is a clean failure at the unfixed head
    // rather than a timeout.
    await waitFor(() =>
      expect(h.dispatchSurpriseBonus).toHaveBeenCalledWith(AMOUNT)
    );

    // #796 regression: the poll path must also move the header XP counter.
    expect(h.dispatchXpGain).toHaveBeenCalledWith(AMOUNT);
  });
});
