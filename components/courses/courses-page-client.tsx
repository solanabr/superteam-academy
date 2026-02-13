'use client';

import { CourseCatalog } from '@/components/courses/course-catalog';
import { useI18n } from '@/components/i18n/i18n-provider';
import { CourseSummary } from '@/lib/types';

export function CoursesPageClient({ courses }: { courses: CourseSummary[] }): JSX.Element {
  const { dictionary } = useI18n();

  return (
    <div data-testid="courses-page" className="space-y-6">
      <header data-testid="courses-header" className="panel relative overflow-hidden">
        <div className="absolute -right-20 -top-20 h-44 w-44 rounded-full bg-primary/10 blur-3xl" />
        <h1 className="text-3xl font-extrabold">{dictionary.courses.catalogTitle}</h1>
        <p className="text-sm text-foreground/75">{dictionary.courses.catalogSubtitle}</p>
      </header>

      {courses.length > 0 ? (
        <CourseCatalog courses={courses} />
      ) : (
        <p data-testid="courses-empty" className="panel-soft text-sm text-foreground/75">{dictionary.courses.catalogEmpty}</p>
      )}
    </div>
  );
}
