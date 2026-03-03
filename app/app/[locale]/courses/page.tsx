import { courseService } from "@/lib/services";
import { CourseGrid } from "@/components/course-grid";
import { getTranslations } from "next-intl/server";

export default async function CoursesPage() {
  const courses = await courseService.getCourses();
  const t = await getTranslations("courses");

  return (
    <div className="py-4 mx-auto max-w-6xl">
      <div className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">
          {t("heading")}
        </h1>
        <p className="mt-2 max-w-lg text-muted-foreground">
          {t("description")}
        </p>
      </div>

      <CourseGrid courses={courses} />
    </div>
  );
}
