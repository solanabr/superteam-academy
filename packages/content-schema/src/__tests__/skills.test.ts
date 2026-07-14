import { describe, it, expect } from "vitest";
import { SkillTag, SkillDef, SkillsTaxonomy } from "../skills";

describe("SkillTag", () => {
  it("accepts a kebab-case slug", () => {
    expect(SkillTag.safeParse("pdas").success).toBe(true);
    expect(SkillTag.safeParse("cross-program-invocation").success).toBe(true);
  });

  it("rejects non-slug strings", () => {
    expect(SkillTag.safeParse("PDAs").success).toBe(false);
    expect(SkillTag.safeParse("pdas_and_cpi").success).toBe(false);
    expect(SkillTag.safeParse("").success).toBe(false);
  });
});

describe("SkillDef", () => {
  it("accepts a slug-only entry", () => {
    expect(SkillDef.safeParse({ slug: "pdas" }).success).toBe(true);
  });

  it("accepts an entry with a label and description", () => {
    const parsed = SkillDef.parse({
      slug: "pdas",
      label: "Program Derived Addresses",
      description: "Deriving deterministic addresses from seeds.",
    });
    expect(parsed.label).toBe("Program Derived Addresses");
  });

  it("rejects a malformed slug", () => {
    expect(SkillDef.safeParse({ slug: "Not A Slug" }).success).toBe(false);
  });
});

describe("SkillsTaxonomy", () => {
  it("accepts an empty vocabulary (skills.yaml absent today, #466 C1)", () => {
    expect(SkillsTaxonomy.safeParse([]).success).toBe(true);
  });

  it("accepts a list of skill definitions", () => {
    const parsed = SkillsTaxonomy.parse([
      { slug: "pdas", label: "PDAs" },
      { slug: "cpi", label: "CPIs" },
    ]);
    expect(parsed).toHaveLength(2);
  });

  it("rejects duplicate slugs", () => {
    const bad = [{ slug: "pdas" }, { slug: "pdas" }];
    expect(SkillsTaxonomy.safeParse(bad).success).toBe(false);
  });
});
