"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CourseCard } from "./course-card";
import { courseService } from "@/services";
import type { Difficulty, Track, CourseFilters } from "@/types";
import { useQuery } from "@tanstack/react-query";

const difficulties: Difficulty[] = ["beginner", "intermediate", "advanced"];
const tracks: Track[] = ["fundamentals", "defi", "nft", "gaming", "infrastructure", "security"];

export function CourseCatalog() {
  const t = useTranslations("courses");
  const tTracks = useTranslations("courses.tracks");
  const tFilters = useTranslations("courses.filters");

  const [search, setSearch] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty | "all">("all");
  const [selectedTrack, setSelectedTrack] = useState<Track | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const filters: CourseFilters = useMemo(() => ({
    search: search || undefined,
    difficulty: selectedDifficulty !== "all" ? [selectedDifficulty] : undefined,
    track: selectedTrack !== "all" ? [selectedTrack] : undefined,
  }), [search, selectedDifficulty, selectedTrack]);

  const { data, isLoading } = useQuery({
    queryKey: ["courses", filters],
    queryFn: () => courseService.getCourses(filters),
  });

  const courses = data?.data || [];

  const activeFiltersCount = [
    selectedDifficulty !== "all",
    selectedTrack !== "all",
  ].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedDifficulty("all");
    setSelectedTrack("all");
    setSearch("");
  };

  return (
    <div className="container px-4 py-8 md:py-12">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight md:text-4xl">
          {t("title")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-8 space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder={t("filters.search") || "Search courses..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Filter Toggle (Mobile) */}
          <Button
            variant="outline"
            className="sm:hidden"
            onClick={() => setShowFilters(!showFilters)}
          >
            <SlidersHorizontal className="mr-2 h-4 w-4" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>

          {/* Desktop Filters */}
          <div className="hidden gap-4 sm:flex">
            <Select
              value={selectedDifficulty}
              onValueChange={(v) => setSelectedDifficulty(v as Difficulty | "all")}
            >
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={tFilters("difficulty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tFilters("difficulty")}</SelectItem>
                {difficulties.map((d) => (
                  <SelectItem key={d} value={d}>
                    {tFilters(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTrack}
              onValueChange={(v) => setSelectedTrack(v as Track | "all")}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={tFilters("track")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tFilters("track")}</SelectItem>
                {tracks.map((track) => (
                  <SelectItem key={track} value={track}>
                    {tTracks(track)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear
              </Button>
            )}
          </div>
        </div>

        {/* Mobile Filters */}
        {showFilters && (
          <div className="flex flex-col gap-4 rounded-lg border bg-card p-4 sm:hidden">
            <Select
              value={selectedDifficulty}
              onValueChange={(v) => setSelectedDifficulty(v as Difficulty | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder={tFilters("difficulty")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tFilters("difficulty")}</SelectItem>
                {difficulties.map((d) => (
                  <SelectItem key={d} value={d}>
                    {tFilters(d)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={selectedTrack}
              onValueChange={(v) => setSelectedTrack(v as Track | "all")}
            >
              <SelectTrigger>
                <SelectValue placeholder={tFilters("track")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{tFilters("track")}</SelectItem>
                {tracks.map((track) => (
                  <SelectItem key={track} value={track}>
                    {tTracks(track)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {activeFiltersCount > 0 && (
              <Button variant="outline" size="sm" onClick={clearFilters}>
                <X className="mr-1 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Course Grid */}
      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-[350px] animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="rounded-full bg-muted p-4 mb-4">
            <Search className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold">{t("empty.title")}</h3>
          <p className="text-muted-foreground">{t("empty.description")}</p>
          {activeFiltersCount > 0 && (
            <Button variant="outline" className="mt-4" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {courses.map((course) => (
            <CourseCard key={course.id} course={course} />
          ))}
        </div>
      )}
    </div>
  );
}
