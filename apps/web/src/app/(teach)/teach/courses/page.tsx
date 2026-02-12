'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { courses } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function TeachCoursesPage() {
  const t = useTranslations('teach');

  // Mock: professor courses (Ana Santos)
  const myCourses = courses.filter((c) => c.instructor.name === 'Ana Santos');

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">{t('myCourses')}</h1>
        <Button>{t('createCourse')}</Button>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {myCourses.map((course) => (
          <div key={course.slug} className="rounded-xl border bg-card p-4">
            <div className="flex items-start justify-between">
              <h3 className="font-semibold">{course.title}</h3>
              <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                {course.status ?? 'draft'}
              </Badge>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {course.studentCount} {t('students')} • {t('lastUpdated')}: {course.updatedAt ? new Date(course.updatedAt).toLocaleDateString() : '-'}
            </p>
            <div className="mt-4 flex gap-2">
              <Link href={`/teach/courses/${course.slug}/edit`}>
                <Button variant="outline" size="sm">{t('editCourse')}</Button>
              </Link>
              <Button variant="ghost" size="sm">
                {course.status === 'published' ? t('unpublish') : t('publishCourse')}
              </Button>
              <Link href={`/teach/courses/${course.slug}/students`}>
                <Button variant="ghost" size="sm">{t('viewStudents')}</Button>
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
