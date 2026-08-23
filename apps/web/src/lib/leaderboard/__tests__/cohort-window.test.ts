import { describe, it, expect } from "vitest";
import type { CohortLeaderboardEntry } from "@superteam-lms/types";
import {
  cohortStripWindow,
  deriveCohortStrip,
} from "@/lib/leaderboard/cohort-window";

describe("cohortStripWindow (you ±3 sliding window, LX-B9b)", () => {
  it("centers on the viewer in the interior", () => {
    expect(cohortStripWindow(15, 30, 3)).toEqual({ lo: 12, hi: 18 });
  });

  it("slides to the top edge at rank 1 (never runs off the front)", () => {
    // No neighbors above → show 1..7, keeping the full window of 7.
    expect(cohortStripWindow(1, 30, 3)).toEqual({ lo: 1, hi: 7 });
    expect(cohortStripWindow(2, 30, 3)).toEqual({ lo: 1, hi: 7 });
    expect(cohortStripWindow(3, 30, 3)).toEqual({ lo: 1, hi: 7 });
    // rank 4 is the first that can center.
    expect(cohortStripWindow(4, 30, 3)).toEqual({ lo: 1, hi: 7 });
    expect(cohortStripWindow(5, 30, 3)).toEqual({ lo: 2, hi: 8 });
  });

  it("slides to the bottom edge at the last rank (never runs off the end)", () => {
    expect(cohortStripWindow(30, 30, 3)).toEqual({ lo: 24, hi: 30 });
    expect(cohortStripWindow(29, 30, 3)).toEqual({ lo: 24, hi: 30 });
    expect(cohortStripWindow(28, 30, 3)).toEqual({ lo: 24, hi: 30 });
    expect(cohortStripWindow(27, 30, 3)).toEqual({ lo: 24, hi: 30 });
    expect(cohortStripWindow(26, 30, 3)).toEqual({ lo: 23, hi: 29 });
  });

  it("shrinks the window to the cohort when it is smaller than 2r+1", () => {
    // n=4 < 7 → whole cohort regardless of the viewer's rank.
    for (const rank of [1, 2, 3, 4]) {
      expect(cohortStripWindow(rank, 4, 3)).toEqual({ lo: 1, hi: 4 });
    }
    // n=5, viewer last → still the whole cohort.
    expect(cohortStripWindow(5, 5, 3)).toEqual({ lo: 1, hi: 5 });
  });

  it("handles the degenerate single-member cohort", () => {
    expect(cohortStripWindow(1, 1, 3)).toEqual({ lo: 1, hi: 1 });
  });

  it("returns an empty window for an empty cohort", () => {
    expect(cohortStripWindow(1, 0, 3)).toEqual({ lo: 1, hi: 0 });
  });

  it("respects radius 0 (just the viewer) and defaults radius to 3", () => {
    expect(cohortStripWindow(15, 30, 0)).toEqual({ lo: 15, hi: 15 });
    expect(cohortStripWindow(15, 30)).toEqual({ lo: 12, hi: 18 });
  });

  it("always yields a window of size min(n, 2r+1) that contains the viewer", () => {
    for (const n of [1, 4, 7, 8, 30]) {
      for (let rank = 1; rank <= n; rank++) {
        const { lo, hi } = cohortStripWindow(rank, n, 3);
        expect(hi - lo + 1).toBe(Math.min(n, 7));
        expect(rank).toBeGreaterThanOrEqual(lo);
        expect(rank).toBeLessThanOrEqual(hi);
        expect(lo).toBeGreaterThanOrEqual(1);
        expect(hi).toBeLessThanOrEqual(n);
      }
    }
  });
});

function entry(rank: number, isYou = false): CohortLeaderboardEntry {
  return {
    userId: `u${rank}`,
    username: `learner${rank}`,
    avatarUrl: null,
    score: (31 - rank) * 10,
    rank,
    isYou,
  };
}

describe("deriveCohortStrip (LX-B9b)", () => {
  const board = Array.from({ length: 30 }, (_, i) =>
    entry(i + 1, i + 1 === 15)
  );

  it("returns the viewer ±3 centered, with the leader pinned above it", () => {
    const strip = deriveCohortStrip(board);
    expect(strip.map((e) => e.rank)).toEqual([1, 12, 13, 14, 15, 16, 17, 18]);
    expect(strip.find((e) => e.isYou)?.rank).toBe(15);
  });

  it("slides to the top edge for rank 1", () => {
    const b = board.map((e) => ({ ...e, isYou: e.rank === 1 }));
    expect(deriveCohortStrip(b).map((e) => e.rank)).toEqual([
      1, 2, 3, 4, 5, 6, 7,
    ]);
  });

  it("slides to the bottom edge for the last rank, still led by rank 1", () => {
    const b = board.map((e) => ({ ...e, isYou: e.rank === 30 }));
    expect(deriveCohortStrip(b).map((e) => e.rank)).toEqual([
      1, 24, 25, 26, 27, 28, 29, 30,
    ]);
  });

  it("does not duplicate the leader when the window already contains it", () => {
    for (const myRank of [1, 2, 3, 4]) {
      const b = board.map((e) => ({ ...e, isYou: e.rank === myRank }));
      const ranks = deriveCohortStrip(b).map((e) => e.rank);
      expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7]);
    }
  });

  it("pins the leader as soon as the window slides past them", () => {
    // Viewer at rank 5 windows to 2..8 — the case that showed a league
    // starting at "2nd" on the dashboard.
    const b = board.map((e) => ({ ...e, isYou: e.rank === 5 }));
    const ranks = deriveCohortStrip(b).map((e) => e.rank);
    expect(ranks).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
    expect(ranks.filter((r) => r === 1)).toHaveLength(1);
  });

  it("returns the whole cohort when it is small", () => {
    const small = [entry(1), entry(2, true), entry(3)];
    expect(deriveCohortStrip(small).map((e) => e.rank)).toEqual([1, 2, 3]);
  });

  it("fails closed (empty) when the viewer is absent — never mislabels", () => {
    expect(
      deriveCohortStrip(board.map((e) => ({ ...e, isYou: false })))
    ).toEqual([]);
  });
});
