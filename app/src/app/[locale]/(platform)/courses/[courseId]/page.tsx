'use client';

import { useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { ArrowLeft, BookOpen, Clock, Sparkles, Users, Tag } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { CourseHeader } from '@/components/courses/course-header';
import { EnrollButton } from '@/components/courses/enroll-button';
import { CurriculumList } from '@/components/courses/curriculum-list';
import { PrerequisiteCard } from '@/components/courses/prerequisite-card';
import { CredentialPreview } from '@/components/courses/credential-preview';
import { useCourse } from '@/lib/hooks/use-course';
import { useCourseStore } from '@/lib/stores/course-store';

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CourseDetailPage() {
  const t = useTranslations('courses');
  const params = useParams<{ courseId: string }>();
  const courseId = params.courseId;

  const fetchCourses = useCourseStore((s) => s.fetchCourses);
  const coursesLoaded = useCourseStore((s) => s.courses.length > 0);

  // Ensure courses are loaded (user may navigate directly to this page)
  useEffect(() => {
    if (!coursesLoaded) {
      fetchCourses();
    }
  }, [coursesLoaded, fetchCourses]);

  const { course, enrollment, isEnrolled, isLoading } = useCourse(courseId);

  if (isLoading || !coursesLoaded) {
    return <CourseDetailSkeleton />;
  }

  if (!course) {
    return <CourseNotFound />;
  }

  const progressPercent = enrollment?.progressPercent ?? 0;
  const isFinalized = enrollment?.isFinalized ?? false;

  return (
    <div className="flex flex-col gap-6">
      {/* Back navigation */}
      <div>
        <Button variant="ghost" size="sm" asChild className="gap-1.5">
          <Link href="/courses">
            <ArrowLeft className="size-4" />
            {t('catalog_title')}
          </Link>
        </Button>
      </div>

      {/* Course header (hero) */}
      <CourseHeader course={course} />

      {/* Progress bar (only for enrolled, non-finalized courses) */}
      {isEnrolled && !isFinalized && (
        <div className="flex flex-col gap-2 rounded-lg border p-4">
          <div className="flex items-center justify-between text-sm">
            <span className="font-medium">{t('your_progress')}</span>
            <span className="text-muted-foreground tabular-nums">
              {t('progress', { percent: Math.round(progressPercent) })}
            </span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          <p className="text-muted-foreground text-xs">
            {t('lessons_completed', {
              completed: enrollment?.completedLessons ?? 0,
              total: course.lessonCount,
            })}
          </p>
        </div>
      )}

      {/* Main content area: tabs + sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:gap-8">
        {/* Content column */}
        <div className="min-w-0 flex-1">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList variant="line">
              <TabsTrigger value="overview">{t('tab_overview')}</TabsTrigger>
              <TabsTrigger value="curriculum">{t('tab_curriculum')}</TabsTrigger>
            </TabsList>

            {/* Overview tab */}
            <TabsContent value="overview" className="mt-6">
              <div className="flex flex-col gap-6">
                {/* Prerequisite (if any) */}
                <PrerequisiteCard
                  prerequisiteCourseId={course.prerequisiteCourseId}
                />

                {/* About this course */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold">{t('about_course')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {course.description}
                  </p>
                </div>

                {/* What you'll learn */}
                <div className="flex flex-col gap-3">
                  <h3 className="text-lg font-semibold">{t('what_you_learn')}</h3>
                  <div className="grid gap-2 sm:grid-cols-2">
                    {generateLearningOutcomes(course.tags).map(
                      (outcome, idx) => (
                        <div
                          key={idx}
                          className="flex items-start gap-2 rounded-lg border p-3"
                        >
                          <Sparkles className="mt-0.5 size-4 shrink-0 text-primary" />
                          <span className="text-sm">{outcome}</span>
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Tags */}
                {course.tags.length > 0 && (
                  <div className="flex flex-col gap-3">
                    <h3 className="flex items-center gap-2 text-lg font-semibold">
                      <Tag className="size-4" />
                      {t('skills_covered')}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {course.tags.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}

                {/* Credential preview (visible on overview for desktop) */}
                <div className="lg:hidden">
                  <CredentialPreview
                    courseName={course.title}
                    trackId={course.trackId}
                    totalXp={course.totalXp}
                  />
                </div>
              </div>
            </TabsContent>

            {/* Curriculum tab */}
            <TabsContent value="curriculum" className="mt-6">
              <CurriculumList
                courseId={courseId}
                lessonCount={course.lessonCount}
                enrollment={
                  enrollment
                    ? { completedLessons: enrollment.completedLessons }
                    : undefined
                }
              />
            </TabsContent>
          </Tabs>
        </div>

        {/* Sidebar (sticky on desktop) */}
        <aside className="flex w-full shrink-0 flex-col gap-4 lg:sticky lg:top-8 lg:w-72 xl:w-80">
          {/* Enrollment CTA */}
          <Card className="py-4">
            <CardContent className="flex flex-col gap-4 px-4">
              <EnrollButton
                courseId={courseId}
                totalXp={course.totalXp}
                prerequisiteCourseId={course.prerequisiteCourseId}
              />

              <Separator />

              {/* Quick stats */}
              <div className="flex flex-col gap-3">
                <h4 className="text-sm font-semibold">{t('course_includes')}</h4>
                <SidebarStat
                  icon={BookOpen}
                  label={`${course.lessonCount} ${t('lessons')}`}
                />
                <SidebarStat
                  icon={Clock}
                  label={`${course.estimatedHours} ${t('hours')}`}
                />
                <SidebarStat
                  icon={Sparkles}
                  label={`${course.totalXp} ${t('xp')} ${t('total_reward')}`}
                />
                <SidebarStat
                  icon={Users}
                  label={`${course.enrollmentCount} ${t('enrolled')}`}
                />
              </div>
            </CardContent>
          </Card>

          {/* Credential preview (desktop only) */}
          <div className="hidden lg:block">
            <CredentialPreview
              courseName={course.title}
              trackId={course.trackId}
              totalXp={course.totalXp}
            />
          </div>
        </aside>
      </div>

      {/* Mobile sticky CTA */}
      <div className="bg-background/95 fixed inset-x-0 bottom-0 z-40 border-t p-4 backdrop-blur-sm lg:hidden">
        <EnrollButton
          courseId={courseId}
          totalXp={course.totalXp}
          prerequisiteCourseId={course.prerequisiteCourseId}
        />
      </div>

      {/* Spacer for mobile sticky CTA */}
      <div className="h-24 lg:hidden" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function CourseDetailSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      {/* Back button */}
      <Skeleton className="h-8 w-24" />

      {/* Hero */}
      <Skeleton className="h-56 w-full rounded-xl sm:h-64" />

      {/* Content + sidebar */}
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <div className="flex flex-1 flex-col gap-4">
          {/* Tab bar skeleton */}
          <Skeleton className="h-9 w-48" />

          {/* Content blocks */}
          <div className="flex flex-col gap-3">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-3/4" />
          </div>

          <div className="grid gap-2 sm:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-16 rounded-lg" />
            ))}
          </div>
        </div>

        {/* Sidebar skeleton */}
        <div className="flex w-full flex-col gap-4 lg:w-72 xl:w-80">
          <Skeleton className="h-48 rounded-xl" />
          <Skeleton className="h-56 rounded-xl" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Not found state
// ---------------------------------------------------------------------------

function CourseNotFound() {
  const t = useTranslations('courses');
  const tCommon = useTranslations('common');

  return (
    <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
      <BookOpen className="text-muted-foreground size-12" />
      <h2 className="text-xl font-semibold">{t('not_found_title')}</h2>
      <p className="text-muted-foreground max-w-sm text-sm">
        {t('not_found_desc')}
      </p>
      <Button asChild>
        <Link href="/courses">{tCommon('back')}</Link>
      </Button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar stat row
// ---------------------------------------------------------------------------

function SidebarStat({
  icon: Icon,
  label,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
}) {
  return (
    <div className="text-muted-foreground flex items-center gap-2.5 text-sm">
      <Icon className="size-4 shrink-0" />
      <span>{label}</span>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Generate learning outcomes from tags
// ---------------------------------------------------------------------------

function generateLearningOutcomes(tags: string[]): string[] {
  if (tags.length === 0) {
    return [
      'Understand core blockchain concepts',
      'Build real-world applications',
      'Write secure and efficient code',
      'Earn verifiable on-chain credentials',
    ];
  }

  return tags.slice(0, 6).map((tag) => {
    const prefixes = [
      'Understand',
      'Build with',
      'Master',
      'Implement',
      'Design',
      'Deploy',
    ];
    const prefix = prefixes[tags.indexOf(tag) % prefixes.length];
    return `${prefix} ${tag}`;
  });
}
