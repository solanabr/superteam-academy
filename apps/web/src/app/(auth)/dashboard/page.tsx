'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';
import { XPLevelDisplay } from '@/components/dashboard/xp-level-display';
import { StreakCalendar } from '@/components/dashboard/streak-calendar';
import { ActivityFeed } from '@/components/dashboard/activity-feed';
import { BadgeGrid } from '@/components/profile/badge-grid';
import { getCurrentUser, courses, streakData, activityFeed } from '@/lib/mock-data';

export default function DashboardPage() {
  const t = useTranslations('dashboard');
  const user = getCurrentUser();

  const enrolledCourses = courses.filter((c) => user.enrolledCourseIds.includes(c.slug));
  const recommendedCourses = courses.filter(
    (c) => !user.enrolledCourseIds.includes(c.slug) && c.status === 'published'
  );
  const userActivity = activityFeed.filter((a) => a.userId === user.id);

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>
      <p className="mt-1 text-muted-foreground">{t('welcome')}, {user.displayName}!</p>

      {/* XP & Level */}
      <div className="mt-6">
        <XPLevelDisplay totalXP={user.totalXP} level={user.level} />
      </div>

      {/* Current Courses */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">{t('currentCourses')}</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {enrolledCourses.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
            >
              <h3 className="font-semibold group-hover:text-primary">{course.title}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{course.description.slice(0, 80)}...</p>
              <div className="mt-3">
                <div className="mb-1 flex items-center justify-between text-xs text-muted-foreground">
                  <span>{course.progress}% {t('complete')}</span>
                  <span>{course.xp} XP</span>
                </div>
                <Progress value={course.progress} className="h-1.5" />
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* Streak Calendar */}
      <div className="mt-8">
        <StreakCalendar
          data={streakData}
          currentStreak={user.currentStreak}
          streakFreezeAvailable={user.streakFreezeAvailable}
        />
      </div>

      {/* Badges & Activity side by side */}
      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <BadgeGrid earnedBadgeIds={user.earnedBadgeIds} />
        <ActivityFeed items={userActivity} />
      </div>

      {/* Recommended Courses */}
      {recommendedCourses.length > 0 && (
        <div className="mt-8">
          <h2 className="mb-4 text-xl font-semibold">{t('recommendations')}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommendedCourses.slice(0, 3).map((course) => (
              <Link
                key={course.slug}
                href={`/courses/${course.slug}`}
                className="group rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
              >
                <h3 className="font-semibold group-hover:text-primary">{course.title}</h3>
                <p className="mt-1 text-xs text-muted-foreground">{course.description.slice(0, 80)}...</p>
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{course.lessonCount} {t('lessonsLabel')}</span>
                  <span>•</span>
                  <span>{course.xp} XP</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
