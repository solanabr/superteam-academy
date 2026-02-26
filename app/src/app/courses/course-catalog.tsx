"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { DifficultyBadge } from "@/components/shared";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { trackLabels, courseThumbnails } from "@/lib/constants";
import {
  Search,
  BookOpen,
  Clock,
  Zap,
  Users,
  ChevronRight,
} from "lucide-react";
import type { Course } from "@/types";

const difficulties = [
  { value: "", labelKey: "all" as const },
  { value: "1", labelKey: "beginner" as const },
  { value: "2", labelKey: "intermediate" as const },
  { value: "3", labelKey: "advanced" as const },
];

export function CourseCatalog({ initialCourses }: { initialCourses: Course[] }) {
  const t = useTranslations("courses.catalog");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [track, setTrack] = useState("");

  const courses = useMemo(() => {
    let filtered = initialCourses;
    if (difficulty) {
      filtered = filtered.filter((c) => c.difficulty === Number(difficulty));
    }
    if (track) {
      filtered = filtered.filter((c) => c.trackId === Number(track));
    }
    if (search) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }
    return filtered;
  }, [initialCourses, search, difficulty, track]);

  return (
    <div className="container mx-auto px-4 py-8 lg:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Search + Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("search")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-10"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {difficulties.map((d) => (
            <Button
              key={d.value}
              variant={difficulty === d.value ? "default" : "outline"}
              size="sm"
              className="h-9"
              onClick={() => setDifficulty(d.value)}
            >
              {t(`filters.${d.labelKey}`)}
            </Button>
          ))}
        </div>
      </div>

      {/* Track Filter */}
      <div className="mb-8 flex gap-2 flex-wrap">
        <Button
          variant={track === "" ? "secondary" : "ghost"}
          size="sm"
          className="h-8 text-xs"
          onClick={() => setTrack("")}
        >
          All Tracks
        </Button>
        {Object.entries(trackLabels).map(([id, label]) => (
          <Button
            key={id}
            variant={track === id ? "secondary" : "ghost"}
            size="sm"
            className="h-8 text-xs"
            onClick={() => setTrack(id)}
          >
            {label}
          </Button>
        ))}
      </div>

      {/* Course Grid */}
      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <BookOpen className="h-12 w-12 text-muted-foreground/30" />
          <p className="mt-4 text-muted-foreground">{t("empty")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <Link
              key={course.id}
              href={`/courses/${course.slug}`}
              className="group rounded-xl border bg-card transition-all hover:shadow-md hover:border-primary/20 overflow-hidden"
            >
              {/* Thumbnail */}
              <div className="relative aspect-video bg-muted">
                {(course.thumbnailUrl || courseThumbnails[course.slug]) ? (
                  <Image
                    src={course.thumbnailUrl || courseThumbnails[course.slug]}
                    alt={course.title}
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <BookOpen className="h-10 w-10 text-muted-foreground/30" />
                  </div>
                )}
                <div className="absolute left-3 top-3">
                  <DifficultyBadge difficulty={course.difficulty} />
                </div>
              </div>

              {/* Content */}
              <div className="p-5">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs">
                    {trackLabels[course.trackId] ?? `Track ${course.trackId}`}
                  </Badge>
                </div>
                <h3 className="font-semibold text-lg leading-tight group-hover:text-primary transition-colors">
                  {course.title}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground line-clamp-2">
                  {course.description}
                </p>

                {/* Meta */}
                <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-3.5 w-3.5" />
                    {course.lessonCount} {t("lessons")}
                  </span>
                  {course.duration && (
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {course.duration}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5" />
                    {course.lessonCount * course.xpPerLesson} {t("xp")}
                  </span>
                </div>

                {/* Completions */}
                {course.totalCompletions > 0 && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-muted-foreground">
                    <Users className="h-3.5 w-3.5" />
                    {course.totalCompletions} {t("completed")}
                  </div>
                )}

                {/* Arrow */}
                <div className="mt-4 flex items-center text-sm font-medium text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  View Course
                  <ChevronRight className="ml-1 h-4 w-4" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
