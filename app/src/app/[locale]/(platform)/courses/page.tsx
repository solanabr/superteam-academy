import { Footer } from "@/components/layout/Footer";
import { getCourses } from "@/sanity/lib/queries";
import { getTranslations } from "next-intl/server";
import { CoursesFilter } from "./client-components/CoursesFilter";

export default async function CoursesPage() {
  const t = await getTranslations("courses");

  // Fetch courses directly on the server
  const courses = await getCourses();

  return (
    <main className="min-h-screen bg-void pt-4 pb-12">
      <div className="max-w-7xl mx-auto px-6 space-y-10 flex flex-col pt-4">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="flex flex-col gap-2 max-w-2xl">
            <h2 className="font-display text-4xl md:text-5xl font-bold text-white tracking-tight">{t("title")}</h2>
            <p className="text-text-secondary font-body text-lg">{t("subtitle")}</p>
          </div>
          {/* Search */}
          <div className="relative w-full md:w-72 group">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary/50 material-symbols-outlined notranslate text-[18px]">search</span>
            <input
              className="w-full bg-[#0A0A0B] border border-[#1F1F1F] text-[#EDEDEF] rounded-md pl-9 pr-3 py-1.5 text-xs font-mono transition-colors placeholder:text-text-secondary/30 focus:border-[#383838] focus:outline-none"
              placeholder={t("search_placeholder")}
              type="text"
            />
          </div>
        </div>

        {/* Client-side Filters and Grid */}
        <CoursesFilter courses={courses} />

      </div>
      <Footer />
    </main>
  );
}
