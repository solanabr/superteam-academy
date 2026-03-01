"use client";

import { CourseCard } from "@/components/CourseCard";
import { Footer } from "@/components/Footer";
import { Search, Filter, BookOpen, Grid3X3, List, Sparkles } from "lucide-react";
import { useState } from "react";
import { COURSES } from "@/data/courses";

const TRACKS = ["All", "Development", "Advanced", "Infrastructure", "Security", "DeFi", "NFTs"];
const DIFFICULTIES = ["All", "Beginner", "Intermediate", "Advanced"];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  const filteredCourses = COURSES.filter((course) => {
    const matchesSearch = course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = selectedTrack === "All" || course.track === selectedTrack;
    const matchesDifficulty = selectedDifficulty === "All" || course.difficulty === selectedDifficulty;
    return matchesSearch && matchesTrack && matchesDifficulty;
  });

  const totalLessons = COURSES.reduce((acc, course) => acc + course.lessons, 0);
  const totalHours = COURSES.reduce((acc, course) => {
    const hours = parseInt(course.duration);
    return acc + (isNaN(hours) ? 0 : hours);
  }, 0);

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="pt-16">
        {/* Header Section - UNIQUE */}
        <div className="px-6 py-16 border-b border-white/5">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center gap-3 mb-4">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <span className="text-purple-400 text-sm font-medium uppercase tracking-wider">
                Curriculum
              </span>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
              Learn by Building
            </h1>
            <p className="text-white/50 text-lg max-w-2xl">
              No theory-heavy videos. Every course ends with code deployed to devnet.
              Start with foundations, ship real programs.
            </p>
          </div>
        </div>

        {/* Filters Bar - UNIQUE */}
        <div className="sticky top-16 z-30 px-6 py-4 border-b border-white/5 bg-black/80 backdrop-blur-xl">
          <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/30" />
              <input
                type="text"
                placeholder="Search concepts, programs, or tracks..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-12 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 overflow-x-auto">
              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl whitespace-nowrap">
                <Filter className="w-4 h-4 text-white/40" />
                <select
                  value={selectedTrack}
                  onChange={(e) => setSelectedTrack(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                >
                  {TRACKS.map((track) => (
                    <option key={track} value={track} className="bg-zinc-900">
                      Track: {track}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center gap-2 px-4 py-3 bg-white/5 border border-white/10 rounded-xl whitespace-nowrap">
                <BookOpen className="w-4 h-4 text-white/40" />
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="bg-transparent text-white text-sm focus:outline-none cursor-pointer"
                >
                  {DIFFICULTIES.map((diff) => (
                    <option key={diff} value={diff} className="bg-zinc-900">
                      Level: {diff}
                    </option>
                  ))}
                </select>
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "grid" ? "bg-white/10 text-white" : "text-white/40"
                    }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-colors ${viewMode === "list" ? "bg-white/10 text-white" : "text-white/40"
                    }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results - UNIQUE */}
        <div className="px-6 py-12">
          <div className="max-w-6xl mx-auto">
            {/* Results Header */}
            <div className="flex items-center justify-between mb-8">
              <p className="text-white/50">
                <span className="text-white font-bold">{filteredCourses.length}</span> courses ready to ship
              </p>
              <p className="text-white/30 text-sm">
                {totalLessons} lessons · {totalHours} hours of hands-on coding
              </p>
            </div>

            {/* Course Grid */}
            {filteredCourses.length > 0 ? (
              <div className={`grid gap-6 ${viewMode === "grid"
                  ? "md:grid-cols-2 lg:grid-cols-3"
                  : "grid-cols-1"
                }`}>
                {filteredCourses.map((course, i) => (
                  <CourseCard key={course.id} course={course} index={i} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-white/40 text-lg mb-2">No courses found</p>
                <p className="text-white/30 text-sm">Try a different search term or clear filters</p>
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
