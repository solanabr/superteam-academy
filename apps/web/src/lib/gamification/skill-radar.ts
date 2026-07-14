export interface SkillRadarPoint {
  label: string;
  value: number; // 0-100, normalized so the strongest skill = 100
  lessonCount: number;
}

/**
 * Per-lesson skill attribution for the profile Skills radar (#466 C3). Tally
 * +1 to EACH of a completed lesson's own skills — not to every tag its course
 * carries — across all completed lessons, then normalize so the strongest
 * skill = 100. A learner who did the PDA lessons but not the token lessons
 * shows PDA skill only; the old course-tag approach credited a completed
 * lesson to every one of its course's tags equally (a course-average smear).
 *
 * Pure and DB-free — unit-testable without Supabase or the content store.
 * Shared by both profile pages (`profile/page.tsx`, `profile/[username]/
 * page.tsx`) so "me" and "them" compute the radar identically.
 */
export function completedLessonsToRadar(
  completedLessonIds: readonly string[],
  lessonSkillsMap: ReadonlyMap<string, readonly string[]>,
  maxSkills = 8
): SkillRadarPoint[] {
  const tally = new Map<string, number>();
  for (const lessonId of completedLessonIds) {
    const skills = lessonSkillsMap.get(lessonId) ?? [];
    for (const skill of skills) {
      tally.set(skill, (tally.get(skill) ?? 0) + 1);
    }
  }

  const ranked = [...tally.entries()]
    .map(([skill, lessonCount]) => ({
      label: skill.charAt(0).toUpperCase() + skill.slice(1),
      lessonCount,
    }))
    .sort((a, b) => b.lessonCount - a.lessonCount)
    .slice(0, maxSkills);

  const max = ranked[0]?.lessonCount ?? 1;
  return ranked.map((s) => ({
    ...s,
    value: Math.round((s.lessonCount / max) * 100),
  }));
}
