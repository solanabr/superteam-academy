import { z } from "zod";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * A skill tag: a kebab-case slug, same shape as course/lesson slugs. Lessons
 * carry `skills: SkillTag[]` (see `lesson.ts`), required and non-empty. This
 * package only validates the slug's shape; cross-checking a lesson's slugs
 * against the canonical vocabulary is {@link checkSkillVocabulary} below (#466
 * C3), invoked by the compiler, not by this Zod schema.
 */
export const SkillTag = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export type SkillTagT = z.infer<typeof SkillTag>;

/** One entry in the canonical skill vocabulary. */
export const SkillDef = z.object({
  slug: SkillTag,
  label: z.string().min(1).optional(),
  description: z.string().optional(),
  /**
   * Marks a slug as single-use *by design* (catalog spec §5 policy 4). A tag so
   * marked is exempt from content-lint gate 19b's ≥2-lesson reuse bar: the
   * author is declaring "this tag will only ever back one lesson" (e.g.
   * `brazil-compliance`, `earn-submission`) rather than the linter guessing.
   * Optional and defaulting to absent, so every existing entry keeps its
   * current (non-exempt) behaviour. Purely a review-bar signal — it has no
   * bearing on registry resolution (19a) or facet-only classification (19d).
   */
  reviewExempt: z.boolean().optional(),
});
export type SkillDefT = z.infer<typeof SkillDef>;

/**
 * Shape of academy-courses's repo-root `skills.yaml` — the canonical skill
 * vocabulary. Unlike `course.yaml`/`lesson.yaml`/etc. this is a single file at
 * the content repo root, not one-per-course or one-per-item, so it parses to a
 * flat list rather than a per-doc object.
 *
 * The compiler (`lib/content/compile`) tolerates the file's absence by loading
 * an empty list — but since every lesson now carries `skills` (required,
 * non-empty), an absent or incomplete vocabulary means every tagged lesson
 * fails {@link checkSkillVocabulary} (#466 C3): a real content tree always
 * ships this file.
 */
export const SkillsTaxonomy = z
  .array(SkillDef)
  .refine((skills) => unique(skills.map((s) => s.slug)), {
    message: "skill slugs must be unique",
  });
export type SkillsTaxonomyT = z.infer<typeof SkillsTaxonomy>;

/**
 * Skill tags that are catalog facets ONLY — never review keys (unified launch
 * spec 2026-07-25 §3 item 7, restored from CAT-24). Tags of this grain
 * ("typescript", "react", …) retrieve nothing useful for spaced review: a
 * review set keyed on them would span half the catalog. They stay legal on
 * lessons (the catalog and skill radar still facet on them); the review-set
 * builder (Wave 3) must exclude them via {@link isReviewEligibleSkill}, and
 * content-lint gate 19d surfaces them as facet-only notices.
 */
export const NON_REVIEW_ELIGIBLE_SKILLS = [
  "typescript",
  "react",
  "program-basics",
] as const;
export type NonReviewEligibleSkill =
  (typeof NON_REVIEW_ELIGIBLE_SKILLS)[number];

/** True iff `slug` may key a review set (i.e. it is not a facet-only tag). */
export function isReviewEligibleSkill(slug: string): boolean {
  return !(NON_REVIEW_ELIGIBLE_SKILLS as readonly string[]).includes(slug);
}

/**
 * The interleaving pairs Wave 3's review sets must be able to express
 * (unified launch spec 2026-07-25 §3 item 7). Both members of each pair must
 * exist in `skills.yaml` AND be applied to ≥2 lessons each; content-lint
 * gate 19c asserts this against the content tree. Shared from here so the
 * review-set builder consumes the same pairs the linter enforces.
 */
export const REVIEW_INTERLEAVING_PAIRS: readonly (readonly [string, string])[] =
  [
    ["pdas", "account-model"],
    ["cpi", "signers"],
    ["anchor", "program-security"],
    ["checked-arithmetic", "rust-result"],
    ["compute-budget", "transaction-fees"],
  ] as const;

/**
 * The C3 allowlist guarantee: every lesson `skills` slug must be a member of
 * the canonical vocabulary. Pure and side-effect-free — callers (the offline
 * compiler and the admin-sync validator) accumulate the returned issues into
 * their own fail-closed validation pass and throw once. Returns one issue
 * string per (lesson, unknown slug) pair, naming both so a content author can
 * fix it directly; `[]` means every lesson skill is a known vocabulary member.
 */
export function checkSkillVocabulary(
  lessons: readonly { id: string; skills: readonly string[] }[],
  vocabulary: SkillsTaxonomyT
): string[] {
  const known = new Set(vocabulary.map((s) => s.slug));
  const issues: string[] = [];
  for (const lesson of lessons) {
    for (const slug of lesson.skills) {
      if (!known.has(slug)) {
        issues.push(
          `lesson ${lesson.id}: skill "${slug}" is not in the skills.yaml vocabulary`
        );
      }
    }
  }
  return issues;
}
