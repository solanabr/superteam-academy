"use client";

import { useTranslations } from "next-intl";
import { motion } from "framer-motion";
import { Link } from "@/i18n/navigation";
import { useFeaturedCourses } from "@/hooks/use-services";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { BookOpen, ArrowRight, Zap } from "lucide-react";

interface ExploreStepProps {
  onComplete: () => void;
}

export function ExploreStep({ onComplete }: ExploreStepProps) {
  const t = useTranslations("onboarding");
  const { courses, loading } = useFeaturedCourses();

  // Show up to 3 beginner-friendly courses
  const starterCourses = courses
    .filter((c) => c.difficulty === 1)
    .slice(0, 3);

  const displayCourses = starterCourses.length > 0 ? starterCourses : courses.slice(0, 3);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center px-2"
    >
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold tracking-tight mb-1">
          {t("exploreTitle")}
        </h2>
        <p className="text-sm text-muted-foreground">
          {t("exploreSubtitle")}
        </p>
      </div>

      <div className="w-full max-w-sm space-y-3 mb-8">
        {loading ? (
          <>
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
            <Skeleton className="h-20 rounded-xl" />
          </>
        ) : displayCourses.length === 0 ? (
          <div className="rounded-xl border bg-card p-6 text-center">
            <BookOpen className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
            <p className="text-sm text-muted-foreground">
              {t("noCoursesYet")}
            </p>
          </div>
        ) : (
          displayCourses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.1 }}
            >
              <Link
                href={`/courses/${course.slug}`}
                onClick={onComplete}
                className="flex items-center gap-3 rounded-xl border bg-card p-4 hover:shadow-sm transition-all hover:border-primary/20"
              >
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{course.title}</p>
                  <p className="text-xs text-muted-foreground truncate">
                    {course.lessonCount} {t("lessons")} · {course.duration ?? "~1h"}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Badge variant="secondary" className="text-xs gap-1">
                    <Zap className="h-3 w-3" />
                    {course.xpPerLesson * course.lessonCount}
                  </Badge>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            </motion.div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-2 w-full max-w-sm">
        {displayCourses.length > 0 && (
          <Button asChild className="w-full gap-2">
            <Link href={`/courses/${displayCourses[0]?.slug}`} onClick={onComplete}>
              {t("startLearning")}
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        )}
        <Button variant="outline" onClick={onComplete} className="w-full">
          {t("goToDashboard")}
        </Button>
      </div>
    </motion.div>
  );
}
