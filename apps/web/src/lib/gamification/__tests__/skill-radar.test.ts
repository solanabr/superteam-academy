import { describe, it, expect } from "vitest";
import { completedLessonsToRadar } from "../skill-radar";

const lessonSkills = new Map<string, string[]>([
  ["lesson-pda-1", ["pdas"]],
  ["lesson-pda-2", ["pdas", "cpi"]],
  ["lesson-token-1", ["tokens"]],
]);

describe("completedLessonsToRadar", () => {
  it("returns [] for no completed lessons", () => {
    expect(completedLessonsToRadar([], lessonSkills)).toEqual([]);
  });

  it("attributes a completed lesson's OWN skills, not its course's full tag set", () => {
    // A learner who did only the PDA lessons — not the token lesson.
    const radar = completedLessonsToRadar(
      ["lesson-pda-1", "lesson-pda-2"],
      lessonSkills
    );
    const byLabel = new Map(radar.map((r) => [r.label, r]));
    expect(byLabel.get("Pdas")?.lessonCount).toBe(2);
    expect(byLabel.get("Cpi")?.lessonCount).toBe(1);
    // The undone skill never entered the tally — no course-average smear.
    expect(byLabel.has("Tokens")).toBe(false);
  });

  it("normalizes so the strongest skill is 100", () => {
    const radar = completedLessonsToRadar(
      ["lesson-pda-1", "lesson-pda-2"],
      lessonSkills
    );
    const pdas = radar.find((r) => r.label === "Pdas")!;
    const cpi = radar.find((r) => r.label === "Cpi")!;
    expect(pdas.value).toBe(100);
    expect(cpi.value).toBe(50);
  });

  it("ignores a completed lesson id absent from the map (defensive)", () => {
    expect(completedLessonsToRadar(["lesson-unknown"], lessonSkills)).toEqual(
      []
    );
  });

  it("counts a multi-skill lesson toward every one of its skills", () => {
    const radar = completedLessonsToRadar(["lesson-pda-2"], lessonSkills);
    const byLabel = new Map(radar.map((r) => [r.label, r.lessonCount]));
    expect(byLabel.get("Pdas")).toBe(1);
    expect(byLabel.get("Cpi")).toBe(1);
  });

  it("caps the number of skills returned at maxSkills, keeping the strongest", () => {
    const manySkills = new Map<string, string[]>([
      ["l1", ["a"]],
      ["l2", ["a", "b"]],
      ["l3", ["a", "b", "c"]],
      ["l4", ["d"]],
      ["l5", ["e"]],
    ]);
    const radar = completedLessonsToRadar(
      ["l1", "l2", "l3", "l4", "l5"],
      manySkills,
      2
    );
    expect(radar).toHaveLength(2);
    expect(radar[0]!.label).toBe("A");
  });
});
