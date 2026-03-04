"use client";

import Image from "next/image";
import { Link } from "@/i18n/navigation";
import { useEffect, useMemo, useState } from "react";
import { mockCourses } from "@/domain/mock-data";
import { localLearningProgressService } from "@/services/local-learning-progress-service";
import { useWalletStore } from "@/stores/wallet-store";
import { getLearnerId } from "@/lib/learner";
import { ProgressBar } from "@/components/ui/progress";

type CmsCourseOverride = {
  slug: string;
  title?: string;
  description?: string;
  difficulty?: string;
  durationHours?: number;
  xpReward?: number;
  track?: string;
  thumbnailUrl?: string;
};

export default function CoursesPage() {
  const walletAddress = useWalletStore((state) => state.walletAddress);
  const [activeLevel, setActiveLevel] = useState<string>("All");
  const [query, setQuery] = useState("");
  const [activeTrack, setActiveTrack] = useState<string>("All Tracks");
  const [durationFilter, setDurationFilter] = useState<string>("All");
  const [sortBy, setSortBy] = useState<"recommended" | "duration-asc" | "duration-desc" | "xp-desc">("recommended");
  const [progressByCourse, setProgressByCourse] = useState<Record<string, number>>({});
  const [cmsOverrides, setCmsOverrides] = useState<Record<string, CmsCourseOverride>>({});

  useEffect(() => {
    const loadProgress = async () => {
      const learnerId = getLearnerId(walletAddress);
      const progressEntries = await Promise.all(
        mockCourses.map(async (course) => {
          const progress = await localLearningProgressService.getProgress(learnerId, course.id);
          return [course.id, progress?.percentComplete ?? 0] as const;
        }),
      );
      setProgressByCourse(Object.fromEntries(progressEntries));
    };
    loadProgress();
  }, [walletAddress]);

  useEffect(() => {
    const loadCmsCourses = async () => {
      try {
        const response = await fetch("/api/cms-courses", { cache: "no-store" });
        if (!response.ok) return;
        const data = (await response.json()) as { courses?: CmsCourseOverride[] };
        const overrides = Object.fromEntries((data.courses ?? []).map((course) => [course.slug, course]));
        setCmsOverrides(overrides);
      } catch {
        setCmsOverrides({});
      }
    };
    loadCmsCourses();
  }, []);

  const tracks = useMemo(() => {
    const merged = mockCourses.map((course) => ({
      ...course,
      track: cmsOverrides[course.slug]?.track || course.track,
    }));
    return ["All Tracks", ...Array.from(new Set(merged.map((course) => course.track)))];
  }, [cmsOverrides]);

  const courses = useMemo(() => {
    const mergedCourses = mockCourses.map((course) => {
      const override = cmsOverrides[course.slug];
      if (!override) return course;
      return {
        ...course,
        title: override.title || course.title,
        description: override.description || course.description,
        difficulty: (override.difficulty as "Beginner" | "Intermediate" | "Advanced") || course.difficulty,
        durationHours: override.durationHours ?? course.durationHours,
        xpReward: override.xpReward ?? course.xpReward,
        track: override.track || course.track,
        thumbnailUrl: override.thumbnailUrl || course.thumbnailUrl,
      };
    });

    let filtered = mergedCourses.filter((course) => {
      const levelOk = activeLevel === "All" || course.difficulty === activeLevel;
      const trackOk = activeTrack === "All Tracks" || course.track === activeTrack;
      const queryOk =
        query.trim() === "" ||
        `${course.title} ${course.description} ${course.track}`
          .toLowerCase()
          .includes(query.trim().toLowerCase());
      const durationOk =
        durationFilter === "All" ||
        (durationFilter === "<10h" && course.durationHours < 10) ||
        (durationFilter === "10-18h" && course.durationHours >= 10 && course.durationHours <= 18) ||
        (durationFilter === ">18h" && course.durationHours > 18);
      return levelOk && trackOk && queryOk && durationOk;
    });

    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "duration-asc") return a.durationHours - b.durationHours;
      if (sortBy === "duration-desc") return b.durationHours - a.durationHours;
      if (sortBy === "xp-desc") return b.xpReward - a.xpReward;
      const aProgress = progressByCourse[a.id] ?? 0;
      const bProgress = progressByCourse[b.id] ?? 0;
      return bProgress - aProgress || b.xpReward - a.xpReward;
    });

    return filtered;
  }, [activeLevel, activeTrack, query, durationFilter, sortBy, progressByCourse, cmsOverrides]);

  return (
    <div className="bg-background min-h-screen pb-32">
      
      {/* Header */}
      <div className="pt-8 md:pt-12 pb-12 px-4 text-center">
        <h1 className="text-[48px] md:text-[64px] font-bold tracking-tight text-white mb-6">
          Learning Paths.
        </h1>
        <p className="text-[17px] text-white/50 mb-8">Find the right track by level, topic, and duration.</p>
        <div className="flex items-center justify-center gap-2 flex-wrap">
          {["All", "Beginner", "Intermediate", "Advanced"].map(level => (
            <button
              key={level}
              onClick={() => setActiveLevel(level)}
              className={`px-5 py-2.5 rounded-full text-[15px] font-medium transition-all ${
                activeLevel === level 
                  ? "bg-white text-black shadow-md" 
                  : "bg-surface border border-white/10 text-white/70 hover:bg-white/10 hover:text-white shadow-sm"
              }`}
            >
              {level}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-[1200px] px-4 md:px-8 pb-8">
        <div className="bg-surface border border-white/10 rounded-[24px] p-4 md:p-5 apple-shadow grid gap-3 md:grid-cols-[1.4fr_1fr_1fr_1fr]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search courses, topics, or tracks"
            className="h-11 rounded-[14px] border border-white/10 bg-background px-3 text-[14px] text-white placeholder:text-white/30 outline-none focus:border-white/30"
          />
          <select
            value={activeTrack}
            onChange={(event) => setActiveTrack(event.target.value)}
            className="h-11 rounded-[14px] border border-white/10 bg-background px-3 text-[14px] text-white outline-none focus:border-white/30"
          >
            {tracks.map((track) => (
              <option key={track} value={track} className="bg-background text-white">
                {track}
              </option>
            ))}
          </select>
          <select
            value={durationFilter}
            onChange={(event) => setDurationFilter(event.target.value)}
            className="h-11 rounded-[14px] border border-white/10 bg-background px-3 text-[14px] text-white outline-none focus:border-white/30"
          >
            <option value="All" className="bg-background text-white">All durations</option>
            <option value="<10h" className="bg-background text-white">Under 10h</option>
            <option value="10-18h" className="bg-background text-white">10h to 18h</option>
            <option value=">18h" className="bg-background text-white">Over 18h</option>
          </select>
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as "recommended" | "duration-asc" | "duration-desc" | "xp-desc")}
            className="h-11 rounded-[14px] border border-white/10 bg-background px-3 text-[14px] text-white outline-none focus:border-white/30"
          >
            <option value="recommended" className="bg-background text-white">Recommended</option>
            <option value="duration-asc" className="bg-background text-white">Duration: short to long</option>
            <option value="duration-desc" className="bg-background text-white">Duration: long to short</option>
            <option value="xp-desc" className="bg-background text-white">XP reward</option>
          </select>
        </div>
        <p className="mt-3 text-[14px] text-white/50">{courses.length} course{courses.length !== 1 ? "s" : ""} found</p>
      </div>

      {/* Grid */}
      <div className="mx-auto max-w-[1200px] px-4 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {courses.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`} className="group flex flex-col bg-surface border border-white/10 rounded-[32px] overflow-hidden apple-shadow apple-shadow-hover">
              <div className="relative w-full aspect-[4/3] bg-black overflow-hidden border-b border-white/10">
                <Image
                  src={course.thumbnailUrl || "https://images.unsplash.com/photo-1639762681485-074b7f4ec651?auto=format&fit=crop&q=80&w=800&h=400"}
                  alt={course.title}
                  fill
                  className="object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                />
              </div>
              <div className="p-8 flex flex-col flex-1">
                <div className="mb-4">
                  <span className="inline-block px-3 py-1 bg-white/10 text-white text-[12px] font-semibold rounded-full mb-3 mr-2 border border-white/10">
                    {course.difficulty}
                  </span>
                  <span className="inline-block px-3 py-1 bg-white text-black text-[12px] font-semibold rounded-full mb-3">
                    {course.track}
                  </span>
                  <h3 className="font-bold text-[24px] tracking-tight leading-tight mb-2 text-white">{course.title}</h3>
                  <p className="text-[15px] text-white/50 line-clamp-2 leading-relaxed">{course.description}</p>
                </div>
                <div className="space-y-2 mb-5">
                  <div className="flex items-center justify-between text-[13px] font-medium text-white/70">
                    <span>Progress</span>
                    <span>{progressByCourse[course.id] ?? 0}%</span>
                  </div>
                  <ProgressBar value={progressByCourse[course.id] ?? 0} className="h-2 rounded-full" />
                </div>
                <div className="mt-auto pt-6 flex items-center justify-between border-t border-white/10">
                  <span className="text-[14px] font-medium text-white/90">{course.durationHours} hours · +{course.xpReward} XP</span>
                  <span className="text-[14px] font-bold text-white group-hover:text-white/70 transition-colors">
                    View Course
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
        {courses.length === 0 && (
          <div className="bg-surface border border-white/10 rounded-[24px] p-10 text-center apple-shadow">
            <p className="text-[18px] font-semibold text-white mb-2">No courses match those filters</p>
            <p className="text-[14px] text-white/50">Try resetting track, duration, or search terms.</p>
          </div>
        )}
      </div>

    </div>
  );
}
