"use client";

import { useTranslations } from "next-intl";
import type { RecommendedCourse } from "@/lib/content/queries";
import { Card, CardContent } from "@/components/ui/card";
import { CourseCard } from "@/components/course/course-card";

interface RecommendedCoursesSectionProps {
  /** Courses the learner is neither enrolled in nor has completed. */
  recommendedCourses: RecommendedCourse[];
}

/**
 * "Recommended Courses" dashboard section — carousel on small screens,
 * three-column grid on large.
 */
export function RecommendedCoursesSection({
  recommendedCourses,
}: RecommendedCoursesSectionProps) {
  const t = useTranslations("dashboard");

  return (
    <div className="space-y-4">
      <h2 className="font-display text-[24px] font-extrabold">
        {t("recommendedCourses")}
      </h2>
      {recommendedCourses.length > 0 ? (
        <div className="recommended-carousel lg:grid lg:grid-cols-3 lg:gap-6">
          {recommendedCourses.map((course) => (
            <div key={course._id} className="recommended-carousel-item">
              <CourseCard
                slug={course.slug}
                title={course.title}
                description={course.description}
                difficulty={
                  course.difficulty as "beginner" | "intermediate" | "advanced"
                }
                duration={course.duration}
                lessonCount={course.totalLessons}
                xpReward={course.xpReward}
                trackLevel={course.trackLevel}
                pathLabel={course.learningPath ?? undefined}
              />
            </div>
          ))}
        </div>
      ) : (
        <Card className="shadow-[var(--shadow)]">
          <CardContent className="flex flex-col items-center justify-center py-8">
            <p className="text-sm text-text-3">{t("noCourses")}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
