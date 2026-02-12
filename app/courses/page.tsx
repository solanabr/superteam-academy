"use client";

import { CourseGrid } from "@/components/courses/CourseGrid";
import { useI18n } from "@/lib/i18n/provider";

export default function CoursesPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10">
      <section className="space-y-2">
        <h1 className="text-3xl font-bold">{t("courses.title")}</h1>
        <p className="text-muted-foreground">{t("courses.subtitle")}</p>
      </section>
      <CourseGrid />
    </div>
  );
}
