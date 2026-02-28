'use client';

import { BookOpen, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import type { EnrollmentData } from '@/lib/stores/user-store';
import type { CourseWithMeta } from '@/lib/stores/course-store';

interface ContinueLearningProps {
  enrollments: Map<string, EnrollmentData>;
  courses: CourseWithMeta[];
  isLoading: boolean;
  className?: string;
}

const DIFFICULTY_LABELS: Record<number, string> = {
  0: 'Beginner',
  1: 'Intermediate',
  2: 'Advanced',
};

const DIFFICULTY_VARIANTS: Record<number, 'default' | 'secondary' | 'destructive'> = {
  0: 'secondary',
  1: 'default',
  2: 'destructive',
};

function CourseCardSkeleton() {
  return (
    <div className="flex items-center gap-4 rounded-lg border p-3">
      <Skeleton className="size-10 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-2 w-full" />
      </div>
      <Skeleton className="h-8 w-20" />
    </div>
  );
}

export function ContinueLearning({
  enrollments,
  courses,
  isLoading,
  className,
}: ContinueLearningProps) {
  const t = useTranslations('dashboard');
  const tCourses = useTranslations('courses');

  // Get in-progress enrollments (not finalized), sorted by progress descending
  const inProgress = Array.from(enrollments.entries())
    .filter(([, enrollment]) => !enrollment.isFinalized)
    .sort((a, b) => b[1].progressPercent - a[1].progressPercent);

  if (isLoading) {
    return (
      <Card className={cn('py-0', className)}>
        <CardHeader className="pb-2 pt-4 px-4">
          <CardTitle className="text-sm">{t('continue_learning')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-4 pb-4">
          <CourseCardSkeleton />
          <CourseCardSkeleton />
          <CourseCardSkeleton />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm">{t('continue_learning')}</CardTitle>
          <Button variant="ghost" size="xs" asChild>
            <Link href="/courses">
              {tCourses('catalog_title')}
              <ArrowRight className="size-3" />
            </Link>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 px-4 pb-4">
        {inProgress.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-8 text-center">
            <BookOpen className="size-8 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium">No courses in progress</p>
              <p className="text-xs text-muted-foreground">
                Enroll in a course to start learning
              </p>
            </div>
            <Button size="sm" asChild>
              <Link href="/courses">{tCourses('catalog_title')}</Link>
            </Button>
          </div>
        ) : (
          inProgress.map(([courseId, enrollment]) => {
            const course = courses.find((c) => c.courseId === courseId);
            const title = course?.title ?? courseId;
            const difficulty = course?.difficulty ?? 0;

            return (
              <div
                key={courseId}
                className="group flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50"
              >
                <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <BookOpen className="size-5" />
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-medium">{title}</p>
                    <Badge
                      variant={DIFFICULTY_VARIANTS[difficulty]}
                      className="text-[10px] shrink-0"
                    >
                      {DIFFICULTY_LABELS[difficulty]}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Progress
                      value={enrollment.progressPercent}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-[11px] tabular-nums text-muted-foreground shrink-0">
                      {Math.round(enrollment.progressPercent)}%
                    </span>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="sm"
                  className="shrink-0 opacity-0 transition-opacity group-hover:opacity-100"
                  asChild
                >
                  <Link href={`/courses/${courseId}`}>
                    {tCourses('continue')}
                  </Link>
                </Button>
              </div>
            );
          })
        )}
      </CardContent>
    </Card>
  );
}
