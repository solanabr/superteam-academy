'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { courses } from '@/lib/mock-data';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

export default function AdminCoursesPage() {
  const t = useTranslations('admin');
  const [featuredMap, setFeaturedMap] = useState<Record<string, boolean>>(
    Object.fromEntries(courses.map((c) => [c.slug, c.featured ?? false]))
  );

  function toggleFeatured(slug: string) {
    setFeaturedMap((prev) => ({ ...prev, [slug]: !prev[slug] }));
  }

  const statusColors: Record<string, string> = {
    published: 'bg-emerald-500/20 text-emerald-400',
    draft: 'bg-yellow-500/20 text-yellow-400',
    archived: 'bg-zinc-500/20 text-zinc-400',
    pending: 'bg-blue-500/20 text-blue-400',
  };

  return (
    <div className="container py-8">
      <h1 className="text-3xl font-bold">{t('courses')}</h1>

      <div className="mt-6 rounded-xl border">
        <div className="grid grid-cols-[1fr_120px_80px_80px_80px_80px_100px] gap-2 border-b px-4 py-3 text-xs font-medium text-muted-foreground">
          <span>{t('courseTitle')}</span>
          <span>{t('instructor')}</span>
          <span>{t('status')}</span>
          <span className="text-right">{t('studentsCount')}</span>
          <span className="text-right">{t('rating')}</span>
          <span className="text-center">{t('featured')}</span>
          <span className="text-right">{t('actions')}</span>
        </div>
        {courses.map((course) => (
          <div key={course.slug} className="grid grid-cols-[1fr_120px_80px_80px_80px_80px_100px] gap-2 border-b px-4 py-3 text-sm last:border-b-0">
            <span className="truncate font-medium">{course.title}</span>
            <span className="truncate text-muted-foreground">{course.instructor.name}</span>
            <div>
              <Badge variant="secondary" className={statusColors[course.status ?? 'draft'] ?? ''}>
                {course.status ?? 'draft'}
              </Badge>
            </div>
            <span className="text-right">{course.studentCount}</span>
            <span className="text-right">{course.rating}</span>
            <div className="flex justify-center">
              <Switch
                checked={featuredMap[course.slug] ?? false}
                onCheckedChange={() => toggleFeatured(course.slug)}
              />
            </div>
            <div className="flex justify-end gap-1">
              <Button variant="ghost" size="sm" className="h-7 text-xs">
                {t('approve')}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
