"use client";

import { useState, ChangeEvent, useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { useI18n } from "@/components/providers/I18nProvider";

type TrackCategory = "all" | "fundamentals" | "defi" | "security" | "advanced";

interface LearningTrack {
  id: string;
  label: string;
  title: string;
  category: Exclude<TrackCategory, "all">;
  searchKeywords: string;
  courseCount: number;
}

const tracks: LearningTrack[] = [
  {
    id: "solana-fundamentals",
    label: "01",
    title: "Solana Fundamentals",
    category: "fundamentals",
    searchKeywords: "solana basics blockchain intro beginner",
    courseCount: 8,
  },
  {
    id: "rust-for-solana",
    label: "02",
    title: "Rust for Solana",
    category: "fundamentals",
    searchKeywords: "rust programming language systems",
    courseCount: 6,
  },
  {
    id: "anchor-development",
    label: "03",
    title: "Anchor Development",
    category: "advanced",
    searchKeywords: "anchor framework smart contracts programs",
    courseCount: 5,
  },
  {
    id: "defi-protocols",
    label: "04",
    title: "DeFi Protocols",
    category: "defi",
    searchKeywords: "defi decentralized finance swap lending",
    courseCount: 4,
  },
  {
    id: "security-auditing",
    label: "05",
    title: "Security & Auditing",
    category: "security",
    searchKeywords: "security audit vulnerability exploit",
    courseCount: 3,
  },
  {
    id: "full-stack-dapps",
    label: "06",
    title: "Full-Stack dApps",
    category: "advanced",
    searchKeywords: "fullstack frontend backend nextjs react",
    courseCount: 7,
  },
];

const categories: { key: TrackCategory; label: string }[] = [
  { key: "all", label: "All Tracks" },
  { key: "fundamentals", label: "Fundamentals" },
  { key: "defi", label: "DeFi" },
  { key: "security", label: "Security" },
  { key: "advanced", label: "Advanced" },
];

export function LearningPathsSection() {
  const [searchTerm, setSearchTerm] = useState("");
  const [category, setCategory] = useState<TrackCategory>("all");
  const { t } = useI18n();
  const sectionRef = useRef<HTMLElement>(null);
  const isInView = useInView(sectionRef, { once: true, margin: "-100px" });

  const handleSearchChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value.toLowerCase());
  };

  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      !searchTerm ||
      track.searchKeywords.toLowerCase().includes(searchTerm) ||
      track.title.toLowerCase().includes(searchTerm);
    const matchesCategory =
      category === "all" || track.category === category;
    return matchesSearch && matchesCategory;
  });

  return (
    <section ref={sectionRef} className="mt-20 scroll-mt-24" id="learning-paths">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 md:gap-0">
        {/* Left side -- sticky heading + search */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="md:pr-24 md:border-r border-neutral-200 dark:border-neutral-800 sticky top-32 self-start"
        >
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="md:text-5xl lg:text-6xl leading-tight text-balance text-4xl font-semibold tracking-tighter mb-12"
          >
            {t("landing.pathsTitle")}
          </motion.h3>

          {/* Search */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative w-full max-w-sm group"
          >
            <input
              type="text"
              className="w-full border-b border-neutral-300 dark:border-neutral-700 py-4 bg-transparent text-lg placeholder-neutral-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors pl-0"
              placeholder="Search tracks..."
              value={searchTerm}
              onChange={handleSearchChange}
            />
            <div className="absolute right-0 top-4 transition-transform duration-300 group-focus-within:scale-110 group-focus-within:text-black dark:group-focus-within:text-white text-neutral-400">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-6 h-6"
              >
                <path d="m21 21-4.34-4.34" />
                <circle cx="11" cy="11" r="8" />
              </svg>
            </div>
          </motion.div>

          {/* Category Filters */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-12 flex flex-wrap gap-3"
          >
            {categories.map((cat) => (
              <button
                key={cat.key}
                type="button"
                onClick={() => setCategory(cat.key)}
                className={`px-4 py-2 rounded-full text-xs font-medium transition-colors ${
                  category === cat.key
                    ? "bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 hover:bg-neutral-700 dark:hover:bg-neutral-200"
                    : "bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200 dark:hover:bg-neutral-700"
                }`}
              >
                {cat.label}
              </button>
            ))}
          </motion.div>
        </motion.div>

        {/* Right side -- Track List */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={isInView ? { opacity: 1, x: 0 } : {}}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="md:pl-24 flex flex-col min-h-[500px] h-full justify-between"
        >
          <ul className="space-y-4 text-right md:text-right w-full">
            {filteredTracks.map((track, index) => {
              const isPrimary =
                track.id === "anchor-development"
                  ? "text-black dark:text-white"
                  : "text-neutral-400";

              return (
                <motion.li
                  key={track.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={isInView ? { opacity: 1, x: 0 } : {}}
                  transition={{ duration: 0.4, delay: 0.3 + index * 0.1 }}
                  className="group"
                >
                  <Link
                    href={`/courses?track=${track.id}`}
                    className="block border-b border-neutral-100 dark:border-neutral-800 pb-8 hover:border-neutral-900 dark:hover:border-white transition-all duration-300"
                  >
                    <div className="flex justify-between md:justify-end items-center gap-12">
                      <span className="text-sm font-mono text-neutral-300 dark:text-neutral-600 group-hover:text-black dark:group-hover:text-white transition-colors">
                        {track.label}
                      </span>
                      <span
                        className={`text-2xl md:text-3xl font-medium group-hover:text-black dark:group-hover:text-white group-hover:translate-x-[-10px] transition-all duration-300 ${isPrimary}`}
                      >
                        {track.title}
                      </span>
                    </div>
                    <div className="flex justify-end mt-2">
                      <span className="text-xs text-neutral-400 group-hover:text-neutral-600 dark:group-hover:text-neutral-300 transition-colors">
                        {track.courseCount} courses
                      </span>
                    </div>
                  </Link>
                </motion.li>
              );
            })}
          </ul>

          {filteredTracks.length === 0 && (
            <p className="text-center text-neutral-400 py-12">
              No tracks found.
            </p>
          )}

          {/* CTA Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={isInView ? { opacity: 1, y: 0 } : {}}
            transition={{ duration: 0.6, delay: 0.8 }}
            className="self-end hover:-translate-y-2 transition-transform duration-500 md:mt-8 bg-white dark:bg-neutral-900 w-full max-w-sm border-neutral-200 dark:border-neutral-800 border rounded-2xl mt-16 pt-8 pr-8 pb-8 pl-8 shadow-xl"
          >
            <div className="w-10 h-10 bg-neutral-900 dark:bg-white rounded-full flex items-center justify-center mb-6">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="w-5 h-5 text-white dark:text-neutral-900"
              >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
              </svg>
            </div>
            <h4 className="text-xl font-semibold mb-2 leading-tight">
              Code Editor Built In
            </h4>
            <p className="text-neutral-500 dark:text-neutral-400 text-sm mb-8">
              Write Rust and TypeScript directly in the browser. No setup
              required.
            </p>

            <Link
              href="/courses"
              className="w-full flex items-center justify-between bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 pl-6 pr-4 py-3.5 text-sm font-semibold rounded-full hover:bg-neutral-800 dark:hover:bg-neutral-200 transition-all hover:pr-3 group"
            >
              {t("common.browseCourses")}
              <div className="bg-white/20 dark:bg-black/20 rounded-full p-1 group-hover:bg-white/30 dark:group-hover:bg-black/30 transition-colors">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <path d="M5 12h14" />
                  <path d="m12 5 7 7-7 7" />
                </svg>
              </div>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
