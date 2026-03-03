import { getAllCourses } from "@/lib/data-service";
import { CourseCreator } from "@/components/admin/course-creator";

export const metadata = {
  title: "Course Creator",
};

export default async function NewCoursePage() {
  const courses = await getAllCourses();
  const availableCourses = courses.map((c) => ({
    slug: c.slug,
    title: c.title,
  }));
  return <CourseCreator availableCourses={availableCourses} />;
}
