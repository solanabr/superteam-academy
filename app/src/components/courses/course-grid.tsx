'use client';

import { useTranslations } from 'next-intl';
import { SearchX } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseCard } from '@/components/courses/course-card';
import { cn } from '@/lib/utils';
import type { CourseWithMeta } from '@/lib/stores/course-store';
import type { EnrollmentData } from '@/lib/stores/user-store';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface CourseGridProps {
  courses: CourseWithMeta[];
  enrollments: Map<string, EnrollmentData>;
  isLoading: boolean;
  className?: string;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CourseGrid({
  courses,
  enrollments,
  isLoading,
  className,
}: CourseGridProps) {
  const t = useTranslations('courses');

  if (isLoading) {
    return <SkeletonGrid className={className} />;
  }

  if (courses.length === 0) {
    return <EmptyState title={t('empty_title')} description={t('empty_description')} />;
  }

  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {courses.map((course) => {
        const enrollment = enrollments.get(course.courseId);
        return (
          <CourseCard
            key={course.courseId}
            course={course}
            enrollment={
              enrollment
                ? {
                    progressPercent: enrollment.progressPercent,
                    isFinalized: enrollment.isFinalized,
                  }
                : undefined
            }
          />
        );
      })}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Skeleton loading state
// ---------------------------------------------------------------------------

function SkeletonGrid({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        'grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3',
        className,
      )}
    >
      {Array.from({ length: 6 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-card flex flex-col overflow-hidden rounded-xl border shadow-sm">
      {/* Image placeholder */}
      <Skeleton className="h-40 rounded-none" />
      {/* Content */}
      <div className="flex flex-col gap-3 p-4">
        <Skeleton className="h-5 w-3/4" />
        <div className="flex flex-col gap-1.5">
          <Skeleton className="h-3.5 w-full" />
          <Skeleton className="h-3.5 w-5/6" />
          <Skeleton className="h-3.5 w-2/3" />
        </div>
        {/* Stats row */}
        <div className="flex items-center gap-4 pt-1">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-14" />
          <Skeleton className="h-3 w-12" />
        </div>
        {/* Button */}
        <Skeleton className="mt-1 h-8 w-full" />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center">
      <div className="bg-muted flex size-16 items-center justify-center rounded-full">
        <SearchX className="text-muted-foreground size-7" />
      </div>
      <div className="flex flex-col gap-1.5">
        <h3 className="text-lg font-semibold">{title}</h3>
        <p className="text-muted-foreground max-w-sm text-sm">{description}</p>
      </div>
    </div>
  );
}
