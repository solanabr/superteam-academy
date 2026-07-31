interface OrdinalModule {
  lessons: { _id: string }[];
}

/**
 * Maps every lesson `_id` to its 1-based position in the course's flattened
 * module→lesson order — the SAME order `getCourseLessons` returns, which the
 * lesson page uses for prev/next and for the ordinal it prints on the h1.
 *
 * Curriculum lists used to number lessons per module (each module restarting at
 * 1), which contradicted the lesson page's course-wide number. One source now.
 */
export function courseWideOrdinals(
  modules: OrdinalModule[]
): Map<string, number> {
  const ordinals = new Map<string, number>();
  let n = 0;
  for (const mod of modules) {
    for (const lesson of mod.lessons) {
      n += 1;
      ordinals.set(lesson._id, n);
    }
  }
  return ordinals;
}
