'use client';

import Link from 'next/link';
import { useI18n } from '@/i18n';
import { DIFFICULTY_LABELS, TRACK_LABELS } from '@/config/constants';
import type { CourseWithKey } from '@/types';

interface Props {
  course: CourseWithKey;
}

export default function CourseCard({ course }: Props) {
  const { t } = useI18n();
  const c = course.account;
  const totalXp = c.xpPerLesson * c.lessonCount + Math.floor((c.xpPerLesson * c.lessonCount) / 2);

  return (
    <Link href={`/courses/${c.courseId}`}>
      <div className="card-hover group cursor-pointer">
        {/* Track badge */}
        <div className="mb-4 flex items-center justify-between">
          <span className="rounded-full bg-brand-600/10 px-3 py-1 text-xs font-medium text-brand-400">
            {TRACK_LABELS[c.trackId] || `Track ${c.trackId}`}
          </span>
          <span
            className={`rounded-full px-3 py-1 text-xs font-medium ${
              c.difficulty === 1
                ? 'bg-green-500/10 text-green-400'
                : c.difficulty === 2
                ? 'bg-yellow-500/10 text-yellow-400'
                : 'bg-red-500/10 text-red-400'
            }`}
          >
            {t(`courses.difficulty.${c.difficulty}`)}
          </span>
        </div>

        {/* Title */}
        <h3 className="mb-2 text-lg font-semibold text-surface-50 group-hover:text-brand-400 transition-colors">
          {c.courseId.replace(/-/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
        </h3>

        {/* Stats */}
        <div className="mb-4 flex flex-wrap gap-3 text-sm text-surface-200">
          <span>{c.lessonCount} {t('courses.lessons')}</span>
          <span>·</span>
          <span>{c.xpPerLesson} {t('courses.xpPerLesson')}</span>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-surface-800 pt-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-accent-400">{totalXp} XP</span>
          </div>
          <div className="flex items-center gap-3 text-xs text-surface-200">
            <span>{c.totalEnrollments} {t('courses.enrolled')}</span>
            <span>{c.totalCompletions} {t('courses.completions')}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
