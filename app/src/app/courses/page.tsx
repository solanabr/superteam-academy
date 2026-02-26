"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import {
  Search,
  Clock,
  BookOpen,
  Star,
  Zap,
  Users,
  X,
  ChevronRight,
  Flame,
  Code2,
} from "lucide-react";
import { PageLayout } from "@/components/layout/page-layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { MOCK_COURSES, TRACKS } from "@/lib/mock-data";
import { formatXP } from "@/lib/utils/xp";
import { CourseDifficulty } from "@/types";
import { cn } from "@/lib/utils/cn";

const difficulties: { value: CourseDifficulty | "all"; label: string; color?: string }[] = [
  { value: "all", label: "All Levels" },
  { value: "beginner", label: "Beginner", color: "#14F195" },
  { value: "intermediate", label: "Intermediate", color: "#9945FF" },
  { value: "advanced", label: "Advanced", color: "#FF6B35" },
  { value: "expert", label: "Expert", color: "#FFD700" },
];

const sortOptions = [
  { value: "popular", label: "Most Popular" },
  { value: "newest", label: "Newest" },
  { value: "xp", label: "Most XP" },
  { value: "rating", label: "Highest Rated" },
];

const difficultyColors: Record<string, string> = {
  beginner: "#14F195",
  intermediate: "#9945FF",
  advanced: "#FF6B35",
  expert: "#FFD700",
};

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<CourseDifficulty | "all">("all");
  const [selectedTrack, setSelectedTrack] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState("popular");

  const filtered = useMemo(() => {
    let courses = [...MOCK_COURSES];
    if (search) {
      const q = search.toLowerCase();
      courses = courses.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q) ||
          c.tags.some((t) => t.includes(q))
      );
    }
    if (difficulty !== "all") courses = courses.filter((c) => c.difficulty === difficulty);
    if (selectedTrack !== null) courses = courses.filter((c) => c.trackId === selectedTrack);
    courses.sort((a, b) => {
      switch (sortBy) {
        case "popular": return b.enrolledCount - a.enrolledCount;
        case "newest": return b.createdAt.getTime() - a.createdAt.getTime();
        case "xp": return b.xpReward - a.xpReward;
        case "rating": return b.rating - a.rating;
        default: return 0;
      }
    });
    return courses;
  }, [search, difficulty, selectedTrack, sortBy]);

  return (
    <PageLayout>
      <div className="min-h-screen pt-20 pb-16">

        {/* Page header */}
        <div className="relative overflow-hidden pt-12 pb-10 px-4 sm:px-6 lg:px-8 mb-6">
          <div className="absolute inset-0 bg-grid opacity-[0.15]" />
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#9945FF]/30 to-transparent" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-[#9945FF]/8 blur-[80px] pointer-events-none" />

          <div className="max-w-7xl mx-auto relative z-10">
            <div className="flex items-start justify-between">
              <div>
                <div className="highlight-chip mb-4">
                  <BookOpen className="w-3 h-3" />
                  Learn by Building
                </div>
                <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-3">
                  Solana{" "}
                  <span className="gradient-text">Courses</span>
                </h1>
                <p className="text-muted-foreground text-lg max-w-lg">
                  From your first Rust program to production DeFi protocols —
                  taught by active Solana builders.
                </p>
              </div>
              {/* Quick stats */}
              <div className="hidden lg:flex gap-4 items-start mt-2">
                {[
                  { icon: BookOpen, value: `${MOCK_COURSES.length}`, label: "Courses" },
                  { icon: Zap, value: "10.5K", label: "Max XP" },
                  { icon: Users, value: "5K+", label: "Learners" },
                ].map((s) => (
                  <div key={s.label} className="glass-v2 px-4 py-2.5 text-center rounded-xl">
                    <s.icon className="w-3.5 h-3.5 text-[#9945FF] mx-auto mb-1" />
                    <p className="text-base font-bold text-foreground">{s.value}</p>
                    <p className="text-[10px] text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Filters bar */}
          <div className="glass-v2 p-4 rounded-2xl mb-6 flex flex-col lg:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search courses, topics, technologies..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-9 bg-white/5 border-white/8 text-sm"
              />
              <AnimatePresence>
                {search && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    onClick={() => setSearch("")}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" />
                  </motion.button>
                )}
              </AnimatePresence>
            </div>

            {/* Difficulty pills */}
            <div className="flex gap-1.5 flex-wrap">
              {difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 border",
                    difficulty === d.value
                      ? "border-transparent text-white shadow-sm"
                      : "bg-transparent border-white/10 text-muted-foreground hover:border-white/20 hover:text-foreground"
                  )}
                  style={
                    difficulty === d.value
                      ? {
                          background: d.color
                            ? `linear-gradient(135deg, ${d.color}dd, ${d.color}88)`
                            : "hsl(var(--primary))",
                        }
                      : {}
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 border border-white/10 text-foreground focus:outline-none focus:ring-1 focus:ring-[#9945FF]/50 cursor-pointer"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value} className="bg-[#0a0a0f]">
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Track pills */}
          <div className="flex gap-2 flex-wrap mb-6">
            <button
              onClick={() => setSelectedTrack(null)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                selectedTrack === null
                  ? "bg-[#9945FF]/15 border-[#9945FF]/40 text-[#9945FF]"
                  : "bg-white/3 border-white/8 text-muted-foreground hover:border-white/15 hover:text-foreground"
              )}
            >
              All Tracks
            </button>
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setSelectedTrack(track.id)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all border",
                  selectedTrack === track.id
                    ? "border-opacity-60 text-white"
                    : "bg-white/3 border-white/8 text-muted-foreground hover:border-white/15"
                )}
                style={
                  selectedTrack === track.id
                    ? { backgroundColor: `${track.color}20`, borderColor: `${track.color}50`, color: track.color }
                    : {}
                }
              >
                <span>{track.icon}</span> {track.name}
              </button>
            ))}
          </div>

          {/* Results info */}
          <div className="flex items-center justify-between mb-5">
            <p className="text-sm text-muted-foreground">
              <span className="text-foreground font-semibold">{filtered.length}</span>{" "}
              course{filtered.length !== 1 ? "s" : ""} found
            </p>
            {(search || difficulty !== "all" || selectedTrack !== null) && (
              <button
                onClick={() => { setSearch(""); setDifficulty("all"); setSelectedTrack(null); }}
                className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" /> Clear filters
              </button>
            )}
          </div>

          {/* Course Grid */}
          {filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-muted-foreground text-lg mb-2">No courses found</p>
              <p className="text-muted-foreground/60 text-sm mb-6">Try adjusting your search or filters</p>
              <Button
                variant="glass"
                size="sm"
                onClick={() => { setSearch(""); setDifficulty("all"); setSelectedTrack(null); }}
              >
                Clear all filters
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
            >
              <AnimatePresence mode="popLayout">
                {filtered.map((course, index) => {
                  const diffColor = difficultyColors[course.difficulty] ?? "#9945FF";
                  return (
                    <motion.div
                      key={course.id}
                      layout
                      initial={{ opacity: 0, scale: 0.96 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.25, delay: index * 0.04 }}
                    >
                      <Link href={`/courses/${course.slug}`} className="block h-full">
                        <div className="gradient-border-card card-shine h-full group overflow-hidden cursor-pointer transition-all duration-300 hover:-translate-y-1">
                          {/* Thumbnail */}
                          <div className="relative h-44 overflow-hidden">
                            <div
                              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 group-hover:scale-105"
                              style={{
                                backgroundImage: `url(${course.thumbnail})`,
                                backgroundColor: `${course.track.color}20`,
                              }}
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-[#0a0a0f]/30 to-transparent" />

                            {/* Top badges */}
                            <div className="absolute top-3 left-3 flex items-center gap-2">
                              <span
                                className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border"
                                style={{
                                  color: diffColor,
                                  backgroundColor: `${diffColor}18`,
                                  borderColor: `${diffColor}35`,
                                }}
                              >
                                {course.difficulty}
                              </span>
                              {index === 0 && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 flex items-center gap-1">
                                  <Flame className="w-2.5 h-2.5" /> Popular
                                </span>
                              )}
                            </div>

                            {/* XP badge */}
                            <div className="absolute top-3 right-3 xp-pill text-[11px]">
                              <Zap className="w-3 h-3" />
                              {formatXP(course.xpReward)} XP
                            </div>

                            {/* Bottom track color bar */}
                            <div
                              className="absolute bottom-0 left-0 right-0 h-0.5"
                              style={{ background: `linear-gradient(to right, ${course.track.color}, transparent)` }}
                            />
                          </div>

                          {/* Content */}
                          <div className="p-5">
                            <div className="flex items-center gap-1.5 mb-2">
                              <span className="text-sm">{course.track.icon}</span>
                              <span className="text-xs font-medium" style={{ color: course.track.color }}>
                                {course.track.name}
                              </span>
                            </div>

                            <h3 className="font-semibold text-sm mb-1.5 group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                              {course.title}
                            </h3>
                            <p className="text-xs text-muted-foreground line-clamp-2 mb-3 leading-relaxed">
                              {course.shortDescription}
                            </p>

                            {/* Skill tags */}
                            <div className="flex flex-wrap gap-1 mb-3">
                              {course.tags.slice(0, 3).map((tag) => (
                                <span
                                  key={tag}
                                  className="skill-tag"
                                  style={{
                                    color: `${diffColor}cc`,
                                    borderColor: `${diffColor}25`,
                                    backgroundColor: `${diffColor}0c`,
                                  }}
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>

                            {/* Meta */}
                            <div className="flex items-center gap-3 text-[11px] text-muted-foreground mb-3">
                              <span className="flex items-center gap-1">
                                <BookOpen className="h-3 w-3" />
                                {course.lessonCount} lessons
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {Math.floor(course.duration / 60)}h
                              </span>
                              <span className="flex items-center gap-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                {course.rating}
                              </span>
                              <span className="flex items-center gap-1">
                                <Code2 className="h-3 w-3 text-[#9945FF]" />
                                {course.tags.includes("anchor") ? "Anchor" : "Web3.js"}
                              </span>
                            </div>

                            {/* Footer */}
                            <div className="flex items-center justify-between pt-3 border-t border-white/[0.07]">
                              <div className="flex items-center gap-2">
                                <div className="w-5 h-5 rounded-full bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center text-[9px] font-bold text-white">
                                  {course.instructor.name.charAt(0)}
                                </div>
                                <span className="text-[11px] text-muted-foreground truncate max-w-[100px]">
                                  {course.instructor.name}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1 text-[11px] text-muted-foreground">
                                  <Users className="h-3 w-3" />
                                  {course.enrolledCount.toLocaleString()}
                                </div>
                                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                              </div>
                            </div>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
