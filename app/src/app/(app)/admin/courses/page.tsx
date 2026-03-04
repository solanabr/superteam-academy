"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useI18n } from "@/components/providers/I18nProvider";

// Configure this URL after deploying Sanity Studio
// Deployed URL: https://caminho.sanity.studio
// Run: cd sanity-studio && npm install && npx sanity deploy
const SANITY_STUDIO_URL = process.env.NEXT_PUBLIC_SANITY_STUDIO_URL || "https://caminho.sanity.studio";

interface CourseStats {
  course_id: string;
  course_title: string;
  enrollment_count: number;
  avg_completion: number;
  completions: number;
}

export default function AdminCoursesPage() {
  const { t } = useI18n();
  const [courses, setCourses] = useState<CourseStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const supabase = createClient();

    async function fetchCourses() {
      const { data: enrollments } = await supabase
        .from("enrollments")
        .select("course_id, course_title, lesson_progress, total_lessons, completed_at");

      if (!enrollments || enrollments.length === 0) {
        setCourses([]);
        setLoading(false);
        return;
      }

      // Group by course
      const grouped: Record<string, {
        course_title: string;
        enrollments: typeof enrollments;
      }> = {};

      enrollments.forEach((e) => {
        if (!grouped[e.course_id]) {
          grouped[e.course_id] = { course_title: e.course_title, enrollments: [] };
        }
        grouped[e.course_id].enrollments.push(e);
      });

      const courseStats: CourseStats[] = Object.entries(grouped).map(([course_id, data]) => {
        const total = data.enrollments.length;
        const completions = data.enrollments.filter((e) => e.completed_at).length;
        const avgCompletion = total > 0
          ? data.enrollments.reduce((sum, e) => {
              const pct = e.total_lessons > 0 ? (e.lesson_progress / e.total_lessons) * 100 : 0;
              return sum + pct;
            }, 0) / total
          : 0;

        return {
          course_id,
          course_title: data.course_title || course_id,
          enrollment_count: total,
          avg_completion: Math.round(avgCompletion),
          completions,
        };
      });

      courseStats.sort((a, b) => b.enrollment_count - a.enrollment_count);
      setCourses(courseStats);
      setLoading(false);
    }

    fetchCourses();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-neutral-300 dark:border-neutral-600 border-t-neutral-900 dark:border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Sanity Studio link */}
      <div className="p-4 rounded-2xl border border-dashed border-neutral-300 dark:border-neutral-700 flex items-center justify-between">
        <div>
          <span className="text-sm text-neutral-600 dark:text-neutral-400">{t("admin.manageSanity")}</span>
          {!SANITY_STUDIO_URL && (
            <p className="text-xs text-neutral-400 mt-1">Studio not deployed yet. See deployment instructions in sanity-studio/README.md</p>
          )}
        </div>
        {SANITY_STUDIO_URL ? (
          <a
            href={SANITY_STUDIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 text-xs font-semibold bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 rounded-full hover:bg-neutral-700 dark:hover:bg-neutral-200 transition-colors"
          >
            Open Studio &rarr;
          </a>
        ) : (
          <span className="px-4 py-2 text-xs font-semibold bg-neutral-200 dark:bg-neutral-800 text-neutral-500 rounded-full cursor-not-allowed">
            Not Configured
          </span>
        )}
      </div>

      {/* Course table */}
      <div className="p-6 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 dark:border-neutral-800">
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.course")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.enrollments")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.avgCompletion")}</th>
              <th className="text-left py-2 px-3 text-xs font-medium text-neutral-500 dark:text-neutral-400 uppercase tracking-wide">{t("admin.completions")}</th>
            </tr>
          </thead>
          <tbody>
            {courses.map((c) => (
              <tr key={c.course_id} className="border-b border-neutral-50 dark:border-neutral-800/50 hover:bg-neutral-50 dark:hover:bg-neutral-800/30 transition-colors">
                <td className="py-2.5 px-3 font-medium">{c.course_title}</td>
                <td className="py-2.5 px-3">{c.enrollment_count}</td>
                <td className="py-2.5 px-3">
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1.5 bg-neutral-100 dark:bg-neutral-800 rounded-full overflow-hidden">
                      <div className="h-full bg-neutral-900 dark:bg-white rounded-full" style={{ width: `${c.avg_completion}%` }} />
                    </div>
                    <span className="text-xs text-neutral-500">{c.avg_completion}%</span>
                  </div>
                </td>
                <td className="py-2.5 px-3">{c.completions}</td>
              </tr>
            ))}
            {courses.length === 0 && (
              <tr>
                <td colSpan={4} className="py-8 text-center text-neutral-400">{t("admin.noData")}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
