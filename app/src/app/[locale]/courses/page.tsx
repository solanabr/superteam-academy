'use client';

import { useTranslations } from 'next-intl';
import { CourseGrid } from '@/components/courses/course-grid';
import { useCourses } from '@/lib/hooks/use-courses';
import { GraduationCap, Loader2 } from 'lucide-react';

export default function CoursesPage() {
  const t = useTranslations('courses');
  const { courses, loading } = useCourses();

  return (
    <div className="container py-8 md:py-12">
      <div className="space-y-2 mb-8">
        <div className="flex items-center gap-3">
          <GraduationCap className="h-8 w-8 text-solana-purple" />
          <h1 className="text-3xl font-bold">{t('title')}</h1>
        </div>
        <p className="text-muted-foreground">{t('subtitle')}</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-solana-purple" />
        </div>
      ) : (
        <CourseGrid courses={courses} />
      )}
    </div>
  );
}
