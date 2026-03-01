'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { CourseCard } from './course-card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import type { Course, LessonProgress } from '@/types';

interface Props {
  courses: Course[];
  progressMap?: Record<string, LessonProgress>;
  enrolledCourseIds?: Set<string>;
}

export function CourseGrid({ courses, progressMap = {}, enrolledCourseIds = new Set() }: Props) {
  const t = useTranslations('courses');

  const filters = [
    { value: 'all', label: t('filterAll') },
    { value: '1', label: t('filterBeginner') },
    { value: '2', label: t('filterIntermediate') },
    { value: '3', label: t('filterAdvanced') },
  ];

  return (
    <Tabs defaultValue="all">
      <TabsList className="mb-6">
        {filters.map((f) => (
          <TabsTrigger key={f.value} value={f.value}>
            {f.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {filters.map((f) => {
        const filtered =
          f.value === 'all'
            ? courses
            : courses.filter((c) => c.difficulty === parseInt(f.value, 10));

        return (
          <TabsContent key={f.value} value={f.value}>
            {filtered.length === 0 ? (
              <p className="text-center text-muted-foreground py-12">
                No courses found for this difficulty level.
              </p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map((course) => (
                  <CourseCard
                    key={course.courseId}
                    course={course}
                    progress={progressMap[course.courseId]}
                    isEnrolled={enrolledCourseIds.has(course.courseId)}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        );
      })}
    </Tabs>
  );
}
