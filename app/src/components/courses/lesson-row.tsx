'use client';

import {
  BookOpen,
  Code2,
  HelpCircle,
  CheckCircle2,
  Lock,
  Sparkles,
} from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface LessonData {
  title: string;
  type: 'theory' | 'code' | 'quiz';
  xp: number;
}

interface LessonRowProps {
  lesson: LessonData;
  lessonIndex: number;
  courseId: string;
  isCompleted: boolean;
  isLocked: boolean;
}

// ---------------------------------------------------------------------------
// Lesson type config
// ---------------------------------------------------------------------------

const LESSON_TYPE_CONFIG: Record<
  LessonData['type'],
  {
    icon: React.ComponentType<{ className?: string }>;
    label: string;
    className: string;
  }
> = {
  theory: {
    icon: BookOpen,
    label: 'Theory',
    className: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/25',
  },
  code: {
    icon: Code2,
    label: 'Code',
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  },
  quiz: {
    icon: HelpCircle,
    label: 'Quiz',
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function LessonRow({
  lesson,
  lessonIndex,
  courseId,
  isCompleted,
  isLocked,
}: LessonRowProps) {
  const config = LESSON_TYPE_CONFIG[lesson.type] ?? LESSON_TYPE_CONFIG.theory;
  const TypeIcon = config.icon;

  const content = (
    <div
      className={cn(
        'group/lesson flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors',
        isLocked
          ? 'cursor-not-allowed opacity-50'
          : 'hover:bg-accent/50 cursor-pointer',
        isCompleted && 'bg-emerald-500/5',
      )}
    >
      {/* Lesson number */}
      <div
        className={cn(
          'flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold',
          isCompleted
            ? 'bg-emerald-500 text-white'
            : isLocked
              ? 'bg-muted text-muted-foreground'
              : 'bg-primary/10 text-primary',
        )}
      >
        {isCompleted ? (
          <CheckCircle2 className="size-4" />
        ) : isLocked ? (
          <Lock className="size-3.5" />
        ) : (
          lessonIndex + 1
        )}
      </div>

      {/* Title */}
      <span
        className={cn(
          'flex-1 text-sm font-medium',
          isCompleted && 'text-muted-foreground line-through decoration-emerald-500/40',
          isLocked && 'text-muted-foreground',
        )}
      >
        {lesson.title}
      </span>

      {/* Type badge */}
      <Badge
        variant="outline"
        className={cn('hidden gap-1 text-[10px] sm:flex', config.className)}
      >
        <TypeIcon className="size-3" />
        {config.label}
      </Badge>

      {/* XP reward */}
      <div
        className={cn(
          'flex items-center gap-1 text-xs tabular-nums',
          isCompleted
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-muted-foreground',
        )}
      >
        <Sparkles className="size-3" />
        {lesson.xp}
      </div>
    </div>
  );

  if (isLocked) {
    return content;
  }

  return (
    <Link
      href={`/courses/${courseId}/lessons/${lessonIndex}`}
      className="block"
    >
      {content}
    </Link>
  );
}
