'use client';

import { useMemo } from 'react';
import { BookOpen, ExternalLink, CheckCircle2, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { DifficultyBadge } from '@/components/courses/difficulty-badge';
import type { EnrollmentData } from '@/lib/stores/user-store';
import type { CourseWithMeta } from '@/lib/stores/course-store';
import type { Credential } from '@/lib/solana/credentials';

interface CompletedCoursesListProps {
  enrollments: Map<string, EnrollmentData>;
  courses: CourseWithMeta[];
  credentials?: Credential[];
  isLoading?: boolean;
  className?: string;
}

interface CompletedCourseCardProps {
  course: CourseWithMeta;
  enrollment: EnrollmentData;
  credential?: Credential;
}

function CompletedCourseCard({ course, enrollment, credential }: CompletedCourseCardProps) {
  const explorerUrl = credential
    ? `https://explorer.solana.com/address/${credential.assetId}?cluster=devnet`
    : null;

  return (
    <div className="group flex flex-col gap-3 rounded-lg border bg-card p-4 transition-shadow hover:shadow-md sm:flex-row sm:items-center">
      {/* Course image placeholder */}
      <div className="flex size-14 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20">
        <BookOpen className="size-6 text-violet-600 dark:text-violet-400" />
      </div>

      {/* Course info */}
      <div className="flex-1 min-w-0 space-y-1">
        <Link
          href={`/courses/${course.slug}`}
          className="text-sm font-semibold transition-colors hover:text-primary line-clamp-1"
        >
          {course.title}
        </Link>
        <div className="flex flex-wrap items-center gap-2">
          <DifficultyBadge difficulty={course.difficulty} />
          <Badge variant="secondary" className="text-[10px] gap-1">
            <CheckCircle2 className="size-2.5" />
            {enrollment.completedLessons}/{enrollment.totalLessons} lessons
          </Badge>
          <Badge variant="secondary" className="text-[10px]">
            {course.totalXp.toLocaleString()} XP
          </Badge>
        </div>
      </div>

      {/* Credential link */}
      <div className="shrink-0 flex items-center gap-2">
        {credential ? (
          <a
            href={explorerUrl!}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-md border border-violet-500/30 bg-violet-500/10 px-3 py-1.5 text-xs font-medium text-violet-700 dark:text-violet-400 transition-colors hover:bg-violet-500/20"
          >
            <Award className="size-3.5" />
            Credential
            <ExternalLink className="size-3" />
          </a>
        ) : (
          <Badge variant="outline" className="text-[10px] text-muted-foreground">
            No credential
          </Badge>
        )}
      </div>
    </div>
  );
}

function CourseSkeleton() {
  return (
    <div className="flex flex-col gap-3 rounded-lg border p-4 sm:flex-row sm:items-center">
      <Skeleton className="size-14 rounded-lg" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-4 w-48" />
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16" />
          <Skeleton className="h-5 w-24" />
        </div>
      </div>
      <Skeleton className="h-8 w-24" />
    </div>
  );
}

export function CompletedCoursesList({
  enrollments,
  courses,
  credentials = [],
  isLoading = false,
  className,
}: CompletedCoursesListProps) {
  // Build a lookup of courseId -> credential for quick matching
  const credentialMap = useMemo(() => {
    const map = new Map<string, Credential>();
    for (const cred of credentials) {
      // Match credential to course via name or attributes
      // Credentials don't have a direct courseId field, but course name is in the name
      const matchedCourse = courses.find(
        (c) => cred.name.toLowerCase().includes(c.title.toLowerCase()),
      );
      if (matchedCourse) {
        map.set(matchedCourse.courseId, cred);
      }
    }
    return map;
  }, [credentials, courses]);

  // Filter to completed courses only
  const completedItems = useMemo(() => {
    const items: { course: CourseWithMeta; enrollment: EnrollmentData }[] = [];

    for (const [courseId, enrollment] of enrollments) {
      if (!enrollment.isFinalized) continue;
      const course = courses.find((c) => c.courseId === courseId);
      if (course) {
        items.push({ course, enrollment });
      }
    }

    return items;
  }, [enrollments, courses]);

  if (isLoading) {
    return (
      <div className={cn('space-y-3', className)}>
        <CourseSkeleton />
        <CourseSkeleton />
        <CourseSkeleton />
      </div>
    );
  }

  if (completedItems.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-center', className)}>
        <BookOpen className="size-10 text-muted-foreground" />
        <div>
          <p className="text-sm font-medium">No completed courses yet</p>
          <p className="text-xs text-muted-foreground">
            Complete your first course to see it here
          </p>
        </div>
        <Button size="sm" asChild>
          <Link href="/courses">Browse Courses</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      {completedItems.map(({ course, enrollment }) => (
        <CompletedCourseCard
          key={course.courseId}
          course={course}
          enrollment={enrollment}
          credential={credentialMap.get(course.courseId)}
        />
      ))}
    </div>
  );
}
