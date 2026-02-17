"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COURSE_CARDS, TRACKS } from "@/lib/mock-data";
import { Search, BookOpen, Clock, Star, Filter } from "lucide-react";

export default function CoursesPage() {
  const t = useTranslations("courses");
  const tc = useTranslations("common");
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("all");
  const [track, setTrack] = useState("all");

  const filtered = useMemo(() => {
    return COURSE_CARDS.filter((c) => {
      const matchSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.description.toLowerCase().includes(search.toLowerCase());
      const matchDifficulty =
        difficulty === "all" || c.difficulty === difficulty;
      const matchTrack = track === "all" || c.trackName === track;
      return matchSearch && matchDifficulty && matchTrack;
    });
  }, [search, difficulty, track]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">{t("title")}</h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Filters */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={difficulty} onValueChange={setDifficulty}>
          <SelectTrigger className="w-full sm:w-40">
            <Filter className="mr-2 h-4 w-4" />
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
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder={t("filterTrack")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{tc("all")}</SelectItem>
            {TRACKS.map((t) => (
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
            Clear
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
              <Card className="group h-full transition-all hover:border-primary/50 hover:shadow-lg">
                <CardContent className="flex h-full flex-col p-6">
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

                  <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <BookOpen className="h-3.5 w-3.5" />
                      {course.totalLessons} {tc("lessons")}
                    </span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5" />
                      {Math.round(course.totalDuration / 60)}h
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5" />
                      {course.totalXP} {tc("xp")}
                    </span>
                  </div>

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
