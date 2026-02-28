"use client";

import { BookOpen } from "lucide-react";
import { formatXP } from "@/lib/utils";
import { EmptyState } from "@/components/ui/empty-state";
import { EmptyHistoryIllustration } from "@/components/icons";

export interface CompletedCourseItem {
  slug: string;
  title: string;
  xpTotal: number;
}

interface CourseHistoryProps {
  completedCourses: CompletedCourseItem[];
  title: string;
  emptyMessage: string;
}

export function CourseHistory({
  completedCourses,
  title,
  emptyMessage,
}: CourseHistoryProps) {
  return (
    <section className="glass rounded-2xl p-6">
      <h2 className="mb-4 text-lg font-bold">{title}</h2>
      {completedCourses.length > 0 ? (
        <div className="space-y-3">
          {completedCourses.map((course) => (
            <div
              key={course.slug}
              className="flex items-center gap-4 rounded-xl border border-white/5 bg-muted/20 p-4 transition-colors hover:border-brazil-green/30"
            >
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-brazil-green/10">
                <BookOpen className="h-5 w-5 text-brazil-green" />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="truncate font-semibold">{course.title}</h3>
                <span className="mt-0.5 text-xs text-xp">{formatXP(course.xpTotal)} XP</span>
              </div>
              <div className="flex h-8 items-center rounded-full bg-brazil-green/10 px-3 text-xs font-semibold text-brazil-green">
                100%
              </div>
            </div>
          ))}
        </div>
      ) : (
        <EmptyState
          illustration={<EmptyHistoryIllustration className="h-full w-full" />}
          title={emptyMessage}
          compact
        />
      )}
    </section>
  );
}
