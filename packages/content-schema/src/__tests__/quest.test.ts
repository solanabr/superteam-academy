import { describe, it, expect } from "vitest";
import { Quest } from "../quest";

const base = {
  id: "quest-complete-lesson",
  name: "Complete a Lesson",
  type: "lesson",
  xpReward: 25,
  targetValue: 1,
  resetType: "daily",
};

describe("Quest", () => {
  it("accepts a daily lesson quest", () => {
    expect(Quest.parse(base).type).toBe("lesson");
  });

  it("rejects targetValue 0 — get_daily_quest_state has no guard and would mint free XP daily", () => {
    expect(Quest.safeParse({ ...base, targetValue: 0 }).success).toBe(false);
  });

  it("rejects a type the SQL function does not implement", () => {
    expect(Quest.safeParse({ ...base, type: "vibes" }).success).toBe(false);
  });

  it("caps xpReward at MAX_XP_PER_MINT, above which reward_xp reverts forever", () => {
    expect(Quest.safeParse({ ...base, xpReward: 5001 }).success).toBe(false);
    expect(Quest.safeParse({ ...base, xpReward: 5000 }).success).toBe(true);
  });

  it("defaults active to true", () => {
    expect(Quest.parse(base).active).toBe(true);
  });
});
