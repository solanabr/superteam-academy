"use client";

import { useTranslations } from "next-intl";
import {
  CheckCircle2,
  BookOpen,
  Code,
  Zap,
  Clock,
  GraduationCap,
  Rocket,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useTracks } from "@/lib/hooks/use-tracks";
import { useDifficulties } from "@/lib/hooks/use-difficulties";
import { difficultyStyle } from "@/lib/utils";
import { CourseIllustration } from "@/components/icons/course-illustration";
import { calcTotalXP, calcCourseCounts } from "./course-creator-types";
import type { DraftCourse } from "./course-creator-types";

interface CourseCreatorPreviewProps {
  draft: DraftCourse;
  onPublish: () => void;
}

export function CourseCreatorPreview({
  draft,
  onPublish,
}: CourseCreatorPreviewProps) {
  const t = useTranslations("admin.creator.preview");
  const tracks = useTracks();
  const difficulties = useDifficulties();
  const trackMeta = tracks[draft.trackId];
  const diff = difficulties.find((d) => d.value === draft.difficulty);
  const { lessonCount } = calcCourseCounts(draft.modules);
  const totalXP = draft.xpTotal || calcTotalXP(draft.modules);

  const isValid =
    draft.title.length > 0 &&
    draft.description.length > 0 &&
    draft.creator.length > 0 &&
    draft.modules.length > 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h2 className="text-lg font-semibold">{t("title")}</h2>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      {/* Validation checklist */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { key: "hasTitle", pass: draft.title.length > 0 },
          { key: "hasDescription", pass: draft.description.length > 0 },
          { key: "hasCreator", pass: draft.creator.length > 0 },
          { key: "hasModules", pass: draft.modules.length > 0 },
        ].map(({ key, pass }) => (
          <div
            key={key}
            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${
              pass
                ? "border-brazil-green/30 bg-brazil-green/5 text-foreground"
                : "border-destructive/30 bg-destructive/5 text-muted-foreground"
            }`}
          >
            <CheckCircle2
              className={`h-4 w-4 shrink-0 ${pass ? "text-brazil-green" : "text-muted-foreground/40"}`}
            />
            {t(`check.${key}`)}
          </div>
        ))}
      </div>

      {/* Course card preview */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("courseCard")}
          </p>
          <div className="overflow-hidden rounded-xl border bg-card shadow-sm">
            {/* Thumbnail */}
            <div className="relative h-36 w-full overflow-hidden bg-muted">
              <CourseIllustration
                trackColor={trackMeta?.color ?? "#a1a1aa"}
                variant={draft.modules.length % 6}
                className="h-full w-full"
              />
            </div>
            {/* Content */}
            <div className="p-4">
              <div className="mb-2 flex items-start gap-2">
                <div className="flex flex-1 flex-wrap gap-1.5">
                  <Badge
                    variant="outline"
                    className="text-xs"
                    style={difficultyStyle(diff?.color ?? "#888")}
                  >
                    {diff?.label ?? draft.difficulty}
                  </Badge>
                  {trackMeta && (
                    <Badge
                      variant="outline"
                      className="text-xs"
                      style={{
                        borderColor: trackMeta.color,
                        color: trackMeta.color,
                      }}
                    >
                      {trackMeta.display}
                    </Badge>
                  )}
                </div>
              </div>
              <h3 className="font-semibold leading-tight">
                {draft.title || t("untitledCourse")}
              </h3>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                {draft.description || t("noDescription")}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5" />
                  {lessonCount} {t("lessons")}
                </span>
                <span className="flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-xp" />
                  {totalXP} XP
                </span>
                {draft.duration && (
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {draft.duration}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Module list preview */}
        <div className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            {t("moduleOverview")}
          </p>
          <div className="space-y-2">
            {draft.modules.slice(0, 5).map((mod, idx) => (
              <div key={mod.id} className="rounded-lg border bg-card p-3">
                <div className="flex items-start gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-st-green/10 text-xs font-bold text-st-green">
                    {idx + 1}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-medium">
                      {mod.title || t("unnamedModule")}
                    </p>
                    <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                      <span>
                        {mod.lessons.length} {t("lessons")}
                      </span>
                      <span className="flex items-center gap-0.5">
                        <Code className="h-3 w-3 text-brazil-gold" />
                        {
                          mod.lessons.filter((l) => l.type === "challenge")
                            .length
                        }{" "}
                        {t("challenges")}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            {draft.modules.length > 5 && (
              <p className="text-center text-xs text-muted-foreground">
                +{draft.modules.length - 5} {t("moreModules")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Publish section */}
      <div className="rounded-xl border bg-muted/10 p-6">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-st-green/10">
              {draft.isActive ? (
                <Rocket className="h-5 w-5 text-st-green" />
              ) : (
                <GraduationCap className="h-5 w-5 text-st-green" />
              )}
            </div>
            <div>
              <p className="font-semibold">
                {draft.isActive ? t("readyToPublish") : t("saveAsDraft")}
              </p>
              <p className="text-sm text-muted-foreground">
                {draft.isActive ? t("publishHint") : t("draftHint")}
              </p>
            </div>
          </div>
          <Button
            onClick={onPublish}
            disabled={!isValid}
            size="lg"
            className="shrink-0"
          >
            {draft.isActive ? t("publish") : t("saveDraft")}
          </Button>
        </div>
        {!isValid && (
          <p className="mt-3 text-xs text-destructive">{t("fixValidation")}</p>
        )}
      </div>
    </div>
  );
}
