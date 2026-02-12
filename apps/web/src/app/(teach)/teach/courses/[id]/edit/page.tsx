'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { courses } from '@/lib/mock-data';
import { CourseEditor } from '@/components/teach/course-editor';
import { ModuleManager } from '@/components/teach/module-manager';

export default function CourseEditPage() {
  const t = useTranslations('teach');
  const params = useParams();
  const courseId = params.id as string;
  const course = courses.find((c) => c.slug === courseId);

  if (!course) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">{t('courseNotFound')}</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <h1 className="mb-6 text-3xl font-bold">{t('editCourse')}: {course.title}</h1>
      <CourseEditor course={course} />
      <div className="mt-8">
        <ModuleManager modules={course.modules} />
      </div>
    </div>
  );
}
