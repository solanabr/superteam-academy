import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { HugeiconsIcon } from "@hugeicons/react";
import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import type { Lesson } from "@/lib/services/types";

interface LessonWithMeta extends Lesson {
  lessonNumber: number;
}

interface LessonReadingContentProps {
  lesson: Lesson;
  courseSlug: string;
  currentLocale: string;
  currentIndex: number;
  allLessonsLength: number;
  prevLesson?: { id: string; title: string };
  nextLesson?: { id: string; title: string };
  t: (key: string, values?: any) => string;
}

export function LessonReadingContent({
  lesson,
  courseSlug,
  currentLocale,
  currentIndex,
  allLessonsLength,
  prevLesson,
  nextLesson,
  t,
}: LessonReadingContentProps) {
  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8">
        <div className="flex items-center gap-3 mb-6">
          <Badge variant="outline">{t("reading")}</Badge>
          <span className="text-sm text-muted-foreground">{t("lessonOf", { current: currentIndex + 1, total: allLessonsLength })}</span>
        </div>
        
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-6">
          {lesson.title}
        </h1>
        
        <div className="prose prose-muted max-w-none">
          <p>{t("readingPlaceholder")}</p>
          <p className="mt-4">In a full implementation, this would contain:</p>
          <ul className="list-disc pl-6 mt-2 space-y-1">
            <li>Formatted markdown content</li>
            <li>Code snippets with syntax highlighting</li>
            <li>Images and diagrams</li>
            <li>Links to external resources</li>
          </ul>
        </div>

        <div className="mt-8 flex justify-between pt-6 border-t border-border">
          {prevLesson ? (
            <Link 
              href={`/${currentLocale}/courses/${courseSlug}/lessons/${prevLesson.id}`}
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
            >
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} />
              {t("previous")}
            </Link>
          ) : <div />}
          
          {nextLesson && (
            <Link 
              href={`/${currentLocale}/courses/${courseSlug}/lessons/${nextLesson.id}`}
              className="inline-flex items-center gap-2 text-sm text-primary hover:underline"
            >
              {t("next")}
              <HugeiconsIcon icon={ArrowLeft02Icon} size={16} className="rotate-180" />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
