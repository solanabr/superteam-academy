"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search } from "lucide-react";
import { CourseCard } from "@/components/shared/course-card";
import { contentService } from "@/services/content-service";
import type { CourseSummary, Difficulty } from "@/types/domain";
import { useLocale } from "@/providers/locale-provider";

type FilterValue = Difficulty | "all";
type DurationFilter = "all" | "short" | "medium" | "long";

const FILTERS: Array<{ label: string; value: FilterValue; mono: string }> = [
  { label: "All", value: "all", mono: "ALL" },
  { label: "Beginner", value: "beginner", mono: "INIT" },
  { label: "Intermediate", value: "intermediate", mono: "CORE" },
  { label: "Advanced", value: "advanced", mono: "DEEP" },
];

const ACCENT: Record<FilterValue, string> = {
  all: "#ffffff",
  beginner: "#14F195",
  intermediate: "#9945FF",
  advanced: "#FF8C42",
};

export default function CoursesPage(): React.JSX.Element {
  const { t } = useLocale();
  const [courses, setCourses] = useState<CourseSummary[]>([]);
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<FilterValue>("all");
  const [topic, setTopic] = useState<string>("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [allTopics, setAllTopics] = useState<string[]>([]);
  const [status, setStatus] = useState<"loading" | "ready" | "error">(
    "loading",
  );

  useEffect(() => {
    void contentService
      .getCourses()
      .then((data) => {
        const tracks = [...new Set(data.map((course) => course.track))].sort();
        setAllTopics(tracks);
      })
      .catch(() => setAllTopics([]));
  }, []);

  useEffect(() => {
    const filters: {
      search?: string;
      difficulty?: Difficulty;
      topic?: string;
      duration?: "short" | "medium" | "long";
    } = {};
    if (search) filters.search = search;
    if (difficulty !== "all") filters.difficulty = difficulty;
    if (topic !== "all") filters.topic = topic;
    if (duration !== "all") filters.duration = duration;

    setStatus("loading");
    void contentService
      .getCourses(filters)
      .then((data) => {
        setCourses(data);
        setStatus("ready");
      })
      .catch(() => {
        setCourses([]);
        setStatus("error");
      });
  }, [search, difficulty, topic, duration]);

  const filtered = useMemo(() => {
    if (!search) return courses;
    const needle = search.toLowerCase();
    return courses.filter((c) =>
      `${c.title} ${c.description}`.toLowerCase().includes(needle),
    );
  }, [courses, search]);

  return (
    <div className="space-y-10 pb-24">
      {/* ── Hero ── */}
      <header className="relative pt-12 pb-4 overflow-hidden">
        {/* Background grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "40px 40px",
          }}
        />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative space-y-3"
        >
          <div className="font-mono text-xs tracking-[0.22em] uppercase text-white/30 flex items-center gap-2">
            <span
              className="inline-block h-1.5 w-1.5 rounded-full animate-pulse"
              style={{ background: "#14F195" }}
            />
            {t("courses.subtitle")}
          </div>

          <h1 className="font-bold text-[2.75rem] sm:text-[3.5rem] leading-[1.05] tracking-tight text-white">
            {t("courses.titlePrefix")}{" "}
            <span
              className="relative inline-block"
              style={{
                background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {t("courses.titleHighlight")}
            </span>
          </h1>

          {/* Live counter */}
          <AnimatePresence mode="wait">
            {status === "ready" && (
              <motion.p
                key={filtered.length}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="font-mono text-xs text-white/25 tracking-widest"
              >
                {filtered.length.toString().padStart(2, "0")} records found
              </motion.p>
            )}
          </AnimatePresence>
        </motion.div>
      </header>

      {/* ── Search + Filter ── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        className="flex flex-col md:flex-row gap-3 items-start md:items-center"
      >
        {/* Search */}
        <div className="relative w-full md:max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-white/25 pointer-events-none" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t("courses.searchPlaceholder")}
            className="w-full h-11 pl-10 pr-4 rounded-xl border border-white/[0.09] bg-[#0c1017] text-sm text-white placeholder:text-white/25 outline-none focus:border-white/20 transition-colors font-mono"
          />
        </div>

        {/* Filter chips */}
        <div className="flex gap-2 overflow-x-auto pb-0.5">
          {FILTERS.map((f) => {
            const active = difficulty === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setDifficulty(f.value)}
                className="shrink-0 h-11 px-4 rounded-xl border font-mono text-[11px] tracking-[0.15em] uppercase transition-all duration-200"
                style={{
                  borderColor: active
                    ? ACCENT[f.value] + "55"
                    : "rgba(255,255,255,0.08)",
                  background: active ? ACCENT[f.value] + "14" : "#0c1017",
                  color: active ? ACCENT[f.value] : "rgba(255,255,255,0.35)",
                }}
              >
                {f.mono}
              </button>
            );
          })}
        </div>

        <select
          value={topic}
          onChange={(event) => setTopic(event.target.value)}
          className="h-11 px-4 rounded-xl border border-white/[0.09] bg-[#0c1017] text-sm text-white/80 focus:border-white/20 outline-none transition-colors min-w-[160px] font-mono"
        >
          <option value="all">{t("courses.topicAll")}</option>
          {allTopics.map((entry) => (
            <option key={entry} value={entry}>
              {entry}
            </option>
          ))}
        </select>

        <select
          value={duration}
          onChange={(event) =>
            setDuration(event.target.value as DurationFilter)
          }
          className="h-11 px-4 rounded-xl border border-white/[0.09] bg-[#0c1017] text-sm text-white/80 focus:border-white/20 outline-none transition-colors min-w-[150px] font-mono"
        >
          <option value="all">{t("courses.durationAll")}</option>
          <option value="short">{t("courses.durationShort")}</option>
          <option value="medium">{t("courses.durationMedium")}</option>
          <option value="long">{t("courses.durationLong")}</option>
        </select>
      </motion.div>

      {/* ── Content ── */}
      <div className="min-h-[320px]">
        {status === "loading" && (
          <div className="flex flex-col items-center justify-center h-[280px] gap-4">
            <div className="relative h-10 w-10">
              <div
                className="absolute inset-0 rounded-full border-t-2 animate-spin"
                style={{ borderColor: "#14F195" }}
              />
              <div
                className="absolute inset-2 rounded-full border-t-2 animate-spin opacity-40"
                style={{ borderColor: "#9945FF", animationDuration: "0.7s" }}
              />
            </div>
            <span className="font-mono text-xs tracking-widest text-white/25 animate-pulse">
              {t("courses.loading")}
            </span>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-12 text-center space-y-3">
            <p className="font-mono text-xs tracking-widest text-red-400/70 uppercase">
              ERR — {t("courses.errorTitle")}
            </p>
            <p className="text-sm text-white/40">{t("courses.errorBody")}</p>
          </div>
        )}

        {status === "ready" && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center h-[280px] gap-3">
            <p className="font-mono text-xs tracking-widest text-white/20 uppercase">
              0x00 — {t("courses.emptyTitle")}
            </p>
            <p className="text-sm text-white/30">{t("courses.emptyBody")}</p>
          </div>
        )}

        {status === "ready" && filtered.length > 0 && (
          <motion.div
            className="grid gap-3 md:grid-cols-2"
            initial="hidden"
            animate="visible"
            variants={{
              hidden: {},
              visible: { transition: { staggerChildren: 0.055 } },
            }}
          >
            {filtered.map((course) => (
              <motion.div
                key={course.id}
                variants={{
                  hidden: { opacity: 0, y: 18 },
                  visible: {
                    opacity: 1,
                    y: 0,
                    transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
                  },
                }}
              >
                <CourseCard course={course} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}
