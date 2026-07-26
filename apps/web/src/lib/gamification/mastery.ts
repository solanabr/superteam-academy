/**
 * Per-skill mastery derivation (LX-B16, UIUX R16/F30).
 *
 * Derives skill-level *progress* from completed lessons × their own skill tags
 * (#498, bundle-resolved). Distinct from the profile Skills radar, which shows
 * a learner's strongest skills normalized against each other: mastery shows
 * absolute progress — how many of the lessons carrying a skill the learner has
 * completed. Competence-framed (LX-B10 / #550): a count of lessons practiced,
 * never a spendable balance.
 *
 * Pure and DB-free — unit-testable without Supabase or the content store.
 */

export interface MasterySkill {
  slug: string;
  label: string;
  /** Completed lessons carrying this skill. */
  completed: number;
  /** Total catalog lessons carrying this skill. */
  total: number;
  /** completed / total as a 0-100 percentage. */
  progress: number;
}

/** Humanize a kebab-case skill slug: "account-model" → "Account Model". */
export function labelForSkill(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

/**
 * Tally per-skill progress. For every catalog lesson, its `total` counts once
 * per skill it carries; if that lesson is completed, its `completed` counts
 * too. Only skills the learner has started (completed ≥ 1) are returned,
 * ranked by lessons completed then progress, capped at `maxSkills`.
 */
export function deriveMastery(
  completedLessonIds: readonly string[],
  allLessonSkills: readonly { _id: string; skills: string[] }[],
  { maxSkills = 8 }: { maxSkills?: number } = {}
): MasterySkill[] {
  const completedSet = new Set(completedLessonIds);
  const totals = new Map<string, number>();
  const completed = new Map<string, number>();

  for (const lesson of allLessonSkills) {
    const isDone = completedSet.has(lesson._id);
    for (const skill of lesson.skills) {
      totals.set(skill, (totals.get(skill) ?? 0) + 1);
      if (isDone) completed.set(skill, (completed.get(skill) ?? 0) + 1);
    }
  }

  return [...completed.entries()]
    .map(([slug, done]) => {
      const total = totals.get(slug) ?? done;
      return {
        slug,
        label: labelForSkill(slug),
        completed: done,
        total,
        progress: total > 0 ? Math.round((done / total) * 100) : 0,
      };
    })
    .sort((a, b) => b.completed - a.completed || b.progress - a.progress)
    .slice(0, maxSkills);
}
