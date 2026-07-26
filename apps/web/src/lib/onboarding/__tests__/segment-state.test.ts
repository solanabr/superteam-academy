// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest";
import {
  clearSegmentState,
  hasSegmentState,
  readSegmentState,
  setExperience,
  updateSegmentState,
} from "../segment-state";

beforeEach(() => {
  window.localStorage.clear();
});

describe("segment-state — pre-auth localStorage store (LX-A3)", () => {
  it("starts empty", () => {
    expect(readSegmentState()).toBeNull();
    expect(hasSegmentState()).toBe(false);
  });

  it("derives the routing segment from the experience answer", () => {
    setExperience("web3");
    const state = readSegmentState();
    expect(state?.experience).toBe("web3");
    expect(state?.segment).toBe(2);
    expect(hasSegmentState()).toBe(true);
  });

  it("merges later-screen answers onto the existing state", () => {
    setExperience("js_ts");
    updateSegmentState({ goal: "job" });
    updateSegmentState({ interests: ["defi", "nfts"], dailyGoal: 3 });
    const state = readSegmentState();
    expect(state).toMatchObject({
      experience: "js_ts",
      segment: 1,
      goal: "job",
      interests: ["defi", "nfts"],
      dailyGoal: 3,
    });
  });

  it("re-forking resets downstream answers (no stale goal/daily-goal)", () => {
    setExperience("js_ts");
    updateSegmentState({ goal: "job", dailyGoal: 3 });
    setExperience("new"); // learner backs up and picks a different fork
    const state = readSegmentState();
    expect(state?.segment).toBe(3);
    expect(state?.goal).toBeUndefined();
    expect(state?.dailyGoal).toBeUndefined();
  });

  it("update before any experience is a no-op (screen 1 must precede)", () => {
    expect(updateSegmentState({ goal: "job" })).toBeNull();
    expect(readSegmentState()).toBeNull();
  });

  it("clears", () => {
    setExperience("new");
    clearSegmentState();
    expect(readSegmentState()).toBeNull();
  });

  it("treats corrupt / off-set stored JSON as absent", () => {
    window.localStorage.setItem("superteam:segment-state:v1", "{not json");
    expect(readSegmentState()).toBeNull();
    window.localStorage.setItem(
      "superteam:segment-state:v1",
      JSON.stringify({ experience: "guru", segment: 9, updatedAt: 1 })
    );
    expect(readSegmentState()).toBeNull();
  });
});
