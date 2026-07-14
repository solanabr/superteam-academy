import { z } from "zod";

const unique = <T>(xs: readonly T[]) => new Set(xs).size === xs.length;

/**
 * A skill tag: a kebab-case slug, same shape as course/lesson slugs. Lessons
 * carry `skills: SkillTag[]` (see `lesson.ts`). Membership against the
 * canonical vocabulary (`SkillsTaxonomy` below) is NOT enforced here — that is
 * #466 C3. This package only validates the slug's shape.
 */
export const SkillTag = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/);
export type SkillTagT = z.infer<typeof SkillTag>;

/** One entry in the canonical skill vocabulary. */
export const SkillDef = z.object({
  slug: SkillTag,
  label: z.string().min(1).optional(),
  description: z.string().optional(),
});
export type SkillDefT = z.infer<typeof SkillDef>;

/**
 * Shape of the future courses-academy `skills.yaml` — the canonical skill
 * vocabulary. Unlike `course.yaml`/`lesson.yaml`/etc. this is a single file at
 * the content repo root, not one-per-course or one-per-item, so it parses to a
 * flat list rather than a per-doc object.
 *
 * `skills.yaml` does not exist in courses-academy yet (#466 C2 adds it); the
 * compiler (`lib/content/compile`) tolerates its absence by loading an empty
 * list. This schema is C1 — plumbing only, no enforcement that lesson `skills`
 * are members of this vocabulary (that is C3).
 */
export const SkillsTaxonomy = z
  .array(SkillDef)
  .refine((skills) => unique(skills.map((s) => s.slug)), {
    message: "skill slugs must be unique",
  });
export type SkillsTaxonomyT = z.infer<typeof SkillsTaxonomy>;
