'use client';

import { useTranslations } from 'next-intl';
import { AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useCourse } from '@/lib/hooks/use-course';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface PrerequisiteCardProps {
  prerequisiteCourseId: string | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function PrerequisiteCard({ prerequisiteCourseId }: PrerequisiteCardProps) {
  if (!prerequisiteCourseId) return null;

  return <PrerequisiteContent courseId={prerequisiteCourseId} />;
}

// ---------------------------------------------------------------------------
// Internal: actual prerequisite content (only rendered when ID exists)
// ---------------------------------------------------------------------------

function PrerequisiteContent({ courseId }: { courseId: string }) {
  const t = useTranslations('courses');
  const { course, enrollment, isEnrolled, isLoading } = useCourse(courseId);

  const isCompleted = enrollment?.isFinalized ?? false;
  const progressPercent = enrollment?.progressPercent ?? 0;

  if (isLoading) {
    return (
      <Card className="border-amber-500/30 bg-amber-500/5 py-4">
        <CardContent className="flex items-center gap-4 px-4">
          <Skeleton className="size-10 rounded-lg" />
          <div className="flex flex-1 flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-48" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!course) return null;

  return (
    <Card
      className={cn(
        'py-4 transition-colors',
        isCompleted
          ? 'border-emerald-500/30 bg-emerald-500/5'
          : 'border-amber-500/30 bg-amber-500/5',
      )}
    >
      <CardContent className="flex flex-col gap-3 px-4">
        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider">
          {isCompleted ? (
            <>
              <CheckCircle2 className="size-3.5 text-emerald-500" />
              <span className="text-emerald-700 dark:text-emerald-400">
                {t('prerequisite_met')}
              </span>
            </>
          ) : (
            <>
              <AlertTriangle className="size-3.5 text-amber-500" />
              <span className="text-amber-700 dark:text-amber-400">
                {t('prerequisite_required')}
              </span>
            </>
          )}
        </div>

        {/* Course info */}
        <div className="flex items-center gap-3">
          <div className="flex flex-1 flex-col gap-1">
            <span className="text-sm font-medium">{course.title}</span>
            {isEnrolled && !isCompleted && (
              <div className="flex items-center gap-2">
                <Progress value={progressPercent} className="h-1 flex-1" />
                <span className="text-muted-foreground text-xs tabular-nums">
                  {Math.round(progressPercent)}%
                </span>
              </div>
            )}
          </div>

          {!isCompleted && (
            <Button variant="outline" size="sm" asChild className="shrink-0 gap-1.5">
              <Link href={`/courses/${course.slug}`}>
                {isEnrolled ? t('continue') : t('start')}
                <ArrowRight className="size-3.5" />
              </Link>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
