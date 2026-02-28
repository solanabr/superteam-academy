'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Clock, BookOpen, Users, Zap, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Course, CourseLevel } from '@/lib/mock-data';

interface CourseCardProps {
  course: Course;
  enrolled?: boolean;
  progress?: number; // 0-100
}

const LEVEL_STYLES: Record<CourseLevel, { badge: string; dot: string }> = {
  beginner: {
    badge: 'bg-green-500/20 text-green-400 border border-green-500/30',
    dot: 'bg-green-400',
  },
  intermediate: {
    badge: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    dot: 'bg-yellow-400',
  },
  advanced: {
    badge: 'bg-red-500/20 text-red-400 border border-red-500/30',
    dot: 'bg-red-400',
  },
};

const LEVEL_LABELS: Record<CourseLevel, string> = {
  beginner: 'Iniciante',
  intermediate: 'Intermediário',
  advanced: 'Avançado',
};

export function CourseCard({ course, enrolled = false, progress = 0 }: CourseCardProps) {
  const t = useTranslations('courses');
  const params = useParams();
  const locale = (params?.locale as string) ?? 'pt-BR';

  const titleKey = locale as keyof typeof course.title;
  const descKey = locale as keyof typeof course.description;
  const title = course.title[titleKey] ?? course.title['pt-BR'];
  const description = course.description[descKey] ?? course.description['pt-BR'];

  const levelStyle = LEVEL_STYLES[course.level];
  const levelLabel = LEVEL_LABELS[course.level];
  const href = `/${locale}/courses/${course.slug}`;

  return (
    <div className={cn(
      'group relative flex flex-col bg-gray-900 rounded-xl border border-gray-800',
      'hover:border-gray-700 transition-all duration-200 overflow-hidden',
      'hover:shadow-lg hover:shadow-purple-900/10 hover:-translate-y-0.5'
    )}>
      {/* Colored header */}
      <div className={cn(
        'relative h-28 bg-gradient-to-br flex items-center justify-center',
        course.thumbnail_color
      )}>
        <span className="text-5xl drop-shadow-lg">{course.thumbnail_icon}</span>
        {/* Track pill */}
        <div className="absolute top-3 left-3">
          <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-black/40 text-white text-xs font-medium backdrop-blur-sm border border-white/10">
            {course.track.toUpperCase()}
          </span>
        </div>
        {/* XP badge */}
        <div className="absolute top-3 right-3">
          <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-black/40 backdrop-blur-sm border border-yellow-500/30">
            <Zap className="w-3 h-3 text-yellow-400" />
            <span className="text-yellow-400 text-xs font-bold">
              {course.xp_reward.toLocaleString()} XP
            </span>
          </div>
        </div>
        {/* Progress bar overlay if enrolled */}
        {enrolled && progress > 0 && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/40">
            <div
              className="h-full bg-white/80 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1 p-4 gap-3">
        {/* Level badge */}
        <div className="flex items-center gap-2">
          <span className={cn('inline-flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full', levelStyle.badge)}>
            <span className={cn('w-1.5 h-1.5 rounded-full', levelStyle.dot)} />
            {levelLabel}
          </span>
          {enrolled && (
            <span className="inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-400 border border-purple-500/30">
              {t('enrolled')}
            </span>
          )}
        </div>

        {/* Title */}
        <h3 className="text-white font-semibold text-base leading-snug line-clamp-2 group-hover:text-purple-300 transition-colors">
          {title}
        </h3>

        {/* Description */}
        <p className="text-gray-400 text-sm leading-relaxed line-clamp-2 flex-1">
          {description}
        </p>

        {/* Stats row */}
        <div className="flex items-center gap-3 text-gray-400 text-xs">
          <div className="flex items-center gap-1">
            <BookOpen className="w-3.5 h-3.5" />
            <span>{course.lesson_count} {t('lessons')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            <span>{course.duration}</span>
          </div>
          <div className="flex items-center gap-1">
            <Users className="w-3.5 h-3.5" />
            <span>{course.enrollments.toLocaleString()}</span>
          </div>
        </div>

        {/* Progress bar if enrolled */}
        {enrolled && (
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-400">{t('progress' as never) ?? 'Progresso'}</span>
              <span className="text-gray-400">{progress}%</span>
            </div>
            <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* CTA button */}
        <Link
          href={href}
          className={cn(
            'flex items-center justify-center gap-2 w-full py-2 px-4 rounded-lg',
            'text-sm font-medium transition-all duration-200',
            enrolled && progress > 0
              ? 'bg-purple-600 hover:bg-purple-500 text-white'
              : enrolled
              ? 'bg-gray-800 hover:bg-gray-700 text-gray-200'
              : 'bg-purple-600/20 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-600/30 hover:border-transparent'
          )}
        >
          {enrolled && progress > 0
            ? t('continue')
            : enrolled
            ? t('view')
            : t('enroll')}
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
    </div>
  );
}
