/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module imports so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { aggregateInsights } from "../insights";

const NOW = new Date("2026-07-28T12:00:00Z");
const days = (n: number) =>
  new Date(NOW.getTime() - n * 24 * 60 * 60 * 1000).toISOString();

describe("aggregateInsights", () => {
  it("counts distinct AI users and ranks lessons by assists", () => {
    const out = aggregateInsights({
      now: NOW,
      totalLearners: 10,
      totalEnrollments: 12,
      progress: [],
      spend: [],
      assists: [
        {
          user_id: "u1",
          lesson_id: "l-hard",
          assists_used: 3,
          billed_assists: 3,
        },
        {
          user_id: "u2",
          lesson_id: "l-hard",
          assists_used: 2,
          billed_assists: 1,
        },
        {
          user_id: "u1",
          lesson_id: "l-easy",
          assists_used: 1,
          billed_assists: 1,
        },
        // A row with zero usage exists after a refund — it must not count as
        // an AI user.
        {
          user_id: "u3",
          lesson_id: "l-easy",
          assists_used: 0,
          billed_assists: 0,
        },
      ],
    });

    expect(out.ai.learnersUsingAi).toBe(2);
    expect(out.ai.totalAssists).toBe(6);
    expect(out.ai.billedAssists).toBe(5);
    expect(out.ai.topLessons[0]).toEqual({
      lessonId: "l-hard",
      assists: 5,
      learners: 2,
    });
    expect(out.ai.topLessons[1]).toEqual({
      lessonId: "l-easy",
      assists: 1,
      learners: 1,
    });
  });

  it("converts micro-USD to dollars and totals the 30-day window", () => {
    const out = aggregateInsights({
      now: NOW,
      totalLearners: 0,
      totalEnrollments: 0,
      progress: [],
      assists: [],
      spend: [
        { spend_day: "2026-07-27", micro_usd: 1_234_567, request_count: 4 },
        { spend_day: "2026-07-26", micro_usd: 500_000, request_count: 2 },
      ],
    });

    // Ascending by day, rounded to cents.
    expect(out.ai.spendByDay).toEqual([
      { day: "2026-07-26", usd: 0.5, requests: 2 },
      { day: "2026-07-27", usd: 1.23, requests: 4 },
    ]);
    expect(out.ai.spend30dUsd).toBe(1.73);
    expect(out.ai.requests30d).toBe(6);
  });

  it("buckets completions by UTC day and windows active learners", () => {
    const out = aggregateInsights({
      now: NOW,
      totalLearners: 50,
      totalEnrollments: 60,
      assists: [],
      spend: [],
      progress: [
        { user_id: "u1", course_id: "c1", completed_at: days(1) },
        { user_id: "u1", course_id: "c1", completed_at: days(1) },
        { user_id: "u2", course_id: "c1", completed_at: days(10) },
        { user_id: "u3", course_id: "c2", completed_at: days(45) },
        // Null timestamp (pre-backfill row): counts toward the course, never
        // toward activity windows.
        { user_id: "u4", course_id: "c2", completed_at: null },
      ],
    });

    expect(out.learning.totalLearners).toBe(50);
    expect(out.learning.activeLearners7d).toBe(1);
    expect(out.learning.activeLearners30d).toBe(2);
    // 45-day-old and null completions are outside the 30d day buckets.
    expect(out.learning.completionsByDay.reduce((a, d) => a + d.count, 0)).toBe(
      3
    );
    expect(out.learning.perCourse).toEqual([
      { courseId: "c1", completions: 3, learners: 2 },
      { courseId: "c2", completions: 2, learners: 2 },
    ]);
  });
});
