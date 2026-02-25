import type { Metadata } from "next";
import { PlatformLayout } from "@/components/layout";
import { courseService } from "@/services";
import { CourseCatalog } from "./course-catalog";

export const metadata: Metadata = {
  title: "Courses",
};

export default async function CoursesPage() {
  const courses = await courseService.getCourses();

  return (
    <PlatformLayout>
      <CourseCatalog initialCourses={courses} />
    </PlatformLayout>
  );
}
