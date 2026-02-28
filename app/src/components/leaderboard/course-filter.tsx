'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface CourseOption {
  courseId: string;
  title: string;
}

interface CourseFilterProps {
  courses: CourseOption[];
  activeCourse: string;
  onChange: (courseId: string) => void;
  className?: string;
}

export function CourseFilter({
  courses,
  activeCourse,
  onChange,
  className,
}: CourseFilterProps) {
  const t = useTranslations('leaderboard');

  return (
    <Select value={activeCourse} onValueChange={onChange}>
      <SelectTrigger
        size="sm"
        className={cn('w-[180px]', className)}
        aria-label={t('filter_by_course')}
      >
        <SelectValue placeholder={t('all_courses')} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">{t('all_courses')}</SelectItem>
        {courses.map((course) => (
          <SelectItem key={course.courseId} value={course.courseId}>
            {course.title}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
