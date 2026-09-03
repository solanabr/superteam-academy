import { getAllCourses, getAllLearningPaths } from "@/lib/content/queries";
import { CourseCatalogClient } from "./courses-client";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [courses, learningPaths] = await Promise.all([
    getAllCourses(locale),
    getAllLearningPaths(locale),
  ]);
  return (
    <CourseCatalogClient courses={courses} learningPaths={learningPaths} />
  );
}
