import "server-only";

import { getAllCourses } from "@/lib/server/admin-store";

export type CatalogCourseMeta = {
  slug: string;
  lessonsCount: number;
  trackId: number;
};

export function getCatalogCourseMeta(slug: string): CatalogCourseMeta | null {
  const courses = getAllCourses();
  const index = courses.findIndex((item) => item.slug === slug);
  if (index < 0) return null;
  const course = courses[index];
  const lessonsCount = course.modules.reduce(
    (acc, module) => acc + module.lessons.length,
    0,
  );
  return {
    slug,
    lessonsCount,
    trackId: index + 1,
  };
}
