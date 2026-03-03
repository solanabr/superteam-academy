/**
 * Course header component — title, track badge, difficulty, stats.
 * Themed with Tailwind CSS variables for light/dark mode support.
 */
'use client';

import { useTranslations } from 'next-intl';
import { BookOpen, Sparkles, Gift, Users } from 'lucide-react';
import type { CourseWithDetails, Difficulty } from '@/context/types/course';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/context/types/course';
import { getTrackName, getTrackColor } from '@/context/course/tracks';
import { calculateCourseTotalXp, calculateCompletionBonus } from '@/context/xp-calculations';

interface CourseHeaderProps {
    course: CourseWithDetails;
}

export function CourseHeader({ course }: CourseHeaderProps) {
    const t = useTranslations('courses');
    const tc = useTranslations('common');
    const trackName = getTrackName(course.trackId);
    const trackColor = getTrackColor(course.trackId);
    const diffLabel = DIFFICULTY_LABELS[course.difficulty as Difficulty] ?? tc('unknown');
    const diffColorClass = DIFFICULTY_COLORS[course.difficulty as Difficulty] ?? '';
    const totalXp = calculateCourseTotalXp(course.xpPerLesson, course.lessonCount);
    const bonusXp = calculateCompletionBonus(course.xpPerLesson, course.lessonCount);

    return (
        <div className="relative rounded-2xl overflow-hidden bg-card/50 border border-border">
            {/* Accent gradient overlay */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background: `linear-gradient(135deg, ${trackColor}22 0%, transparent 60%)`,
                }}
            />

            <div className="relative p-6 sm:p-8">
                {/* Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                    <span
                        className="text-[0.72rem] font-semibold uppercase tracking-wider px-3 py-1 rounded-full border bg-card/50"
                        style={{ color: trackColor, borderColor: `${trackColor}44` }}
                    >
                        {trackName}
                    </span>
                    <span className={`text-[0.72rem] font-semibold px-3 py-1 rounded-full border ${diffColorClass}`}>
                        {diffLabel}
                    </span>
                    <span className="text-[0.68rem] text-muted-foreground bg-muted/60 px-2.5 py-1 rounded-full font-medium">
                        {t('level', { level: course.trackLevel })}
                    </span>
                </div>

                {/* Title */}
                <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground leading-tight mb-3 font-display">
                    {course.title}
                </h1>

                {/* Description */}
                <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 max-w-[640px] font-supreme">
                    {course.description}
                </p>

                {/* Meta stats */}
                <div className="flex flex-wrap gap-4 sm:gap-5">
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-supreme">
                        <BookOpen className="w-4 h-4" aria-hidden="true" />
                        <span>{t('lessons', { count: course.lessonCount })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-supreme">
                        <Sparkles className="w-4 h-4" aria-hidden="true" />
                        <span>{t('xpTotal', { total: totalXp.toLocaleString() })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-supreme">
                        <Gift className="w-4 h-4" aria-hidden="true" />
                        <span>{t('xpBonus', { bonus: bonusXp.toLocaleString() })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground font-supreme">
                        <Users className="w-4 h-4" aria-hidden="true" />
                        <span>{t('enrolled', { count: course.totalEnrollments })}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
