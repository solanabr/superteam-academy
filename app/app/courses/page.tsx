"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowUpRight, Search } from "lucide-react";
import { mockCourses } from "@/lib/mockData";
import { DIFFICULTY_LABELS } from "@/lib/constants";
import { useCourses } from "@/hooks/useCourses";
import { cn } from "@/lib/utils";

const tracks = [
  { id: 0, label: "ALL" },
  { id: 1, label: "FUNDAMENTALS" },
  { id: 2, label: "ANCHOR" },
  { id: 3, label: "DEFI" },
  { id: 4, label: "NFT" },
  { id: 5, label: "SECURITY" },
];

const difficulties = [
  { id: 0, label: "ALL_LEVELS" },
  { id: 1, label: "BEGINNER" },
  { id: 2, label: "INTERMEDIATE" },
  { id: 3, label: "ADVANCED" },
];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [selectedTrack, setSelectedTrack] = useState(0);
  const [selectedDifficulty, setSelectedDifficulty] = useState(0);
  const { isEnrolled } = useCourses();

  const filtered = mockCourses.filter((course) => {
    const matchesSearch =
      course.title.toLowerCase().includes(search.toLowerCase()) ||
      course.description.toLowerCase().includes(search.toLowerCase());
    const matchesTrack = selectedTrack === 0 || course.trackId === selectedTrack;
    const matchesDiff = selectedDifficulty === 0 || course.difficulty === selectedDifficulty;
    return matchesSearch && matchesTrack && matchesDiff;
  });

  return (
    <div className="min-h-screen bg-[#020202]">
      <div className="border-b border-[#1a1a1a] px-6 py-12 max-w-7xl mx-auto">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-[10px] font-mono text-[#333] uppercase tracking-widest">// COURSE CATALOG</span>
          <div className="flex-1 h-px bg-[#1a1a1a]" />
          <span className="text-[10px] font-mono text-[#9945ff]">{filtered.length}_RESULTS</span>
        </div>
        <h1 className="font-display font-black text-6xl uppercase tracking-tighter">
          ALL <span className="text-[#9945ff]">COURSES</span>
        </h1>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="relative mb-6">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#333]" />
          <input
            type="text"
            placeholder="SEARCH_COURSES..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] text-xs font-mono text-[#f5f5f0] placeholder-[#333] focus:outline-none focus:border-[#9945ff] transition-colors uppercase tracking-widest"
          />
        </div>

        <div className="flex flex-wrap gap-px bg-[#1a1a1a] mb-4 w-fit">
          {tracks.map((track) => (
            <button
              key={track.id}
              onClick={() => setSelectedTrack(track.id)}
              className={cn(
                "px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors",
                selectedTrack === track.id
                  ? "bg-[#9945ff] text-white"
                  : "bg-[#020202] text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
              )}
            >
              {track.label}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap gap-px bg-[#1a1a1a] mb-12 w-fit">
          {difficulties.map((diff) => (
            <button
              key={diff.id}
              onClick={() => setSelectedDifficulty(diff.id)}
              className={cn(
                "px-4 py-2 text-[10px] font-mono uppercase tracking-widest transition-colors",
                selectedDifficulty === diff.id
                  ? "bg-[#14f195] text-black"
                  : "bg-[#020202] text-[#444] hover:text-[#f5f5f0] hover:bg-[#0a0a0a]"
              )}
            >
              {diff.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-px bg-[#1a1a1a]">
          {filtered.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: i * 0.05 }}
            >
              <Link href={`/courses/${course.id}`}>
                <div className="bg-[#020202] hover:bg-[#0a0a0a] transition-colors group h-full flex flex-col">
                  <div className="h-40 bg-[#0d0d0d] scanline relative flex items-end p-5 border-b border-[#1a1a1a]">
                    <div className="relative z-10">
                      <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-1">
                        TRACK_{course.trackId.toString().padStart(2, "0")}
                      </div>
                      <div className={cn(
                        "text-xs font-mono uppercase",
                        course.difficulty === 1 ? "text-[#14f195]" :
                        course.difficulty === 2 ? "text-[#9945ff]" : "text-[#ff3366]"
                      )}>
                        {DIFFICULTY_LABELS[course.difficulty]}
                      </div>
                    </div>
                    <div className="absolute top-4 right-4 text-[10px] font-mono text-[#14f195]">
                      +{course.xp.toLocaleString()}_XP
                    </div>
                    {isEnrolled(course.id) && (
                      <div className="absolute top-4 left-4 text-[10px] font-mono text-[#9945ff] border border-[#9945ff] px-2 py-0.5">
                        ENROLLED
                      </div>
                    )}
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-2">{course.track}</div>
                    <h3 className="font-display font-black text-lg uppercase tracking-tight mb-3 group-hover:text-[#9945ff] transition-colors leading-tight">
                      {course.title}
                    </h3>
                    <p className="text-xs font-mono text-[#444] line-clamp-2 mb-4 flex-1 leading-relaxed">{course.description}</p>
                    <div className="flex items-center justify-between pt-4 border-t border-[#1a1a1a]">
                      <span className="text-[10px] font-mono text-[#333]">{course.lessons}_LESSONS // {course.duration}</span>
                      <ArrowUpRight className="w-3.5 h-3.5 text-[#333] group-hover:text-[#9945ff] transition-colors" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-24">
            <div className="text-[10px] font-mono text-[#333] uppercase tracking-widest mb-4">// NO_RESULTS_FOUND</div>
            <p className="text-xs font-mono text-[#444]">Try adjusting your search or filters</p>
          </div>
        )}
      </div>
    </div>
  );
}