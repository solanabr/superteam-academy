"use client";

import { useTranslations } from "next-intl";
import { Zap, Clock, Eye, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { calcTotalXP } from "./course-creator-types";
import type { DraftCourse } from "./course-creator-types";

interface CourseCreatorSettingsProps {
  draft: DraftCourse;
  onChange: (updates: Partial<DraftCourse>) => void;
  availableCourses?: { slug: string; title: string }[];
}

export function CourseCreatorSettings({
  draft,
  onChange,
  availableCourses = [],
}: CourseCreatorSettingsProps) {
  const t = useTranslations("admin.creator.settings");
  const autoXP = calcTotalXP(draft.modules);

  function togglePrerequisite(slug: string) {
    const current = draft.prerequisites;
    if (current.includes(slug)) {
      onChange({ prerequisites: current.filter((s) => s !== slug) });
    } else {
      onChange({ prerequisites: [...current, slug] });
    }
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Left */}
      <div className="space-y-6">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Total XP */}
        <div className="space-y-2">
          <Label htmlFor="xp-total" className="flex items-center gap-2">
            <Zap className="h-4 w-4 text-xp" />
            {t("totalXP")}
          </Label>
          <div className="flex items-center gap-3">
            <Input
              id="xp-total"
              type="number"
              value={draft.xpTotal || autoXP}
              onChange={(e) => onChange({ xpTotal: Math.max(0, Number(e.target.value)) })}
              className="w-32"
              min={0}
            />
            {autoXP !== draft.xpTotal && autoXP > 0 && (
              <button
                type="button"
                onClick={() => onChange({ xpTotal: autoXP })}
                className="text-xs text-st-green underline-offset-2 hover:underline"
              >
                {t("useCalculated", { xp: autoXP })}
              </button>
            )}
          </div>
          <p className="text-xs text-muted-foreground">{t("totalXPHint")}</p>
        </div>

        {/* Duration */}
        <div className="space-y-2">
          <Label htmlFor="duration" className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            {t("duration")}
          </Label>
          <Input
            id="duration"
            value={draft.duration}
            onChange={(e) => onChange({ duration: e.target.value })}
            placeholder={t("durationPlaceholder")}
            className="w-48"
          />
        </div>

        {/* Publish toggle */}
        <div className="flex items-start justify-between rounded-xl border p-4">
          <div className="space-y-0.5">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Eye className="h-4 w-4 text-muted-foreground" />
              {t("isActive")}
            </Label>
            <p className="text-xs text-muted-foreground">{t("isActiveHint")}</p>
          </div>
          <Switch
            checked={draft.isActive}
            onCheckedChange={(checked) => onChange({ isActive: checked })}
          />
        </div>
      </div>

      {/* Right */}
      <div className="space-y-6">
        {/* Prerequisites */}
        <div className="space-y-2">
          <Label className="flex items-center gap-2">
            <BookOpen className="h-4 w-4 text-muted-foreground" />
            {t("prerequisites")}
          </Label>
          <p className="text-xs text-muted-foreground">{t("prerequisitesHint")}</p>
          {availableCourses.length > 0 ? (
            <div className="max-h-48 space-y-1 overflow-y-auto rounded-lg border p-2">
              {availableCourses.map((course) => (
                <label
                  key={course.slug}
                  className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 hover:bg-muted"
                >
                  <input
                    type="checkbox"
                    checked={draft.prerequisites.includes(course.slug)}
                    onChange={() => togglePrerequisite(course.slug)}
                    className="h-3.5 w-3.5 accent-st-green"
                  />
                  <span className="text-sm">{course.title}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground italic">
              {t("noPrerequisites")}
            </p>
          )}
        </div>

        {/* Summary card */}
        <div className="rounded-xl border bg-muted/20 p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("courseSummary")}
          </p>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("summaryModules")}</span>
              <span className="font-medium">{draft.modules.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("summaryLessons")}</span>
              <span className="font-medium">
                {draft.modules.reduce((s, m) => s + m.lessons.length, 0)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t("summaryChallenges")}</span>
              <span className="font-medium">
                {draft.modules.reduce(
                  (s, m) => s + m.lessons.filter((l) => l.type === "challenge").length,
                  0
                )}
              </span>
            </div>
            <div className="flex justify-between border-t pt-2">
              <span className="text-muted-foreground">{t("summaryXP")}</span>
              <span className="font-bold text-xp">{autoXP} XP</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
