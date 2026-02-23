"use client";

import type { CourseAccount } from "@/hooks/use-courses";
import { CourseCard } from "./course-card";
import { useTranslations } from "next-intl";
import { motion } from "motion/react";

export function CourseGrid({ courses }: { courses: CourseAccount[] }) {
  const t = useTranslations("courses");

  if (courses.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge-soft py-24 px-8"
      >
        <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl bg-card">
          <svg className="h-8 w-8 text-content-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
          </svg>
        </div>
        <p className="text-sm text-content-muted">{t("noCourses")}</p>
      </motion.div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {courses.map((course, i) => (
        <CourseCard key={course.courseId} course={course} index={i} />
      ))}
    </div>
  );
}
