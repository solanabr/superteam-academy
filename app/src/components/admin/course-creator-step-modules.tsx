"use client";

import { useTranslations } from "next-intl";
import { Plus, Trash2, BookOpen, Code, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { DraftCourse, DraftModule, DraftLesson } from "./course-creator-types";

interface CourseCreatorModulesProps {
  draft: DraftCourse;
  onChange: (updates: Partial<DraftCourse>) => void;
}

function genId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

const DEFAULT_XP: Record<DraftCourse["difficulty"], number> = {
  beginner: 15,
  intermediate: 30,
  advanced: 50,
};

export function CourseCreatorModules({ draft, onChange }: CourseCreatorModulesProps) {
  const t = useTranslations("admin.creator.modules");

  function addModule() {
    const newModule: DraftModule = {
      id: genId(),
      title: "",
      description: "",
      lessons: [],
    };
    onChange({ modules: [...draft.modules, newModule] });
  }

  function removeModule(moduleId: string) {
    onChange({ modules: draft.modules.filter((m) => m.id !== moduleId) });
  }

  function updateModule(moduleId: string, updates: Partial<DraftModule>) {
    onChange({
      modules: draft.modules.map((m) =>
        m.id === moduleId ? { ...m, ...updates } : m
      ),
    });
  }

  function addLesson(moduleId: string, type: DraftLesson["type"]) {
    const newLesson: DraftLesson = {
      id: genId(),
      title: "",
      type,
      xpReward: DEFAULT_XP[draft.difficulty],
      duration: "10 min",
    };
    onChange({
      modules: draft.modules.map((m) =>
        m.id === moduleId ? { ...m, lessons: [...m.lessons, newLesson] } : m
      ),
    });
  }

  function removeLesson(moduleId: string, lessonId: string) {
    onChange({
      modules: draft.modules.map((m) =>
        m.id === moduleId
          ? { ...m, lessons: m.lessons.filter((l) => l.id !== lessonId) }
          : m
      ),
    });
  }

  function updateLesson(
    moduleId: string,
    lessonId: string,
    updates: Partial<DraftLesson>
  ) {
    onChange({
      modules: draft.modules.map((m) =>
        m.id === moduleId
          ? {
              ...m,
              lessons: m.lessons.map((l) =>
                l.id === lessonId ? { ...l, ...updates } : l
              ),
            }
          : m
      ),
    });
  }

  const totalLessons = draft.modules.reduce((s, m) => s + m.lessons.length, 0);
  const totalXP = draft.modules.reduce(
    (s, m) => s + m.lessons.reduce((ls, l) => ls + l.xpReward, 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">{t("title")}</h2>
          <p className="text-sm text-muted-foreground">
            {totalLessons} {t("lessonCount")} · {totalXP} XP
          </p>
        </div>
        <Button onClick={addModule} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          {t("addModule")}
        </Button>
      </div>

      {/* Empty state */}
      {draft.modules.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center">
          <BookOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium text-muted-foreground">{t("emptyModules")}</p>
          <p className="mt-1 text-sm text-muted-foreground/70">{t("emptyModulesHint")}</p>
          <Button className="mt-4" onClick={addModule} variant="outline" size="sm">
            <Plus className="mr-2 h-4 w-4" />
            {t("addModule")}
          </Button>
        </div>
      )}

      {/* Module list */}
      <div className="space-y-4">
        {draft.modules.map((mod, modIdx) => (
          <div key={mod.id} className="rounded-xl border bg-card">
            {/* Module Header */}
            <div className="flex items-start gap-3 border-b p-4">
              <GripVertical className="mt-2 h-4 w-4 shrink-0 text-muted-foreground/40" />
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-st-green/10 text-xs font-bold text-st-green">
                    {modIdx + 1}
                  </span>
                  <Input
                    value={mod.title}
                    onChange={(e) => updateModule(mod.id, { title: e.target.value })}
                    placeholder={t("moduleTitlePlaceholder")}
                    className="font-medium"
                  />
                </div>
                <Input
                  value={mod.description}
                  onChange={(e) => updateModule(mod.id, { description: e.target.value })}
                  placeholder={t("moduleDescriptionPlaceholder")}
                  className="text-sm"
                />
              </div>
              <button
                type="button"
                onClick={() => removeModule(mod.id)}
                className="mt-1 rounded p-1 text-muted-foreground hover:text-destructive"
                aria-label={t("removeModule")}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {/* Lessons */}
            <div className="divide-y">
              {mod.lessons.map((lesson, lessonIdx) => (
                <div key={lesson.id} className="flex items-center gap-3 px-4 py-3">
                  <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/30" />
                  <span className="w-5 text-center text-xs text-muted-foreground">
                    {lessonIdx + 1}
                  </span>
                  {lesson.type === "challenge" ? (
                    <Code className="h-4 w-4 shrink-0 text-brazil-gold" />
                  ) : (
                    <BookOpen className="h-4 w-4 shrink-0 text-brazil-green" />
                  )}
                  <Input
                    value={lesson.title}
                    onChange={(e) =>
                      updateLesson(mod.id, lesson.id, { title: e.target.value })
                    }
                    placeholder={t("lessonTitlePlaceholder")}
                    className="flex-1 text-sm"
                  />
                  {/* Type toggle */}
                  <div className="flex shrink-0 items-center overflow-hidden rounded-md border text-xs">
                    <button
                      type="button"
                      onClick={() =>
                        updateLesson(mod.id, lesson.id, { type: "content" })
                      }
                      className={`px-2 py-1 transition-colors ${
                        lesson.type === "content"
                          ? "bg-brazil-green/20 text-brazil-green font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t("content")}
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        updateLesson(mod.id, lesson.id, { type: "challenge" })
                      }
                      className={`px-2 py-1 transition-colors ${
                        lesson.type === "challenge"
                          ? "bg-brazil-gold/20 text-brazil-gold font-medium"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                    >
                      {t("challenge")}
                    </button>
                  </div>
                  {/* XP */}
                  <div className="flex shrink-0 items-center gap-1">
                    <input
                      type="number"
                      value={lesson.xpReward}
                      onChange={(e) =>
                        updateLesson(mod.id, lesson.id, {
                          xpReward: Math.max(0, Number(e.target.value)),
                        })
                      }
                      className="w-14 rounded border bg-background px-2 py-1 text-center text-xs"
                      min={0}
                      max={500}
                    />
                    <span className="text-xs text-muted-foreground">XP</span>
                  </div>
                  {/* Duration */}
                  <Input
                    value={lesson.duration}
                    onChange={(e) =>
                      updateLesson(mod.id, lesson.id, { duration: e.target.value })
                    }
                    placeholder="10 min"
                    className="w-20 shrink-0 text-xs"
                  />
                  <button
                    type="button"
                    onClick={() => removeLesson(mod.id, lesson.id)}
                    className="rounded p-1 text-muted-foreground hover:text-destructive"
                    aria-label={t("removeLesson")}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add Lesson buttons */}
            <div className="flex items-center gap-2 px-4 py-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addLesson(mod.id, "content")}
                className="text-xs"
              >
                <BookOpen className="mr-1 h-3.5 w-3.5 text-brazil-green" />
                {t("addContent")}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => addLesson(mod.id, "challenge")}
                className="text-xs"
              >
                <Code className="mr-1 h-3.5 w-3.5 text-brazil-gold" />
                {t("addChallenge")}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
