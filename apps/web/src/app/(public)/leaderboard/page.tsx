'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { leaderboardEntries, courses, getCurrentUser } from '@/lib/mock-data';
import { LeaderboardTable } from '@/components/leaderboard/leaderboard-table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TimeFilter = 'weekly' | 'monthly' | 'allTime';

export default function LeaderboardPage() {
  const t = useTranslations('leaderboard');
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('allTime');
  const [courseFilter, setCourseFilter] = useState('all');
  const currentUser = getCurrentUser();

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('title')}</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex gap-2">
          {(['weekly', 'monthly', 'allTime'] as const).map((tf) => (
            <button
              key={tf}
              onClick={() => setTimeFilter(tf)}
              className={`rounded-full border px-4 py-1.5 text-sm transition-colors ${
                timeFilter === tf ? 'bg-primary text-primary-foreground' : 'hover:bg-accent'
              }`}
            >
              {t(tf)}
            </button>
          ))}
        </div>
        <Select value={courseFilter} onValueChange={setCourseFilter}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder={t('filterByCourse')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCourses')}</SelectItem>
            {courses.filter((c) => c.status === 'published').map((c) => (
              <SelectItem key={c.slug} value={c.slug}>{c.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="mt-6">
        <LeaderboardTable
          entries={leaderboardEntries}
          currentUserId={currentUser.id}
          timeFilter={timeFilter}
        />
      </div>
    </div>
  );
}
