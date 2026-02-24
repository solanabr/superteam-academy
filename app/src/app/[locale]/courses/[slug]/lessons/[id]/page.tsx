"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useState, useEffect, useMemo } from "react";
import { Loader2 } from "lucide-react";
import { courses } from "@/lib/services/courses";
import { LessonReading } from "@/components/lesson/lesson-reading";
import { LessonChallenge } from "@/components/lesson/lesson-challenge";
import type { Course } from "@/lib/services/types";

export default function LessonPage() {
  const params = useParams();
  const locale = params.locale as string;
  const slug = params.slug as string;
  const lessonId = params.id as string;

  const [courseData, setCourseData] = useState<Course | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/courses/${slug}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          setCourseData(data);
        } else {
          const staticCourse = courses.find((c) => c.slug === slug);
          if (staticCourse) setCourseData(staticCourse);
        }
      })
      .catch(() => {
        const staticCourse = courses.find((c) => c.slug === slug);
        if (staticCourse) setCourseData(staticCourse);
      })
      .finally(() => setLoading(false));
  }, [slug]);

  const allLessons = useMemo(
    () => courseData?.modules.flatMap((m) => m.lessons) ?? [],
    [courseData],
  );
  const lessonIndex = allLessons.findIndex((l) => l.id === lessonId);
  const lesson = allLessons[lessonIndex];

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--v9-white)",
        }}
      >
        <Loader2 className="h-5 w-5 animate-spin" style={{ color: "var(--v9-mid-grey)" }} />
      </div>
    );
  }

  if (!courseData || !lesson) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
          background: "var(--v9-white)",
        }}
      >
        <div style={{ textAlign: "center" }}>
          <p
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: "12px",
              color: "var(--v9-mid-grey)",
            }}
          >
            Lesson not found
          </p>
          <Link
            href={`/${locale}/courses`}
            style={{
              fontFamily: "var(--v9-mono)",
              fontSize: "11px",
              color: "var(--v9-accent)",
              marginTop: "8px",
              display: "inline-block",
            }}
          >
            Back to courses
          </Link>
        </div>
      </div>
    );
  }

  const isChallenge = lesson.type === "challenge" && !!lesson.challenge;

  if (isChallenge) {
    return (
      <LessonChallenge
        key={lessonId}
        lesson={lesson}
        course={courseData}
        allLessons={allLessons}
        lessonIndex={lessonIndex}
        locale={locale}
        slug={slug}
      />
    );
  }

  return (
    <LessonReading
      key={lessonId}
      lesson={lesson}
      course={courseData}
      allLessons={allLessons}
      lessonIndex={lessonIndex}
      locale={locale}
      slug={slug}
    />
  );
}
