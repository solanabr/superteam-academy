"use client";

import { Link } from "@/i18n/navigation";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { CheckCircle } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import type { Module } from "@/lib/data/types";
import type { LessonCompletionState } from "@/lib/hooks/use-lesson-completion";

type Props = {
  courseSlug: string;
  module: Module;
  startIndex: number;
  currentLessonId: string;
  completion: LessonCompletionState;
};

export function LessonModuleOverview({
  courseSlug,
  module,
  startIndex,
  currentLessonId,
  completion,
}: Props) {
  return (
    <Accordion type="single" defaultValue={module.id} collapsible>
      <AccordionItem value={module.id} className="border-0">
        <AccordionTrigger className="rounded-lg border bg-muted/30 px-3 py-2 hover:no-underline hover:bg-muted/50">
          {module.title}
        </AccordionTrigger>
        <AccordionContent>
          <ul className="mt-2 space-y-0.5">
            {module.lessons.map((lesson, i) => {
              const idx = startIndex + i;
              const completed = completion.isComplete(idx);
              const isCurrent = lesson.id === currentLessonId;

              return (
                <li key={lesson.id}>
                  <Link
                    href={`/courses/${courseSlug}/lessons/${lesson.id}?type=${lesson.type}`}
                    className={cn(
                      "flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
                      isCurrent && "bg-primary/10 font-medium text-primary",
                      !isCurrent && "hover:bg-muted/50",
                      completed && !isCurrent && "text-muted-foreground",
                    )}
                  >
                    {completed ? (
                      <CheckCircle
                        className="size-4 shrink-0 text-primary"
                        weight="fill"
                      />
                    ) : (
                      <span className="size-4 shrink-0 font-mono text-xs text-muted-foreground">
                        {i + 1}
                      </span>
                    )}
                    <span className="min-w-0 truncate">{lesson.title}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}
