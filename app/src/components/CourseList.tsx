"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLearningProgressService } from "@/services/LearningProgressService";
import { useWallet } from "@solana/wallet-adapter-react";
import { Loader2 } from "lucide-react";
import type { CourseDefinition } from "@/domain/courses";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

type Course = CourseDefinition;

export function CourseList() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [difficultyFilter, setDifficultyFilter] =
    useState<"All" | Course["difficulty"]>("All");

  const wallet = useWallet();
  const learningService = useLearningProgressService();
  const { t } = useLanguage();

  useEffect(() => {
    const loadCourses = async () => {
      try {
        setLoading(true);

        if (learningService) {
          const fetchedCourses = await learningService.getAllCourses();
          setCourses(fetchedCourses ?? []);
        } else {
          const { mockCourses } = await import("@/domain/mockCourses");
          setCourses(mockCourses);
        }
      } catch (err) {
        console.error("Error fetching courses:", err);
        setError("Failed to fetch courses");
      } finally {
        setLoading(false);
      }
    };

    loadCourses();
  }, [learningService]);

  const getProgress = (course: Course) => {
    if (!wallet.publicKey) return 0;

    const key = `superteam:${wallet.publicKey.toBase58()}:lessons:${course.id}`;
    const raw = localStorage.getItem(key);
    if (!raw) return 0;

    const flags: number[] = JSON.parse(raw);
    let completedCount = 0;

    course.lessons.forEach((_, index) => {
      const wordIndex = Math.floor(index / 32);
      const bitIndex = index % 32;
      const mask = 1 << bitIndex;

      if ((flags[wordIndex] & mask) !== 0) {
        completedCount++;
      }
    });

    return Math.round((completedCount / course.lessons.length) * 100);
  };

  const filteredCourses = courses.filter((course) => {
    const translatedTitle = t(course.title).toLowerCase();
    const translatedDescription = t(course.description).toLowerCase();

    const matchesSearch =
      translatedTitle.includes(searchQuery.toLowerCase()) ||
      translatedDescription.includes(searchQuery.toLowerCase());

    const matchesDifficulty =
      difficultyFilter === "All" ||
      course.difficulty === difficultyFilter;

    return matchesSearch && matchesDifficulty;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12 gap-3">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        <span className="text-lg font-medium text-gray-700">
          {t("courses.loading")}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center py-12">
        <Card className="w-full max-w-md shadow-sm">
          <CardHeader>
            <CardTitle className="text-red-600">
              {t("courses.error")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600">
              {t("courses.fetchError")}
            </p>
            <Button
              onClick={() => window.location.reload()}
              className="mt-4"
            >
              {t("courses.tryAgain")}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">

      <div className="mb-6 space-y-2">

        <div>
          <h2 className="text-lg font-semibold tracking-tight">
            {t("courses.available")}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            {t("courses.subtitle")}
          </p>
        </div>

        {/* Search + Filter */}
        <div className="flex flex-col md:flex-row gap-3">

          <input
            type="text"
            placeholder={t("courses.searchPlaceholder")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border rounded-md px-3 py-2 w-full md:w-1/2 bg-background shadow-sm focus:ring-2 focus:ring-primary/40 outline-none"
          />

          <select
            value={difficultyFilter}
            onChange={(e) =>
              setDifficultyFilter(
                e.target.value as "All" | Course["difficulty"]
              )
            }
            className="border rounded-md px-3 py-2 w-full md:w-1/3 bg-background shadow-sm focus:ring-2 focus:ring-primary/40 outline-none"
          >
            <option value="All">{t("courses.allLevels")}</option>
            <option value="Beginner">{t("courses.beginner")}</option>
            <option value="Intermediate">{t("courses.intermediate")}</option>
            <option value="Advanced">{t("courses.advanced")}</option>
          </select>

        </div>
      </div>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCourses.map((course) => {
          const progress = getProgress(course);
          const isCompleted = progress === 100;

          return (
            <Link key={course.id} href={`/courses/${course.id}`}>
              <Card
                className={`group border bg-card shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300
                ${isCompleted ? "border-yellow-400/40 bg-yellow-500/5" : "bg-gradient-to-b from-background to-muted/30"}`}
              >

                <CardHeader className="space-y-2 pb-3">

                  <div className="space-y-1">
                    <CardTitle className="text-lg font-semibold tracking-tight group-hover:text-primary transition-colors">
                      {t(course.title)}
                    </CardTitle>

                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                      {course.difficulty}
                    </span>
                  </div>

                  <CardDescription className="text-sm text-foreground">
                    {t(course.description)}
                  </CardDescription>

                  <CardDescription>
                    Track {course.trackId} • Level {course.trackLevel}
                  </CardDescription>

                </CardHeader>

                <CardContent className="space-y-2 pt-0">

                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>
                      {course.lessonCount} {t("courses.lessons")}
                    </span>
                    <span>
                      {course.lessonCount * course.xpPerLesson} XP
                    </span>
                  </div>

                  {wallet.connected && (
                    <div className="space-y-2 pt-1">
                      <Progress value={progress} />
                      <div className="text-xs text-muted-foreground text-right">
                        {progress}% {t("courses.complete")}
                      </div>
                    </div>
                  )}

                  <Button size="sm" className="w-full font-medium shadow-sm hover:shadow-md transition">
                    {isCompleted
                      ? t("courses.review")
                      : progress > 0
                      ? t("courses.continue")
                      : t("courses.start")}
                  </Button>

                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

    </div>
  );
}