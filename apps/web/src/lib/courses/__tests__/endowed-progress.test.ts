import { describe, it, expect } from "vitest";
import {
  deriveEndowedProgress,
  ENDOWED_FIRST_TICK_FRACTION,
  NEAR_GOAL_THRESHOLD,
} from "../endowed-progress";

describe("deriveEndowedProgress — endowed first tick", () => {
  it("renders a non-zero fill with a stated reason when nothing is completed", () => {
    const ep = deriveEndowedProgress(0, 8);
    expect(ep.displayFraction).toBe(ENDOWED_FIRST_TICK_FRACTION);
    expect(ep.displayFraction).toBeGreaterThan(0);
    expect(ep.reasonKey).toBe("enrolledFirstStep");
  });

  it("keeps the honest earned fraction at 0 — the tick never claims a lesson", () => {
    const ep = deriveEndowedProgress(0, 8);
    expect(ep.earnedFraction).toBe(0);
    expect(ep.isComplete).toBe(false);
  });

  it("still endows a tick with a reason for a course that has no lessons yet", () => {
    const ep = deriveEndowedProgress(0, 0);
    expect(ep.displayFraction).toBe(ENDOWED_FIRST_TICK_FRACTION);
    expect(ep.reasonKey).toBe("enrolledFirstStep");
  });
});

describe("deriveEndowedProgress — earned progress needs no reason", () => {
  it("fills to the earned fraction with no reason once a lesson is done", () => {
    const ep = deriveEndowedProgress(3, 8);
    expect(ep.earnedFraction).toBe(3 / 8);
    expect(ep.displayFraction).toBe(3 / 8);
    expect(ep.reasonKey).toBeNull();
  });
});

describe("deriveEndowedProgress — near-goal intensification", () => {
  it("does not intensify early in the course", () => {
    expect(deriveEndowedProgress(2, 8).nearGoal).toBe(false);
  });

  it("intensifies at or past the threshold while still incomplete", () => {
    const ep = deriveEndowedProgress(6, 8); // 0.75
    expect(ep.earnedFraction).toBeGreaterThanOrEqual(NEAR_GOAL_THRESHOLD);
    expect(ep.nearGoal).toBe(true);
    expect(ep.isComplete).toBe(false);
  });

  it("stops intensifying once complete", () => {
    const ep = deriveEndowedProgress(8, 8);
    expect(ep.isComplete).toBe(true);
    expect(ep.nearGoal).toBe(false);
    expect(ep.reasonKey).toBeNull();
    expect(ep.displayFraction).toBe(1);
  });
});

describe("deriveEndowedProgress — defensive clamping", () => {
  it("clamps over-count and never reports a reason for a done course", () => {
    const ep = deriveEndowedProgress(12, 8);
    expect(ep.earnedFraction).toBe(1);
    expect(ep.isComplete).toBe(true);
    expect(ep.reasonKey).toBeNull();
  });

  it("clamps negative counts to the endowed first tick", () => {
    const ep = deriveEndowedProgress(-3, 8);
    expect(ep.displayFraction).toBe(ENDOWED_FIRST_TICK_FRACTION);
    expect(ep.reasonKey).toBe("enrolledFirstStep");
  });
});
