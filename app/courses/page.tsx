"use client";

import { BookOpen, Zap } from "lucide-react";
import { CourseGrid } from "@/components/courses/CourseGrid";
import { useI18n } from "@/lib/i18n/provider";

export default function CoursesPage(): JSX.Element {
  const { t } = useI18n();

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-10">
      {/* Header */}
      <section className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-solana-purple/10">
              <BookOpen className="h-5 w-5 text-solana-purple" />
            </div>
            <h1 className="text-2xl font-bold">{t("courses.title")}</h1>
          </div>
          <p className="max-w-lg text-sm text-muted-foreground">{t("courses.subtitle")}</p>
        </div>
        <div className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-2 text-sm text-muted-foreground">
          <Zap className="h-4 w-4 text-solana-green" />
          <span>Earn <span className="font-semibold text-solana-green">XP</span> for every lesson completed</span>
        </div>
      </section>
      <CourseGrid />
    </div>
  );
}
