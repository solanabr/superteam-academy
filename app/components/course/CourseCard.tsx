/**
 * CourseCard — Glass-effect card with inset colored icon area.
 *
 * Design (matching reference):
 *   Outer: glass-effect container with subtle bg tint (card color at ~19% opacity)
 *          + large rounded corners + elevated shadow
 *   Inner top: solid-color rounded area with centered custom SVG track icon
 *   Inner bottom: glass area with course title, badges, enrollment
 *
 * Fully responsive — 1-col mobile, 2-col tablet, 3-col desktop.
 */
'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/context/i18n/navigation';
import { ArrowRight, BookOpen, Sparkles, Users } from 'lucide-react';
import type { Course, Difficulty } from '@/context/types/course';
import { getTrackColor, getTrackName } from '@/context/course/tracks';
import { CourseDifficultyBadge } from './CourseDifficultyBadge';
import { CourseStatsBadge } from './CourseStatsBadge';
import { getTrackIconComponent } from './CourseTrackIcons';

interface CourseCardProps {
    course: Course;
    index?: number;
    onClick?: () => void;
}

/** Dashboard card colors cycled by index */
const CARD_COLORS = [
    { solid: 'var(--dash-card-peach)', rgb: '255,203,164' },
    { solid: 'var(--dash-card-mint)', rgb: '168,240,204' },
    { solid: 'var(--dash-card-lavender)', rgb: '196,176,240' },
    { solid: 'var(--dash-card-pink)', rgb: '98,201,183' },
    { solid: 'var(--dash-card-mauve)', rgb: '240,168,216' },
] as const;

export function CourseCard({ course, index = 0, onClick }: CourseCardProps) {
    const t = useTranslations('courses');
    const trackName = getTrackName(course.trackId);
    const totalXp = course.xpPerLesson * course.lessonCount;
    const palette = CARD_COLORS[index % CARD_COLORS.length];
    const TrackIcon = getTrackIconComponent(course.trackId);

    return (
        <Link
            href={`/courses/${course.courseId}`}
            className="group relative flex flex-col overflow-hidden rounded-[2rem] border border-zinc-200/80 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/80 shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] hover:shadow-lg transition-shadow duration-300 w-full focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            onClick={onClick}
            id={`course-card-${course.courseId}`}
            aria-label={`${trackName} course: ${course.courseId}`}
        >
            {/* Subtle color tint overlay */}
            <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{ backgroundColor: `rgba(${palette.rgb}, 0.1)` }}
            />

            {/* Glass shimmer overlay */}
            <div
                className="pointer-events-none absolute inset-0 z-0"
                style={{
                    background: `linear-gradient(135deg, rgba(255,255,255,0.25) 0%, transparent 50%, rgba(255,255,255,0.08) 100%)`,
                    maskImage: 'linear-gradient(135deg, black 40%, transparent 60%)',
                    WebkitMaskImage: 'linear-gradient(135deg, black 40%, transparent 60%)',
                }}
            />

            {/* Inner content — above shimmer */}
            <div className="relative z-10 flex flex-col h-full p-3.5 sm:p-4 gap-4 sm:gap-5">

                {/* ── Solid-color icon area ── */}
                <div
                    className="w-full flex flex-col items-center justify-center rounded-[1.75rem] sm:rounded-[2rem] py-8 sm:py-10 relative"
                    style={{ backgroundColor: palette.solid }}
                >
                    {/* Track name + level badges */}
                    <div className="absolute top-3 sm:top-4 left-4 sm:left-5 right-4 sm:right-5 flex items-center justify-between">
                        <span
                            className="text-[10px] sm:text-[11px] font-bold uppercase tracking-wider font-supreme"
                            style={{ color: '#1b231d' }}
                        >
                            {trackName}
                        </span>
                        <span
                            className="text-[9px] sm:text-[10px] font-medium font-supreme px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'rgba(0,0,0,0.1)', color: '#1b231d' }}
                        >
                            {t('level', { level: course.trackLevel })}
                        </span>
                    </div>

                    {/* Custom SVG icon */}
                    <TrackIcon size={48} className="drop-shadow-sm" />
                </div>

                {/* ── Glass content area ── */}
                <div className="flex flex-col gap-2.5 flex-1">
                    {/* Course title — centered like reference */}
                    <h3 className="text-sm sm:text-base font-bold font-supreme text-foreground text-center leading-snug m-0 line-clamp-2">
                        {course.courseId}
                    </h3>

                    {/* Meta badges */}
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                        <CourseDifficultyBadge difficulty={course.difficulty as Difficulty} />
                        <CourseStatsBadge Icon={BookOpen} label={t('lessons', { count: course.lessonCount })} />
                        <CourseStatsBadge Icon={Sparkles} label={t('xp', { xp: totalXp })} variant="xp" />
                    </div>

                    {/* Footer — enrollment + Start button */}
                    <div className="flex items-center justify-between mt-auto pt-3 border-t border-border dark:border-zinc-700">
                        <span className="inline-flex items-center gap-1 text-[11px] sm:text-xs text-muted-foreground font-supreme">
                            <Users className="w-3 h-3" aria-hidden="true" />
                            {t('enrolled', { count: course.totalEnrollments })}
                        </span>

                        <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold font-supreme text-accent-foreground bg-accent px-3 py-1 rounded-full hover:bg-accent/90 transition-colors">
                            Start
                            <ArrowRight className="w-3.5 h-3.5" />
                        </span>
                    </div>
                </div>
            </div>
        </Link>
    );
}
