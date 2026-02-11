import { CourseCatalogClient } from "./courses-client";
import { getAllCourses } from "@/lib/sanity/queries";

export default async function CoursesPage() {
  const courses = await getAllCourses();
  return <CourseCatalogClient courses={courses} />;
}
