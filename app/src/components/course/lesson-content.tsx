"use client";

import { CodeEditor } from "@/components/editor/code-editor";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { Lesson } from "@/types";
import { useState } from "react";
import { GripVertical } from "lucide-react";
import { useTranslations } from "next-intl";

interface LessonContentProps {
  lesson: Lesson;
  onComplete: () => Promise<void> | void;
  completed?: boolean;
}

export function LessonContent({ lesson, onComplete, completed }: LessonContentProps) {
  const t = useTranslations("Courses");
  const [code, setCode] = useState(lesson.starterCode ?? "// No coding challenge in this lesson.");
  const [split, setSplit] = useState(52);

  const handleDrag = (event: React.MouseEvent<HTMLButtonElement>) => {
    const startX = event.clientX;
    const startSplit = split;

    const onMove = (moveEvent: MouseEvent) => {
      const delta = moveEvent.clientX - startX;
      const width = window.innerWidth;
      const next = Math.max(30, Math.min(70, startSplit + (delta / width) * 100));
      setSplit(next);
    };

    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };

    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  return (
    <article className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">{lesson.title}</h1>
          <p className="mt-2 text-sm text-muted-foreground">{lesson.objective}</p>
        </div>
        <Badge variant="outline" className="border-border text-muted-foreground">
          {lesson.kind === "challenge" ? t("challenge") : t("content")}
        </Badge>
      </div>

      <div className="overflow-hidden rounded-xl border border-border bg-st-dark/65">
        <div className="flex min-h-[60vh] flex-col lg:flex-row">
          <div className="p-5" style={{ width: `${split}%` }}>
            <h2 className="mb-2 text-sm font-semibold text-foreground/90">{t("lessonObjective")}</h2>
            <Separator className="mb-4 bg-white/10" />
            <div className="prose prose-invert max-w-none text-sm leading-relaxed text-muted-foreground">
              {lesson.markdown.split("\n").map((line, index) => (
                <p key={index}>{line.replace(/^###\s*/, "")}</p>
              ))}
            </div>
          </div>

          <button
            type="button"
            aria-label="Resize panels"
            className="hidden w-6 items-center justify-center border-x border-border bg-card lg:flex"
            onMouseDown={handleDrag}
          >
            <GripVertical className="size-4 text-muted-foreground/70" />
          </button>

          <div className="min-h-[320px] flex-1 border-t border-border lg:border-t-0">
            <CodeEditor value={code} onChange={setCode} />
          </div>
        </div>
      </div>

      <Button
        onClick={() => void onComplete()}
        disabled={completed}
        className="bg-gradient-to-r from-[#2f6b3f] to-[#ffd23f] text-st-dark"
      >
        {completed ? "Completed" : t("markComplete")}
      </Button>
    </article>
  );
}
