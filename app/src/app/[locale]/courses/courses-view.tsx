"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useBulkEnrollments } from "@/hooks/use-bulk-enrollments";
import { calculateTrackProgress } from "@/services/tracks";
import type { CourseCardData, Track } from "@/types/course";
import { Search, BookOpen, Clock, Star, Filter, ArrowRight, Layers } from "lucide-react";
import Image from "next/image";

interface CoursesViewProps {
  courses: CourseCardData[];
  tracks: Track[];
}

export default function CoursesView({ courses, tracks }: CoursesViewProps) {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const searchParams = useSearchParams();
  const coursesGridRef = useRef<HTMLDivElement>(null);

  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [track, setTrack] = useState("all");

  const { enrollments } = useBulkEnrollments(courses);

  // Auto-select track from URL query param
  useEffect(() => {
    const trackParam = searchParams.get("track");
    if (trackParam) {
      const matchedTrack = tracks.find((tr) => tr.slug === trackParam);
      if (matchedTrack) {
        setTrack(matchedTrack.name);
        // Scroll to courses grid after a brief delay
        setTimeout(() => {
          coursesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 100);
      }
    }
  }, [searchParams, tracks]);

  const filtered = useMemo(() => {
    return courses.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchDifficulty =
        difficulty === "all" || c.difficulty === difficulty;
      const matchTrack = track === "all" || c.trackName === track;
      return matchSearch && matchDifficulty && matchTrack;
    });
  }, [courses, search, difficulty, track]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Learning Paths Section */}
      {tracks.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-2 mb-6">
            <Layers className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">{t("learningPaths")}</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {tracks.map((tr) => {
              const trackCourses = courses.filter((c) => c.trackName === tr.name);
              const totalXP = trackCourses.reduce((sum, c) => sum + c.totalXP + c.bonusXP, 0);
              const progress = calculateTrackProgress(
                tr.name,
                courses,
                enrollments,
              );

              return (
                <button
                  key={tr.id}
                  onClick={() => {
                    setTrack(tr.name);
                    coursesGridRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
                  }}
                  className="text-left"
                >
                  <Card className={`group h-full transition-all hover:border-primary/50 hover:shadow-md ${track === tr.name ? "border-primary/50 shadow-md" : ""}`}>
                    <div
                      className="h-1 w-full"
                      style={{ background: `linear-gradient(to right, ${tr.color}, ${tr.color}80)` }}
                    />
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg"
                          style={{ backgroundColor: `${tr.color}20` }}
                        >
                          <BookOpen className="h-5 w-5" style={{ color: tr.color }} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold group-hover:text-primary transition-colors">{tr.name}</h3>
                          {tr.description && (
                            <p className="mt-0.5 text-xs text-muted-foreground line-clamp-1">{tr.description}</p>
                          )}
                        </div>
                      </div>

                      {progress > 0 && (
                        <div className="mt-3">
                          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1">
                            <span>{t("percentComplete", { percent: Math.round(progress) })}</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}

                      <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                        <span>{t("courseCount", { count: trackCourses.length })}</span>
                        <span>{totalXP.toLocaleString()} XP</span>
                      </div>
                    </CardContent>
                  </Card>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Filters */}
      <div ref={coursesGridRef} className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            aria-label={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-40" aria-label={t("filterDifficulty")}>
            <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
            <SelectValue placeholder={t("filterDifficulty")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            <SelectItem value="beginner">{tc("beginner")}</SelectItem>
            <SelectItem value="intermediate">{tc("intermediate")}</SelectItem>
            <SelectItem value="advanced">{tc("advanced")}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={track} onValueChange={setTrack}>
          <SelectTrigger className="w-full sm:w-48" aria-label={t("filterTrack")}>
            <Filter className="mr-2 h-4 w-4" aria-hidden="true" />
            <SelectValue placeholder={t("filterTrack")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            {tracks.map((t) => (
              <SelectItem key={t.id} value={t.name}>
                {t.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(search || difficulty !== "all" || track !== "all") && (
          <Button
            variant="ghost"
            onClick={() => {
              setSearch("");
              setDifficulty("all");
              setTrack("all");
            }}
          >
            {t("clear")}
          </Button>
        )}
      </div>

      {/* Course Grid */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t("noResults")}</p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Link key={course.id} href={`/courses/${course.slug}`}>
              <Card className="group flex h-full flex-col transition-all hover:border-primary/50 hover:shadow-lg overflow-hidden">
                {course.thumbnail ? (
                  <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                      src={course.thumbnail}
                      alt={course.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    />
                  </div>
                ) : (
                  <div
                    className="aspect-video w-full flex items-center justify-center text-2xl font-bold text-white/80"
                    style={{ background: `linear-gradient(135deg, ${course.trackColor}33, ${course.trackColor}66)` }}
                  >
                    {course.trackName}
                  </div>
                )}
                <CardContent className="flex flex-1 flex-col p-6">
                  <div className="flex items-start justify-between">
                    <Badge
                      variant="outline"
                      style={{
                        borderColor: course.trackColor,
                        color: course.trackColor,
                      }}
                    >
                      {course.trackName}
                    </Badge>
                    <Badge
                      variant={
                        course.difficulty === "beginner"
                          ? "secondary"
                          : course.difficulty === "intermediate"
                            ? "default"
                            : "destructive"
                      }
                      className="text-xs"
                    >
                      {tc(course.difficulty)}
                    </Badge>
                  </div>

                  <h3 className="mt-4 text-lg font-semibold group-hover:text-primary transition-colors">
                    {course.title}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted-foreground line-clamp-2">
                    {course.description}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.totalLessons} {tc("lessons")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.round(course.totalDuration / 60)}h
                    </span>
                  </div>
                  {course.totalXP > 0 && (
                    <div className="mt-2 flex items-center gap-1.5 text-xs">
                      <Star className="h-3.5 w-3.5 text-gold shrink-0" />
                      <span className="font-medium text-foreground">
                        {course.totalXP + course.bonusXP} {tc("xp")}
                      </span>
                      <span className="text-muted-foreground">
                        ({Math.round(course.totalXP / course.totalLessons)}/lesson
                        {course.bonusXP > 0 && ` · +${course.bonusXP} bonus`})
                      </span>
                    </div>
                  )}

                  <div className="mt-4 flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary/10">
                      <span className="text-[10px] font-bold text-primary">
                        {course.instructorName.charAt(0)}
                      </span>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {course.instructorName}
                    </span>
                  </div>

                  {course.progress !== undefined && course.progress > 0 && (
                    <div className="mt-3">
                      <div className="h-1.5 w-full rounded-full bg-muted">
                        <div
                          className="h-full rounded-full bg-primary transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                      <span className="mt-1 text-xs text-muted-foreground">
                        {Math.round(course.progress)}%{" "}
                        {tc("completed").toLowerCase()}
                      </span>
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
