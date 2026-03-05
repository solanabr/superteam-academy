import { getTranslations, getLocale } from "next-intl/server";
import { getAllCourses } from "@/services/cms";
import { CoursesGrid } from "./courses-grid";

export default async function CoursesPage() {
  const t = await getTranslations("courses");
  const locale = await getLocale();
  const courses = await getAllCourses(locale);
  return (
    <div className="container py-8">
      <header className="mb-10 text-center">
        <h1 className="text-3xl font-bold tracking-tight text-[hsl(var(--brand-logo-green))] drop-shadow-md">
          {t("title")}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{t("subtitle")}</p>
      </header>
      <CoursesGrid courses={courses} />
    </div>
  );
}
