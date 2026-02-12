import type { CmsCourse } from "@/lib/cms/types";

export function filterCoursesByText(courses: CmsCourse[], q: string): CmsCourse[] {
  const needle = q.trim().toLowerCase();
  if (!needle) {
    return courses;
  }

  return courses.filter((course) => {
    const inCourse =
      course.title.toLowerCase().includes(needle) ||
      course.description.toLowerCase().includes(needle) ||
      course.topic.toLowerCase().includes(needle);

    const inLessons = course.modules.some((module) =>
      module.lessons.some(
        (lesson) =>
          lesson.title.toLowerCase().includes(needle) || lesson.content.toLowerCase().includes(needle)
      )
    );

    return inCourse || inLessons;
  });
}
