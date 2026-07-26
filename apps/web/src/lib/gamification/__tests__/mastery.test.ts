import { describe, it, expect } from "vitest";
import { deriveMastery, labelForSkill } from "@/lib/gamification/mastery";

const catalog = [
  { _id: "l1", skills: ["pdas", "account-model"] },
  { _id: "l2", skills: ["pdas"] },
  { _id: "l3", skills: ["pdas", "cpi"] },
  { _id: "l4", skills: ["cpi"] },
  { _id: "l5", skills: ["anchor"] },
];

describe("labelForSkill", () => {
  it("humanizes kebab-case slugs", () => {
    expect(labelForSkill("account-model")).toBe("Account Model");
    expect(labelForSkill("pdas")).toBe("Pdas");
  });
});

describe("deriveMastery", () => {
  it("counts completed vs total lessons per skill and computes progress", () => {
    // Completed l1, l2 → pdas 2/3, account-model 1/1
    const result = deriveMastery(["l1", "l2"], catalog);
    const pdas = result.find((s) => s.slug === "pdas");
    const account = result.find((s) => s.slug === "account-model");
    expect(pdas).toMatchObject({ completed: 2, total: 3, progress: 67 });
    expect(account).toMatchObject({ completed: 1, total: 1, progress: 100 });
  });

  it("omits skills the learner has not started", () => {
    const result = deriveMastery(["l5"], catalog);
    expect(result.map((s) => s.slug)).toEqual(["anchor"]);
    // cpi/pdas exist in the catalog but were never completed → absent
    expect(result.some((s) => s.slug === "cpi")).toBe(false);
  });

  it("ranks by lessons completed, then progress, and caps the list", () => {
    const result = deriveMastery(["l1", "l2", "l3", "l4"], catalog, {
      maxSkills: 2,
    });
    expect(result).toHaveLength(2);
    // pdas: 3 completed, cpi: 2 completed → pdas first
    expect(result[0]?.slug).toBe("pdas");
    expect(result[1]?.slug).toBe("cpi");
  });

  it("returns an empty list when nothing is completed", () => {
    expect(deriveMastery([], catalog)).toEqual([]);
  });

  it("attributes a completed lesson only to its own skills, never a course smear", () => {
    // l4 carries only cpi; completing it must not credit pdas
    const result = deriveMastery(["l4"], catalog);
    expect(result.map((s) => s.slug)).toEqual(["cpi"]);
    expect(result[0]).toMatchObject({ completed: 1, total: 2, progress: 50 });
  });
});
