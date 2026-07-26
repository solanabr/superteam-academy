import { describe, it, expect } from "vitest";
import { GOAL_IDS, isGoalId } from "@/lib/courses/learner-segment";
import {
  EXPERIENCE_TO_SEGMENT,
  EXPERIENCE_OPTIONS,
  GOAL_OPTIONS,
  INTEREST_OPTIONS,
  dailyGoalOptionsFromQuests,
  isExperienceId,
  isInterestId,
  type QuestTargetSource,
} from "../intake";

describe("experience → segment mapping (LX-A3 routing)", () => {
  it("maps each verifiable-history answer onto the right segment", () => {
    expect(EXPERIENCE_TO_SEGMENT.js_ts).toBe(1);
    expect(EXPERIENCE_TO_SEGMENT.web3).toBe(2);
    expect(EXPERIENCE_TO_SEGMENT.new).toBe(3);
  });

  it("covers every experience option with a segment", () => {
    for (const opt of EXPERIENCE_OPTIONS) {
      expect(EXPERIENCE_TO_SEGMENT[opt.id]).toBeGreaterThanOrEqual(1);
    }
  });
});

describe("option lists are closed sets with stable ids", () => {
  it("goal options match the GoalId closed set", () => {
    expect(GOAL_OPTIONS.map((o) => o.id).sort()).toEqual([...GOAL_IDS].sort());
  });

  it("interest options are unique", () => {
    const ids = INTEREST_OPTIONS.map((o) => o.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});

describe("id validators reject anything off the closed set", () => {
  it("isExperienceId / isGoalId / isInterestId", () => {
    expect(isExperienceId("js_ts")).toBe(true);
    expect(isExperienceId("expert")).toBe(false);
    expect(isGoalId("job")).toBe(true);
    expect(isGoalId("promotion")).toBe(false);
    expect(isInterestId("defi")).toBe(true);
    expect(isInterestId("nonsense")).toBe(false);
    expect(isExperienceId(3)).toBe(false);
  });
});

describe("dailyGoalOptionsFromQuests — wired to existing quest targets (LX-A2)", () => {
  const quests: QuestTargetSource[] = [
    { type: "lesson", resetType: "daily", targetValue: 1 },
    { type: "lesson_batch", resetType: "daily", targetValue: 3 },
    { type: "challenge", resetType: "daily", targetValue: 1 },
    { type: "login_streak", resetType: "multi_day", targetValue: 3 },
    { type: "module", resetType: "daily", targetValue: 1 },
  ];

  it("derives the picker from daily lesson-completion quest targets only", () => {
    // 1 (lesson) + 3 (lesson_batch); challenge/module/login_streak excluded.
    expect(dailyGoalOptionsFromQuests(quests)).toEqual([1, 3]);
  });

  it("returns distinct, ascending targets", () => {
    const dup: QuestTargetSource[] = [
      { type: "lesson", resetType: "daily", targetValue: 3 },
      { type: "lesson_batch", resetType: "daily", targetValue: 3 },
      { type: "lesson", resetType: "daily", targetValue: 1 },
    ];
    expect(dailyGoalOptionsFromQuests(dup)).toEqual([1, 3]);
  });

  it("never yields an empty picker (falls back to a single one-lesson goal)", () => {
    expect(dailyGoalOptionsFromQuests([])).toEqual([1]);
    expect(
      dailyGoalOptionsFromQuests([
        { type: "login_streak", resetType: "multi_day", targetValue: 7 },
      ])
    ).toEqual([1]);
  });

  it("ignores non-positive / non-integer targets", () => {
    expect(
      dailyGoalOptionsFromQuests([
        { type: "lesson", resetType: "daily", targetValue: 0 },
        { type: "lesson", resetType: "daily", targetValue: 2.5 },
        { type: "lesson", resetType: "daily", targetValue: 5 },
      ])
    ).toEqual([5]);
  });
});
