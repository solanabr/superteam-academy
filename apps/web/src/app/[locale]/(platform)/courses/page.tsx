import { CourseCatalogClient } from "./courses-client";
import { getAllCourses, getAllLearningPaths } from "@/lib/content/queries";

export default async function CoursesPage() {
  const [courses, learningPaths] = await Promise.all([
    getAllCourses(),
    getAllLearningPaths(),
  ]);
  return (
    <CourseCatalogClient courses={courses} learningPaths={learningPaths} />
  );
}
