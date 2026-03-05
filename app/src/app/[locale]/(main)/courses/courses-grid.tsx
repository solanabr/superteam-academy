"use client";

import { useEffect, useMemo, useState } from "react";
import { RemoteImage } from "@/components/remote-image";
import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { getDifficultyLabel, getDurationLabel } from "@/data/courses";
import type { Course } from "@/data/courses";
import { localize } from "@/data/courses-i18n";
import { Search } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface CoursesGridProps {
  courses: Course[];
}

function useCourseProgress(courses: Course[], walletAddr: string) {
  const [progressMap, setProgressMap] = useState<
    Record<string, { completed: number; total: number }>
  >({});

  useEffect(() => {
    if (!walletAddr) return;
    try {
      const map: Record<string, { completed: number; total: number }> = {};
      for (const course of courses) {
        const allLessons = course.modules.flatMap((m) => m.lessons);
        const total = allLessons.length;
        let completed = 0;
        for (const lesson of allLessons) {
          // Check wallet-scoped key first, then legacy
          const walletKey = `st-academy:${walletAddr}:lesson:${course.slug}:${lesson.id}`;
          const legacyKey = `st-academy:lesson:${course.slug}:${lesson.id}`;
          if (localStorage.getItem(walletKey) === "completed") {
            completed++;
          } else if (localStorage.getItem(legacyKey) === "completed") {
            // Migrate legacy to wallet-scoped
            localStorage.setItem(walletKey, "completed");
            completed++;
          }
        }
        map[course.slug] = { completed, total };
      }
      setProgressMap(map);
    } catch {
      // localStorage unavailable
    }
  }, [courses, walletAddr]);

  return progressMap;
}

const TRACKS = ["Solana Fundamentals", "DeFi", "Full Stack"] as const;
type Track = (typeof TRACKS)[number];

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;
type Difficulty = (typeof DIFFICULTIES)[number];

function filterCourses(
  list: Course[],
  query: string,
  track: string,
  difficulty: string,
): Course[] {
  const q = query.trim().toLowerCase();
  return list.filter((c) => {
    const matchQuery =
      !q ||
      c.title.toLowerCase().includes(q) ||
      c.description.toLowerCase().includes(q) ||
      c.track.toLowerCase().includes(q);
    const matchTrack = !track || c.track === track;
    const matchDifficulty = !difficulty || c.difficulty === difficulty;
    return matchQuery && matchTrack && matchDifficulty;
  });
}

export function CoursesGrid({ courses }: CoursesGridProps) {
  const t = useTranslations("courses");
  const locale = useLocale();
  const { publicKey } = useAuth();
  const walletAddr = publicKey?.toBase58() ?? "";
  const progressMap = useCourseProgress(courses, walletAddr);
  const [search, setSearch] = useState("");

  const [track, setTrack] = useState<string>("");
  const [difficulty, setDifficulty] = useState<string>("");

  const filtered = useMemo(
    () => filterCourses(courses, search, track, difficulty),
    [search, track, difficulty],
  );

  return (
    <div className="space-y-8">
      {/* Search + Filters row */}
      <div className="flex flex-col gap-4">
        <div className="flex justify-center">
          <div className="relative w-full max-w-md">
            <Input
              placeholder={t("search")}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="search-bar pr-10 transition-shadow focus:ring-2 focus:ring-primary/30"
            />
            <button
              type="button"
              aria-label={t("search")}
              className="absolute right-2 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center rounded-md text-[hsl(var(--brand-logo-green))] outline-none transition-colors hover:bg-[hsl(var(--brand-logo-green))]/15 focus-visible:ring-2 focus-visible:ring-[hsl(var(--brand-logo-green))]"
            >
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
        <div className="flex justify-center">
          <div className="flex flex-wrap items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setTrack("");
                setDifficulty("");
              }}
              className={`rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                !track && !difficulty
                  ? "filter-badge-selected bg-[hsl(var(--brand-logo-green))] text-white"
                  : "bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] hover:bg-[hsl(var(--brand-logo-yellow-light))] active:scale-[0.98]"
              }`}
            >
              {t("allTracks")}
            </button>
            {TRACKS.map((tr) => (
              <button
                key={tr}
                type="button"
                onClick={() => setTrack(track === tr ? "" : tr)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] ${
                  track === tr
                    ? "filter-badge-selected bg-[hsl(var(--brand-logo-green))] text-white"
                    : "bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] hover:bg-[hsl(var(--brand-logo-yellow-light))]"
                }`}
              >
                {tr}
              </button>
            ))}
            {DIFFICULTIES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => setDifficulty(difficulty === d ? "" : d)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-[0.98] ${
                  difficulty === d
                    ? "filter-badge-selected bg-[hsl(var(--brand-logo-green))] text-white"
                    : "bg-[hsl(var(--brand-logo-yellow))] text-[hsl(0,0%,9%)] hover:bg-[hsl(var(--brand-logo-yellow-light))]"
                }`}
              >
                {t(
                  `difficulty${d.charAt(0).toUpperCase() + d.slice(1)}` as
                    | "difficultyBeginner"
                    | "difficultyIntermediate"
                    | "difficultyAdvanced",
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Results */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-border bg-card py-16 text-center">
          <p className="text-muted-foreground">{t("noResults")}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("noResultsHint")}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((course) => (
            <Card
              key={course.id}
              className="flex h-full flex-col overflow-hidden transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5"
            >
              <div className="relative h-40 w-full shrink-0 overflow-hidden bg-muted">
                <RemoteImage src={course.thumbnail} alt={course.title} />
              </div>
              <CardHeader className="flex-1 pb-3">
                <div className="mb-2 flex flex-wrap gap-1.5">
                  <span className="card-badge rounded bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
                    {course.track}
                  </span>
                  <span className="card-badge rounded bg-[hsl(var(--brand-logo-yellow))] px-2 py-0.5 text-xs font-medium text-[hsl(0,0%,9%)]">
                    {getDifficultyLabel(course.difficulty)}
                  </span>
                </div>
                <CardTitle className="line-clamp-2 text-lg">
                  {localize(locale, course.slug, "title", course.title)}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-sm text-black">
                  {localize(
                    locale,
                    course.slug,
                    "description",
                    course.description,
                  )}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2 pt-0">
                {(() => {
                  const p = progressMap[course.slug];
                  const cappedCompleted = p
                    ? Math.min(p.completed, p.total)
                    : 0;
                  const pct =
                    p && p.total > 0
                      ? Math.min(
                          100,
                          Math.round((cappedCompleted / p.total) * 100),
                        )
                      : 0;
                  return (
                    <div className="space-y-1">
                      <Progress value={pct} className="h-2" />
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {t("progress")}: {pct}%
                        </span>
                        <span>
                          {cappedCompleted}/{p?.total ?? 0}
                        </span>
                      </div>
                    </div>
                  );
                })()}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-bold text-sky-600">
                    {getDurationLabel(course.duration)} · {course.xpTotal} XP
                  </span>
                  <Button
                    asChild
                    size="sm"
                    className="card-button gap-1.5 bg-blue-500 text-white hover:bg-blue-600 hover:text-white transition-transform active:scale-[0.98]"
                  >
                    <Link
                      href={`/courses/${course.slug}`}
                      className="focus-visible:outline-none text-white hover:text-white"
                    >
                      {t("startCourse")}
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
