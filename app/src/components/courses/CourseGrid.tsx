"use client";

import { useState, useMemo, useEffect } from "react";
import { useTranslations } from "next-intl";
import { CourseCard, type CourseCardData } from "./CourseCard";
import { SkeletonCard } from "@/components/shared/skeleton-card";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookOpen, AlertCircle } from "lucide-react";
import type { SanityCourse } from "@/lib/sanity/queries";
import { EmptyState } from "@/components/shared/empty-state";
import { fetchAllCourses } from "@/lib/solana/queries";

type DurationFilter = "all" | "short" | "medium" | "long";

// Maps trackId (number from SanityCourse) to a URL-friendly slug used in ?track= query param
// trackId values come from the Sanity schema and the on-chain program (u16)
const TRACK_SLUGS: Record<number, string> = {
  1: "solana-fundamentals",
  2: "anchor-development",
  3: "nft-gaming",
  4: "defi-development",
  5: "web3-frontend",
  6: "advanced-protocol",
};

function toCourseCardData(
  course: SanityCourse,
  enrollmentMap: Map<string, number>
): CourseCardData & { trackSlug: string } {
  const totalMinutes =
    course.lessons?.reduce((sum, l) => sum + (l.estimatedMinutes ?? 0), 0) ?? 0;
  return {
    slug: course.slug,
    title: course.title,
    description: course.description,
    thumbnail: course.thumbnail ?? null,
    difficulty: course.difficulty,
    lessonCount: course.lessons?.length ?? 0,
    xpPerLesson: course.xpPerLesson,
    totalEnrollments: enrollmentMap.get(course.onChainCourseId) ?? 0,
    progress: null,
    tags: course.tags ?? [],
    totalMinutes,
    trackSlug: TRACK_SLUGS[course.trackId] ?? "other",
    onChainCourseId: course.onChainCourseId,
  };
}

function matchesDuration(totalMinutes: number, filter: DurationFilter): boolean {
  if (filter === "all") return true;
  if (filter === "short") return totalMinutes < 30;
  if (filter === "medium") return totalMinutes >= 30 && totalMinutes <= 60;
  if (filter === "long") return totalMinutes > 60;
  return true;
}

interface CourseGridProps {
  courses: SanityCourse[];
  loading?: boolean;
  error?: boolean;
  initialTrack?: string;
}

export function CourseGrid({ courses, loading = false, error = false, initialTrack = "all" }: CourseGridProps) {
  const t = useTranslations("courses");
  const tPaths = useTranslations("learningPaths");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<number | null>(null);
  const [topic, setTopic] = useState<string>("all");
  const [duration, setDuration] = useState<DurationFilter>("all");
  const [track, setTrack] = useState<string>(initialTrack);
  const [enrollmentMap, setEnrollmentMap] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    fetchAllCourses().then((onChainCourses) => {
      const map = new Map<string, number>();
      for (const { account } of onChainCourses) {
        map.set(account.courseId, account.totalEnrollments ?? 0);
      }
      setEnrollmentMap(map);
    }).catch(() => {
      // RPC unavailable — keep defaults at 0
    });
  }, []);

  const cardData = useMemo(
    () => courses.map((c) => toCourseCardData(c, enrollmentMap)),
    [courses, enrollmentMap]
  );

  // Derive unique tags across all courses for the topic filter
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const course of courses) {
      for (const tag of course.tags ?? []) {
        tagSet.add(tag);
      }
    }
    return Array.from(tagSet).sort();
  }, [courses]);

  const filtered = useMemo(() => {
    return cardData.filter((c) => {
      const matchesSearch =
        search === "" ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase()) ||
        c.tags.some((tag) => tag.toLowerCase().includes(search.toLowerCase()));
      const matchesDifficulty = difficulty === null || c.difficulty === difficulty;
      const matchesTopic =
        topic === "all" || c.tags.some((tag) => tag === topic);
      const matchesDurationFilter = matchesDuration(c.totalMinutes, duration);
      const matchesTrack = track === "all" || c.trackSlug === track;
      return matchesSearch && matchesDifficulty && matchesTopic && matchesDurationFilter && matchesTrack;
    });
  }, [cardData, search, difficulty, topic, duration, track]);

  const hasActiveFilters =
    search !== "" || difficulty !== null || topic !== "all" || duration !== "all" || track !== "all";

  const clearFilters = () => {
    setSearch("");
    setDifficulty(null);
    setTopic("all");
    setDuration("all");
    setTrack("all");
  };

  // Derive unique track slugs across all courses for the track filter
  const allTracks = useMemo(() => {
    const trackSet = new Set<string>();
    for (const course of cardData) {
      if (course.trackSlug && course.trackSlug !== "other") {
        trackSet.add(course.trackSlug);
      }
    }
    return Array.from(trackSet).sort();
  }, [cardData]);

  // Map track slugs to display names
  const TRACK_SLUG_TO_I18N_KEY: Record<string, string> = {
    "solana-fundamentals": "paths.solanaFundamentals.title",
    "anchor-development": "paths.anchorDevelopment.title",
    "nft-gaming": "paths.nftGaming.title",
    "defi-development": "paths.defiDevelopment.title",
    "web3-frontend": "paths.web3Frontend.title",
    "advanced-protocol": "paths.advancedProtocol.title",
  };

  if (loading) {
    return (
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <EmptyState
        icon={AlertCircle}
        title={t("errorLoading")}
        description={t("filter.emptyDescription")}
        action={
          <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
            {t("retry")}
          </Button>
        }
      />
    );
  }

  if (courses.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t("comingSoon")}
        description={t("comingSoonDescription")}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Filter toolbar */}
      <div className="courses-filter-toolbar space-y-4">
        {/* Search + dropdowns row */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="search-input-glow relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("filter.search")}
              aria-label={t("filter.search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Topic/Tag filter */}
          {allTags.length > 0 && (
            <Select value={topic} onValueChange={setTopic}>
              <SelectTrigger className="w-full sm:w-44" aria-label={t("filter.topic")}>
                <SelectValue placeholder={t("filter.topic")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("filter.allTopics")}</SelectItem>
                {allTags.map((tag) => (
                  <SelectItem key={tag} value={tag}>
                    {tag}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Duration filter */}
          <Select value={duration} onValueChange={(v) => setDuration(v as DurationFilter)}>
            <SelectTrigger className="w-full sm:w-44" aria-label={t("filter.duration")}>
              <SelectValue placeholder={t("filter.duration")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("filter.allDurations")}</SelectItem>
              <SelectItem value="short">{t("filter.durationShort")}</SelectItem>
              <SelectItem value="medium">{t("filter.durationMedium")}</SelectItem>
              <SelectItem value="long">{t("filter.durationLong")}</SelectItem>
            </SelectContent>
          </Select>

          {/* Learning path / track filter */}
          {allTracks.length > 0 && (
            <Select value={track} onValueChange={setTrack}>
              <SelectTrigger className="w-full sm:w-48" aria-label={tPaths("filter.label")}>
                <SelectValue placeholder={tPaths("filter.label")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tPaths("filter.all")}</SelectItem>
                {allTracks.map((slug) => {
                  const i18nKey = TRACK_SLUG_TO_I18N_KEY[slug];
                  return (
                    <SelectItem key={slug} value={slug}>
                      {i18nKey ? tPaths(i18nKey) : slug}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Difficulty buttons */}
        <div role="group" aria-label={t("filter.difficulty")} className="flex flex-wrap gap-2">
          {[
            { label: t("filter.all"),          value: null, dotClass: "diff-dot-all" },
            { label: t("filter.beginner"),      value: 1,   dotClass: "diff-dot-beginner" },
            { label: t("filter.intermediate"),  value: 2,   dotClass: "diff-dot-intermediate" },
            { label: t("filter.advanced"),      value: 3,   dotClass: "diff-dot-advanced" },
          ].map((filter) => (
            <Button
              key={String(filter.value ?? "all")}
              variant={difficulty === filter.value ? "default" : "outline"}
              size="sm"
              aria-pressed={difficulty === filter.value}
              onClick={() => setDifficulty(filter.value)}
              className="diff-btn"
            >
              <span className={`diff-dot ${filter.dotClass}`} />
              {filter.label}
            </Button>
          ))}
        </div>
      </div>{/* end .courses-filter-toolbar */}

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((course, index) => (
          <CourseCard key={course.slug} course={course} priority={index < 3} index={index} />
        ))}
      </div>

      {filtered.length === 0 && (
        <div role="status" aria-live="polite" className="flex flex-col items-center gap-4 py-16">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Search className="h-7 w-7 text-muted-foreground" />
          </div>
          <div className="text-center">
            <p className="font-medium">
              {hasActiveFilters ? t("filter.noResults") : t("comingSoon")}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {hasActiveFilters ? t("filter.emptyDescription") : t("comingSoonDescription")}
            </p>
          </div>
          {hasActiveFilters && (
            <Button variant="outline" size="sm" onClick={clearFilters}>
              {t("filter.clearFilters")}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
