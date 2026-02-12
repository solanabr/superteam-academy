'use client';

import { useTranslations } from 'next-intl';
import { StatsCard } from '@/components/admin/stats-card';
import { SimpleBarChart } from '@/components/admin/simple-chart';
import { userProfiles, courses, weeklyNewUsers, weeklyEnrollments, activityFeed } from '@/lib/mock-data';

export default function AdminDashboardPage() {
  const t = useTranslations('admin');

  const totalUsers = userProfiles.length;
  const totalCourses = courses.length;
  const totalEnrollments = courses.reduce((sum, c) => sum + c.studentCount, 0);
  const totalXP = userProfiles.reduce((sum, u) => sum + u.totalXP, 0);
  const activeUsers = userProfiles.filter((u) => {
    const lastActive = new Date(u.lastActive);
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    return lastActive > weekAgo;
  }).length;

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <StatsCard label={t('totalUsers')} value={totalUsers} icon="👥" />
        <StatsCard label={t('totalCourses')} value={totalCourses} icon="📚" />
        <StatsCard label={t('totalEnrollments')} value={totalEnrollments} icon="📝" />
        <StatsCard label={t('totalXP')} value={totalXP} icon="✨" />
        <StatsCard label={t('activeUsers')} value={activeUsers} icon="🟢" />
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <SimpleBarChart
          title={t('newUsersPerWeek')}
          data={weeklyNewUsers.map((w) => ({ label: w.week, value: w.count }))}
          color="hsl(142, 76%, 36%)"
        />
        <SimpleBarChart
          title={t('enrollmentsPerWeek')}
          data={weeklyEnrollments.map((w) => ({ label: w.week, value: w.count }))}
          color="hsl(217, 91%, 60%)"
        />
      </div>

      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">{t('recentActivity')}</h2>
        <div className="rounded-xl border bg-card p-4">
          <div className="space-y-3">
            {activityFeed.slice(0, 8).map((item) => (
              <div key={item.id} className="flex items-center gap-3 text-sm">
                <span className="text-xs text-muted-foreground">
                  {new Date(item.timestamp).toLocaleDateString()}
                </span>
                <span className="font-medium">@{item.username}</span>
                <span className="text-muted-foreground">{item.description}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
