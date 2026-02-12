'use client';

import { useTranslations } from 'next-intl';
import { useParams } from 'next/navigation';
import { courses, studentEnrollments } from '@/lib/mock-data';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

export default function CourseStudentsPage() {
  const t = useTranslations('teach');
  const params = useParams();
  const courseId = params.id as string;
  const course = courses.find((c) => c.slug === courseId);
  const enrollments = studentEnrollments[courseId] ?? [];

  if (!course) {
    return (
      <div className="container py-16 text-center">
        <h1 className="text-2xl font-bold">{t('courseNotFound')}</h1>
      </div>
    );
  }

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('students')}</h1>
          <p className="mt-1 text-muted-foreground">{course.title}</p>
        </div>
        <Button variant="outline">{t('export')}</Button>
      </div>

      <div className="mt-6 rounded-xl border">
        <div className="grid grid-cols-[1fr_100px_80px_80px_80px_100px] gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>{t('studentName')}</span>
          <span>{t('enrollDate')}</span>
          <span className="text-right">{t('progressLabel')}</span>
          <span className="text-right">{t('lessonsLabel')}</span>
          <span className="text-right">{t('quizAvg')}</span>
          <span className="text-right">{t('lastActiveLabel')}</span>
        </div>
        {enrollments.map((student) => (
          <div key={student.userId} className="grid grid-cols-[1fr_100px_80px_80px_80px_100px] gap-2 border-b px-4 py-3 text-sm last:border-b-0">
            <div className="min-w-0">
              <p className="truncate font-medium">{student.displayName}</p>
            </div>
            <span className="text-xs text-muted-foreground">
              {new Date(student.enrollmentDate).toLocaleDateString()}
            </span>
            <div className="text-right">
              <span className="text-xs">{student.progressPercent}%</span>
              <Progress value={student.progressPercent} className="mt-1 h-1" />
            </div>
            <span className="text-right">{student.lessonsCompleted}</span>
            <span className="text-right">{student.quizAvgScore}%</span>
            <span className="text-right text-xs text-muted-foreground">
              {new Date(student.lastActive).toLocaleDateString()}
            </span>
          </div>
        ))}
        {enrollments.length === 0 && (
          <div className="p-6 text-center text-sm text-muted-foreground">{t('noStudents')}</div>
        )}
      </div>
    </div>
  );
}
