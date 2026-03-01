"use client";

import { useEffect, useState } from "react";
import { Course, TRACK_NAMES, DIFFICULTY_LABELS } from "@/types/academy";
import { fetchAllCourses } from "@/lib/services/course-service";
import { CourseCard } from "@/components/courses/CourseCard";

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [trackFilter, setTrackFilter] = useState<number | null>(null);
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null);

  useEffect(() => {
    fetchAllCourses().then((data) => {
      setCourses(data);
      setLoading(false);
    });
  }, []);

  const filteredCourses = courses.filter((c) => {
    if (trackFilter !== null && c.trackId !== trackFilter) return false;
    if (difficultyFilter !== null && c.difficulty !== difficultyFilter) return false;
    return c.isActive;
  });

  const tracks = [...new Set(courses.map((c) => c.trackId))];

  return (
    <div className="relative min-h-screen">
      {/* Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 right-1/4 w-72 h-72 bg-[#9945FF]/8 rounded-full blur-[100px]" />
      </div>

      <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold mb-3">Course Catalog</h1>
          <p className="text-white/50 max-w-xl">
            Browse available courses across all tracks. Enroll to start earning XP and working toward your credentials.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3 mb-8">
          <span className="text-sm text-white/40">Filter:</span>
          
          {/* Track filter */}
          <button
            onClick={() => setTrackFilter(null)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              trackFilter === null ? "bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/30" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
            }`}
          >
            All Tracks
          </button>
          {tracks.map((id) => (
            <button
              key={id}
              onClick={() => setTrackFilter(trackFilter === id ? null : id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                trackFilter === id ? "bg-[#9945FF]/20 text-[#9945FF] border border-[#9945FF]/30" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
            >
              {TRACK_NAMES[id] || `Track ${id}`}
            </button>
          ))}

          <div className="w-px h-6 bg-white/10 mx-1" />

          {/* Difficulty filter */}
          {[1, 2, 3].map((d) => (
            <button
              key={d}
              onClick={() => setDifficultyFilter(difficultyFilter === d ? null : d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                difficultyFilter === d ? "bg-[#14F195]/20 text-[#14F195] border border-[#14F195]/30" : "bg-white/5 text-white/50 border border-white/10 hover:bg-white/10"
              }`}
            >
              {DIFFICULTY_LABELS[d]}
            </button>
          ))}
        </div>

        {/* Course Grid */}
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card h-64 animate-pulse">
                <div className="h-1 bg-white/5" />
                <div className="p-6 space-y-4">
                  <div className="flex gap-2">
                    <div className="h-5 w-20 bg-white/5 rounded-full" />
                    <div className="h-5 w-28 bg-white/5 rounded-full" />
                  </div>
                  <div className="h-6 w-3/4 bg-white/5 rounded" />
                  <div className="h-4 w-1/2 bg-white/5 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCourses.map((course) => (
              <CourseCard key={course.courseId} course={course} />
            ))}
          </div>
        )}

        {!loading && filteredCourses.length === 0 && (
          <div className="text-center py-16">
            <p className="text-white/40 text-lg">No courses match your filters.</p>
            <button
              onClick={() => { setTrackFilter(null); setDifficultyFilter(null); }}
              className="mt-4 text-sm text-[#14F195] hover:underline"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
