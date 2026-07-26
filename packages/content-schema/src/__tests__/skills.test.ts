import { describe, it, expect } from "vitest";
import {
  SkillTag,
  SkillDef,
  SkillsTaxonomy,
  checkSkillVocabulary,
  NON_REVIEW_ELIGIBLE_SKILLS,
  REVIEW_INTERLEAVING_PAIRS,
  isReviewEligibleSkill,
} from "../skills";

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

  it("accepts the optional reviewExempt marker (catalog spec §5 policy 4)", () => {
    const parsed = SkillDef.parse({
      slug: "earn-submission",
      reviewExempt: true,
    });
    expect(parsed.reviewExempt).toBe(true);
  });

  it("leaves reviewExempt undefined when absent (backward-compatible)", () => {
    const parsed = SkillDef.parse({ slug: "pdas" });
    expect(parsed.reviewExempt).toBeUndefined();
  });

  it("rejects a non-boolean reviewExempt", () => {
    expect(
      SkillDef.safeParse({ slug: "pdas", reviewExempt: "yes" }).success
    ).toBe(false);
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

describe("checkSkillVocabulary (#466 C3 — the allowlist guarantee)", () => {
  const vocabulary = SkillsTaxonomy.parse([{ slug: "pdas" }, { slug: "cpi" }]);

  it("returns no issues when every lesson skill is a known vocabulary member", () => {
    const lessons = [
      { id: "lesson-a", skills: ["pdas"] },
      { id: "lesson-b", skills: ["pdas", "cpi"] },
    ];
    expect(checkSkillVocabulary(lessons, vocabulary)).toEqual([]);
  });

  it("names the lesson and the bad slug for an unknown skill", () => {
    const lessons = [{ id: "lesson-a", skills: ["not-a-real-skill"] }];
    const issues = checkSkillVocabulary(lessons, vocabulary);
    expect(issues).toHaveLength(1);
    expect(issues[0]).toContain("lesson-a");
    expect(issues[0]).toContain("not-a-real-skill");
  });

  it("reports one issue per unknown slug across multiple lessons", () => {
    const lessons = [
      { id: "lesson-a", skills: ["pdas", "bogus-one"] },
      { id: "lesson-b", skills: ["bogus-two"] },
    ];
    expect(checkSkillVocabulary(lessons, vocabulary)).toHaveLength(2);
  });

  it("fails closed against an empty (absent skills.yaml) vocabulary", () => {
    const lessons = [{ id: "lesson-a", skills: ["pdas"] }];
    expect(checkSkillVocabulary(lessons, [])).toHaveLength(1);
  });
});

describe("review-eligibility policy (unified launch spec §3 item 7)", () => {
  it("denylists the facet-only tags", () => {
    expect(isReviewEligibleSkill("typescript")).toBe(false);
    expect(isReviewEligibleSkill("react")).toBe(false);
    expect(isReviewEligibleSkill("program-basics")).toBe(false);
    expect(isReviewEligibleSkill("pdas")).toBe(true);
  });

  it("every denylist entry and pair member is a valid skill slug", () => {
    for (const slug of NON_REVIEW_ELIGIBLE_SKILLS) {
      expect(SkillTag.safeParse(slug).success).toBe(true);
    }
    for (const [a, b] of REVIEW_INTERLEAVING_PAIRS) {
      expect(SkillTag.safeParse(a).success).toBe(true);
      expect(SkillTag.safeParse(b).success).toBe(true);
    }
  });

  it("no interleaving-pair member is denylisted (pairs must be review-eligible)", () => {
    for (const [a, b] of REVIEW_INTERLEAVING_PAIRS) {
      expect(isReviewEligibleSkill(a), a).toBe(true);
      expect(isReviewEligibleSkill(b), b).toBe(true);
    }
  });

  it("pair members are distinct within and across pairs", () => {
    const members = REVIEW_INTERLEAVING_PAIRS.flat();
    expect(new Set(members).size).toBe(members.length);
  });
});
