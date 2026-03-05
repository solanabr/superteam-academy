"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { LocaleField } from "./locale-field";
import { LessonEditor } from "./lesson-editor";
import { Plus, Trash2, ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";
import type { ModuleForm, LessonForm } from "@/types/admin";

interface ModuleEditorProps {
  module: ModuleForm;
  onChange: (module: ModuleForm) => void;
  onRemove: () => void;
}

function createEmptyLesson(): LessonForm {
  return {
    lessonId: crypto.randomUUID().slice(0, 8),
    title: { pt: "", en: "", es: "" },
    slug: "",
    lessonType: "content",
    durationMinutes: 10,
    xpReward: 50,
  };
}

export function ModuleEditor({
  module,
  onChange,
  onRemove,
}: ModuleEditorProps) {
  const t = useTranslations("admin");
  const [open, setOpen] = useState(true);

  const update = (patch: Partial<ModuleForm>) =>
    onChange({ ...module, ...patch });

  const updateLesson = (index: number, lesson: LessonForm) => {
    const lessons = [...module.lessons];
    lessons[index] = lesson;
    update({ lessons });
  };

  const removeLesson = (index: number) => {
    update({ lessons: module.lessons.filter((_, i) => i !== index) });
  };

  return (
    <div className="rounded-xl border-2 border-[hsl(var(--brand-logo-green))]/30 bg-card">
      <div
        className="flex items-center justify-between cursor-pointer px-4 py-3"
        onClick={() => setOpen(!open)}
      >
        <div className="flex items-center gap-2">
          {open ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
          <span className="font-semibold">
            {module.title.pt || t("moduleTitle")}
          </span>
          <span className="text-xs text-muted-foreground">
            ({module.lessons.length} {t("lessons").toLowerCase()})
          </span>
        </div>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <Trash2 className="h-4 w-4 text-red-500" />
        </Button>
      </div>

      {open && (
        <div className="space-y-4 border-t px-4 py-4">
          <LocaleField
            value={module.title}
            onChange={(title) => update({ title })}
            label={t("moduleTitle")}
            required
          />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">{t("lessons")}</h4>
            {module.lessons.map((lesson, li) => (
              <LessonEditor
                key={lesson.lessonId}
                lesson={lesson}
                onChange={(l) => updateLesson(li, l)}
                onRemove={() => removeLesson(li)}
              />
            ))}
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() =>
                update({ lessons: [...module.lessons, createEmptyLesson()] })
              }
              className="gap-1"
            >
              <Plus className="h-3 w-3" />
              {t("addLesson")}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
