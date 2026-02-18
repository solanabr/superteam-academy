"use client";

import { useEffect, useState } from "react";
import { Link } from "@/i18n/routing";
import { Footer } from "@/components/layout/Footer";
import { getCourses, type CourseListItem } from "@/sanity/lib/queries";
import { useTranslations } from "next-intl";

export default function CoursesPage() {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const [courses, setCourses] = useState<CourseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>("all");

  useEffect(() => {
    getCourses()
      .then((data) => {
        setCourses(data);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error("Failed to fetch courses:", error);
        setIsLoading(false);
      });
  }, []);

  // Filter courses by track
  const filteredCourses = filter === "all"
    ? courses
    : courses.filter(c => c.track?.toLowerCase() === filter.toLowerCase());

  const getDifficultyIcon = (difficulty?: string) => {
    switch (difficulty?.toLowerCase()) {
      case "beginner": return "bar_chart_4_bars";
      case "intermediate": return "bar_chart";
      case "advanced": return "signal_cellular_alt";
      default: return "bar_chart";
    }
  };

  const tracks = ["all", "rust", "anchor", "security", "solana"];

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Main Content */}
      <main className="pt-8 pb-20 px-6 max-w-7xl mx-auto flex flex-col gap-10">
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

        {/* Filters */}
        <div className="flex flex-wrap gap-3 overflow-x-auto pb-2 no-scrollbar">
          {tracks.map((track) => (
            <button
              key={track}
              onClick={() => setFilter(track)}
              className={`px-3 py-1 rounded text-[11px] font-mono transition-all uppercase tracking-wider ${filter === track ? "bg-[#1F1F1F] text-white border border-[#383838]" : "border border-[#1F1F1F] bg-transparent text-[#8F9099] hover:bg-white/5"}`}
            >
              {t(`filters.${track}`)}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {isLoading ? (
            <div className="col-span-full text-center py-12 text-text-secondary">
              {t("loading")}
            </div>
          ) : filteredCourses.length === 0 ? (
            <div className="col-span-full text-center py-12 text-text-secondary">
              {filter === "all" ? t("none_available") : t("none_found", { filter: t(`filters.${filter}`) })}
            </div>
          ) : (
            filteredCourses.map((course) => (
              <Link key={course._id} href={`/courses/${course.slug}`}>
                <div className="glass-panel group rounded-xl overflow-hidden flex flex-col h-full cursor-pointer relative border border-[#1F1F1F] bg-[#0D0D0E]">
                  <div className={`h-48 w-full relative overflow-hidden bg-gradient-to-br ${course.track === "rust" ? "from-rust/10" : course.track === "solana" ? "from-solana/10" : "from-purple-500/10"} to-void`}>
                    <div className="absolute inset-0 flex items-center justify-center opacity-80 group-hover:scale-105 transition-transform duration-500">
                      <span className={`material-symbols-outlined notranslate text-6xl ${course.track === "rust" ? "text-rust/40" : course.track === "solana" ? "text-solana/40" : "text-purple-500/40"}`}>
                        {course.track === "rust" ? "terminal" : course.track === "anchor" ? "anchor" : "code"}
                      </span>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-[#0A0A0B] to-transparent opacity-60"></div>
                  </div>
                  <div className="p-5 flex flex-col flex-1 gap-4">
                    <div className="flex justify-between items-start">
                      <h3 className="font-display text-xl font-bold text-white leading-tight group-hover:text-solana transition-colors">{course.title}</h3>
                      <div className="size-8 rounded-full border border-white/10 flex items-center justify-center bg-white/5 group-hover:bg-solana group-hover:text-void transition-colors">
                        <span className="material-symbols-outlined notranslate text-[18px]">arrow_outward</span>
                      </div>
                    </div>
                    <p className="text-text-secondary text-sm line-clamp-2">{course.description || "No description available."}</p>
                    <div className="mt-auto pt-4 border-t border-white/10 flex items-center gap-4 text-xs font-mono text-text-secondary">
                      <span className="flex items-center gap-1.5 text-solana">
                        <span className="material-symbols-outlined notranslate text-[14px]">{getDifficultyIcon(course.difficulty)}</span>
                        {course.difficulty ? t(course.difficulty.toLowerCase() as any) : t("beginner")}
                      </span>
                      <span className="w-1 h-1 rounded-full bg-[#1F1F1F]"></span>
                      <span className="flex items-center gap-1.5">
                        <span className="material-symbols-outlined notranslate text-[14px]">schedule</span>
                        {course.duration || t("duration_tbd")}
                      </span>
                    </div>
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </main>

      {/* Footer with Made With Love */}
      <Footer />
    </div>
  );
}
