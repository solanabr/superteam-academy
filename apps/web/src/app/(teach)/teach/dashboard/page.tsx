'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { StatsCard } from '@/components/admin/stats-card';
import { courses, studentEnrollments, activityFeed } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

export default function TeachDashboardPage() {
  const t = useTranslations('teach');

  // Mock: professor courses (Ana Santos)
  const myCourses = courses.filter((c) => c.instructor.name === 'Ana Santos');
  const totalStudents = myCourses.reduce((sum, c) => sum + c.studentCount, 0);
  const totalLessons = myCourses.reduce((sum, c) => sum + c.lessonCount, 0);
  const avgRating = myCourses.length > 0
    ? (myCourses.reduce((sum, c) => sum + c.rating, 0) / myCourses.length).toFixed(1)
    : '0';

  // Recent student activity across professor's courses
  const recentActivity = activityFeed.slice(0, 5);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard label={t('myCourses')} value={myCourses.length} icon="📚" />
        <StatsCard label={t('activeStudents')} value={totalStudents} icon="👥" trend="+12%" />
        <StatsCard label={t('totalLessons')} value={totalLessons} icon="📖" />
        <StatsCard label={t('avgRating')} value={avgRating} icon="⭐" />
      </div>

      {/* My Courses Grid */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">{t('myCourses')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {myCourses.map((course) => {
            const enrollments = studentEnrollments[course.slug] ?? [];
            const avgCompletion = enrollments.length > 0
              ? Math.round(enrollments.reduce((sum, e) => sum + e.progressPercent, 0) / enrollments.length)
              : 0;

            return (
              <div key={course.slug} className="rounded-xl border bg-card p-4">
                <div className="flex items-start justify-between">
                  <h3 className="font-semibold">{course.title}</h3>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}>
                    {course.status ?? 'draft'}
                  </Badge>
                </div>
                <div className="mt-3 space-y-2 text-sm text-muted-foreground">
                  <div className="flex justify-between">
                    <span>{t('students')}</span>
                    <span>{enrollments.length}</span>
                  </div>
                  <div>
                    <div className="flex justify-between mb-1">
                      <span>{t('completionRate')}</span>
                      <span>{avgCompletion}%</span>
                    </div>
                    <Progress value={avgCompletion} className="h-1.5" />
                  </div>
                </div>
                <div className="mt-3 flex gap-2">
                  <Link
                    href={`/teach/courses/${course.slug}/edit`}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('editCourse')}
                  </Link>
                  <Link
                    href={`/teach/courses/${course.slug}/students`}
                    className="text-xs text-primary hover:underline"
                  >
                    {t('viewStudents')}
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Student Activity */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">{t('recentStudentActivity')}</h2>
        <div className="rounded-xl border bg-card p-4">
          <div className="space-y-3">
            {recentActivity.map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
                <span>{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
