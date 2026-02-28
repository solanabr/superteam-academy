import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import { getAllCourses } from "@/lib/data-service";
import { CourseCatalogClient } from "@/components/course/course-catalog-client";

/** Revalidate the course catalog every hour via ISR */
export const revalidate = 3600;

export default async function CoursesPage() {
  const [courses, t] = await Promise.all([
    getAllCourses(),
    getTranslations("courses"),
  ]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      {/* Header — rendered on the server */}
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold sm:text-4xl">{t("catalog.title")}</h1>
        <p className="mt-2 text-lg text-muted-foreground">
          {t("catalog.subtitle")}
        </p>
      </div>

      {/* Interactive filters + grid — client component wrapped in Suspense for useSearchParams */}
      <Suspense>
        <CourseCatalogClient courses={courses} />
      </Suspense>
    </div>
  );
}
