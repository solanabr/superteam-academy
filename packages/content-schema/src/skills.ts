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
});
export type SkillDefT = z.infer<typeof SkillDef>;

/**
 * Shape of courses-academy's repo-root `skills.yaml` — the canonical skill
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
