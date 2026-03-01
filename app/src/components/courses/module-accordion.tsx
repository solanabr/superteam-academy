'use client';

import { CheckCircle2 } from 'lucide-react';
import {
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { Progress } from '@/components/ui/progress';
import { LessonRow } from '@/components/courses/lesson-row';
import type { LessonData } from '@/components/courses/lesson-row';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ModuleData {
  title: string;
  lessons: LessonData[];
}

interface ModuleAccordionProps {
  module: ModuleData;
  moduleIndex: number;
  courseId: string;
  /** Global lesson index offset (sum of lessons in previous modules). */
  lessonOffset: number;
  /** Set of completed lesson indices (global). */
  completedLessons: Set<number>;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ModuleAccordion({
  module,
  moduleIndex,
  courseId,
  lessonOffset,
  completedLessons,
}: ModuleAccordionProps) {
  const totalLessons = module.lessons.length;

  const completedInModule = module.lessons.filter((_, i) =>
    completedLessons.has(lessonOffset + i),
  ).length;

  const progressPercent =
    totalLessons > 0 ? (completedInModule / totalLessons) * 100 : 0;
  const isModuleComplete = completedInModule === totalLessons && totalLessons > 0;

  return (
    <AccordionItem value={`module-${moduleIndex}`} className="border-border/50">
      <AccordionTrigger className="py-3 hover:no-underline">
        <div className="flex flex-1 flex-col gap-1.5 text-left">
          {/* Module title row */}
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-xs font-semibold uppercase tracking-wider">
              Module {moduleIndex + 1}
            </span>
            {isModuleComplete && (
              <CheckCircle2 className="size-3.5 text-emerald-500" />
            )}
          </div>

          <span className="text-sm font-semibold">{module.title}</span>

          {/* Progress info */}
          <div className="flex items-center gap-3">
            <Progress
              value={progressPercent}
              className={cn(
                'h-1 w-24',
                isModuleComplete && '[&>div]:bg-emerald-500',
              )}
            />
            <span className="text-muted-foreground text-xs tabular-nums">
              {completedInModule}/{totalLessons} lessons
            </span>
          </div>
        </div>
      </AccordionTrigger>

      <AccordionContent className="pb-2">
        <div className="flex flex-col gap-0.5">
          {module.lessons.map((lesson, lessonIdx) => {
            const globalIndex = lessonOffset + lessonIdx;
            const isCompleted = completedLessons.has(globalIndex);

            // A lesson is locked if the previous lesson exists and is not completed,
            // unless it's the first lesson in the course or the first lesson in a module
            // where the previous module is complete.
            const isLocked =
              globalIndex > 0 && !completedLessons.has(globalIndex - 1) && !isCompleted;

            return (
              <LessonRow
                key={lessonIdx}
                lesson={lesson}
                lessonIndex={globalIndex}
                courseId={courseId}
                isCompleted={isCompleted}
                isLocked={isLocked}
              />
            );
          })}
        </div>
      </AccordionContent>
    </AccordionItem>
  );
}
