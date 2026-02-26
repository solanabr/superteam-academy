import { getCourses } from "@/sanity/lib/queries";
import { getTranslations } from "next-intl/server";
import { CoursesFilter } from "./client-components/CoursesFilter";

export default async function CoursesPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const t = await getTranslations("courses");

  // Fetch courses directly on the server with locale for caching
  const courses = await getCourses(locale);

  return (
    <main className="pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-6 space-y-10 flex flex-col pt-4">
        <div className="flex flex-col gap-2 max-w-2xl">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">{t("title")}</h2>
          <p className="text-text-secondary font-body text-lg">{t("subtitle")}</p>
        </div>

        {/* Client-side Filters and Grid */}
        <CoursesFilter courses={courses} />

      </div>
    </main>
  );
}
