"use client";

import { useTranslations } from "next-intl";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { TRACKS } from "@/lib/constants";
import type { DraftCourse } from "./course-creator-types";

interface CourseCreatorBasicProps {
  draft: DraftCourse;
  onChange: (updates: Partial<DraftCourse>) => void;
}

const DIFFICULTIES = ["beginner", "intermediate", "advanced"] as const;

const DIFFICULTY_STYLES: Record<string, string> = {
  beginner: "border-brazil-green text-brazil-green bg-brazil-green/10",
  intermediate: "border-brazil-gold text-brazil-gold bg-brazil-gold/10",
  advanced: "border-brazil-coral text-brazil-coral bg-brazil-coral/10",
};

export function CourseCreatorBasic({ draft, onChange }: CourseCreatorBasicProps) {
  const t = useTranslations("admin.creator.basic");

  function handleTagInput(value: string) {
    const tags = value
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    onChange({ tags });
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
      {/* Left Column */}
      <div className="space-y-5">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
        </div>

        {/* Course Title */}
        <div className="space-y-1.5">
          <Label htmlFor="course-title">{t("courseTitle")} *</Label>
          <Input
            id="course-title"
            value={draft.title}
            onChange={(e) => onChange({ title: e.target.value })}
            placeholder={t("courseTitlePlaceholder")}
            maxLength={80}
          />
        </div>

        {/* Auto-slug */}
        <div className="space-y-1.5">
          <Label htmlFor="course-slug">{t("slug")}</Label>
          <div className="flex items-center gap-2">
            <span className="whitespace-nowrap text-xs text-muted-foreground">/courses/</span>
            <Input
              id="course-slug"
              value={draft.slug}
              onChange={(e) => onChange({ slug: e.target.value })}
              className="font-mono text-sm"
              placeholder="course-url-slug"
            />
          </div>
          <p className="text-xs text-muted-foreground">{t("slugHint")}</p>
        </div>

        {/* Description */}
        <div className="space-y-1.5">
          <Label htmlFor="course-description">{t("description")} *</Label>
          <textarea
            id="course-description"
            value={draft.description}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder={t("descriptionPlaceholder")}
            rows={4}
            maxLength={300}
            className="w-full resize-none rounded-md border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="text-right text-xs text-muted-foreground">
            {draft.description.length}/300
          </p>
        </div>

        {/* Instructor */}
        <div className="space-y-1.5">
          <Label htmlFor="course-creator">{t("creator")} *</Label>
          <Input
            id="course-creator"
            value={draft.creator}
            onChange={(e) => onChange({ creator: e.target.value })}
            placeholder={t("creatorPlaceholder")}
          />
        </div>

        {/* Tags */}
        <div className="space-y-1.5">
          <Label htmlFor="course-tags">{t("tags")}</Label>
          <Input
            id="course-tags"
            defaultValue={draft.tags.join(", ")}
            onBlur={(e) => handleTagInput(e.target.value)}
            placeholder={t("tagsPlaceholder")}
          />
          {draft.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {draft.tags.map((tag) => (
                <Badge key={tag} variant="outline" className="text-xs">
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column */}
      <div className="space-y-5">
        {/* Difficulty */}
        <div className="space-y-2">
          <Label>{t("difficulty")} *</Label>
          <div className="flex gap-2">
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => onChange({ difficulty: diff })}
                className={`flex-1 rounded-lg border-2 px-3 py-2.5 text-sm font-medium transition-all ${
                  draft.difficulty === diff
                    ? DIFFICULTY_STYLES[diff]
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                {t(`difficultyOption.${diff}`)}
              </button>
            ))}
          </div>
        </div>

        {/* Track */}
        <div className="space-y-2">
          <Label>{t("track")} *</Label>
          <div className="grid grid-cols-2 gap-2">
            {Object.entries(TRACKS).map(([id, meta]) => (
              <button
                key={id}
                type="button"
                onClick={() => onChange({ trackId: Number(id) })}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                  draft.trackId === Number(id)
                    ? "border-st-green bg-st-green/10 text-foreground"
                    : "border-border text-muted-foreground hover:border-muted-foreground"
                }`}
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: meta.color }}
                />
                <span className="truncate text-xs">{meta.display}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Live preview card */}
        {draft.title && (
          <div className="rounded-xl border bg-muted/20 p-4">
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              {t("cardPreview")}
            </p>
            <div className="rounded-lg border bg-card p-3">
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold leading-tight">{draft.title}</h3>
                <span
                  className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium capitalize ${DIFFICULTY_STYLES[draft.difficulty]}`}
                >
                  {draft.difficulty}
                </span>
              </div>
              {draft.description && (
                <p className="mt-1 text-xs text-muted-foreground line-clamp-2">
                  {draft.description}
                </p>
              )}
              {draft.creator && (
                <p className="mt-2 text-xs text-muted-foreground">
                  by {draft.creator}
                </p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
