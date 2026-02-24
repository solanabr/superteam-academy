'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  CheckCircle2,
  Circle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface LessonSidebarProps {
  courseId: string;
  courseTitle?: string;
  lessonCount: number;
  currentIndex: number;
  completedLessons: number;
  className?: string;
}

// ---------------------------------------------------------------------------
// Mock lesson titles (to be replaced by CMS data)
// ---------------------------------------------------------------------------

function getMockLessonTitle(index: number): string {
  const titles = [
    'Introduction to Solana',
    'Setting Up Your Environment',
    'Accounts and Programs',
    'Writing Your First Program',
    'Token Programs & SPL',
    'PDAs and CPIs',
    'Anchor Framework Basics',
    'Testing with Bankrun',
    'Client-Side Integration',
    'Deploying to Devnet',
  ];
  return titles[index % titles.length] ?? `Lesson ${index + 1}`;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonSidebar({
  courseId,
  courseTitle = 'Course',
  lessonCount,
  currentIndex,
  completedLessons,
  className,
}: LessonSidebarProps) {
  const t = useTranslations('lesson');
  const tc = useTranslations('courses');
  const [collapsed, setCollapsed] = useState(false);

  const progressPercent = lessonCount > 0
    ? Math.round((completedLessons / lessonCount) * 100)
    : 0;

  if (collapsed) {
    return (
      <div
        className={cn(
          'flex flex-col items-center border-r bg-card py-4',
          className,
        )}
      >
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setCollapsed(false)}
          aria-label="Expand sidebar"
          className="mb-4"
        >
          <ChevronRight className="size-4" />
        </Button>

        {/* Collapsed lesson indicators */}
        <div className="flex flex-col items-center gap-1.5 px-2">
          {Array.from({ length: lessonCount }, (_, i) => {
            const isCompleted = i < completedLessons;
            const isCurrent = i === currentIndex;

            return (
              <Link
                key={i}
                href={`/courses/${courseId}/lessons/${i}`}
                className="group"
              >
                <div
                  className={cn(
                    'flex size-7 items-center justify-center rounded-full text-xs font-medium transition-all',
                    isCurrent
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : isCompleted
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                        : 'bg-muted text-muted-foreground group-hover:bg-accent',
                  )}
                >
                  {isCompleted ? (
                    <CheckCircle2 className="size-3.5" />
                  ) : (
                    i + 1
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex w-72 flex-col border-r bg-card',
        className,
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b p-4">
        <div className="flex items-center gap-2 overflow-hidden">
          <BookOpen className="size-4 shrink-0 text-primary" />
          <Link
            href={`/courses/${courseId}`}
            className="truncate text-sm font-semibold hover:text-primary transition-colors"
          >
            {courseTitle}
          </Link>
        </div>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={() => setCollapsed(true)}
          aria-label="Collapse sidebar"
        >
          <ChevronLeft className="size-3.5" />
        </Button>
      </div>

      {/* Lesson list */}
      <ScrollArea className="flex-1">
        <nav className="flex flex-col py-2" aria-label="Lesson navigation">
          {Array.from({ length: lessonCount }, (_, i) => {
            const isCompleted = i < completedLessons;
            const isCurrent = i === currentIndex;
            const title = getMockLessonTitle(i);

            return (
              <Link
                key={i}
                href={`/courses/${courseId}/lessons/${i}`}
                className={cn(
                  'group flex items-center gap-3 px-4 py-2.5 text-sm transition-colors',
                  isCurrent
                    ? 'border-r-2 border-primary bg-primary/5 font-medium text-primary dark:bg-primary/10'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                )}
                aria-current={isCurrent ? 'page' : undefined}
              >
                {/* Status indicator */}
                <div className="shrink-0">
                  {isCompleted ? (
                    <CheckCircle2 className="size-4 text-emerald-500" />
                  ) : isCurrent ? (
                    <div className="flex size-4 items-center justify-center rounded-full border-2 border-primary">
                      <div className="size-1.5 rounded-full bg-primary" />
                    </div>
                  ) : (
                    <Circle className="size-4 text-muted-foreground/50" />
                  )}
                </div>

                {/* Lesson info */}
                <div className="flex flex-1 flex-col overflow-hidden">
                  <span className="truncate text-xs text-muted-foreground">
                    {t('lesson_of', { current: i + 1, total: lessonCount })}
                  </span>
                  <span className="truncate">{title}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </ScrollArea>

      {/* Progress footer */}
      <div className="border-t p-4">
        <div className="mb-2 flex items-center justify-between text-xs">
          <span className="font-medium text-muted-foreground">
            {t('course_progress')}
          </span>
          <span className="font-semibold tabular-nums">
            {tc('progress', { percent: progressPercent })}
          </span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
    </div>
  );
}
