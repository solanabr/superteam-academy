'use client';

/**
 * Landing Courses Section — showcases 3 featured course tracks.
 */
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Layers, BarChart3 } from 'lucide-react';
import { CourseCard } from '@/components/ui/CourseCard';

const COURSES = [
    {
        i18nKey: 'solanaFundamentals',
        difficultyKey: 'beginner',
        lessons: 12,
        xp: 600,
        track: 'Core',
        image: '/course/solana_course.png',
    },
    {
        i18nKey: 'anchor',
        difficultyKey: 'intermediate',
        lessons: 16,
        xp: 960,
        track: 'Anchor',
        image: '/course/anchor_course.png',
    },
    {
        i18nKey: 'defi',
        difficultyKey: 'advanced',
        lessons: 14,
        xp: 1120,
        track: 'DeFi',
        image: '/course/defi_course.png',
    },
];

const difficultyStyle: Record<string, string> = {
    beginner:
        'bg-brand-green-emerald/15 text-[#006838] dark:bg-brand-green-emerald/25 dark:text-[#6ee7a0]',
    intermediate:
        'bg-brand-yellow/25 text-[#7a5e00] dark:bg-brand-yellow/20 dark:text-brand-yellow',
    advanced:
        'bg-red-500/12 text-[#b91c1c] dark:bg-red-500/20 dark:text-[#fca5a5]',
};

export function LandingCourses() {
    const t = useTranslations('landing');
    return (
        <section
            id="courses"
            aria-label="Courses"
            className="mx-auto max-w-[1100px] px-4 py-16 sm:px-8 sm:py-24"
        >
            {/* Section header */}
            <div className="mb-12 max-w-[640px] sm:mb-16">
                <p className="mb-3 font-supreme text-sm font-semibold tracking-wide text-brand-green-dark dark:text-brand-yellow sm:text-base">
                    {t('courses.tagline')}
                </p>
                <h2 className="mb-6 font-display text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                    {t('courses.title')}
                </h2>
                <p className="font-supreme text-base leading-relaxed text-muted-foreground sm:text-lg">
                    {t('courses.subtitle')}
                </p>
            </div>

            {/* Course grid — sticky stacking on mobile, normal grid on desktop */}
            <div className="flex flex-col gap-5 lg:grid lg:grid-cols-3 lg:gap-6">
                {COURSES.map((course, i) => (
                    <div
                        key={course.i18nKey}
                        className="lg:static"
                        style={{ position: 'sticky', top: `${60 + i * 8}px`, zIndex: i + 1 }}
                    >
                        <CourseCard
                            className="h-full"
                            image={
                                <Image
                                    src={course.image}
                                    alt={t(`courses.${course.i18nKey}.title`)}
                                    width={400}
                                    height={267}
                                    className="h-full w-full object-cover"
                                />
                            }
                        >
                            {/* Difficulty + Track badges */}
                            <div className="mb-3 flex items-center gap-2">
                                <span
                                    className={`inline-block rounded-full px-2.5 py-1 font-supreme text-[11px] font-bold leading-none ${difficultyStyle[course.difficultyKey]}`}
                                >
                                    {t(`courses.difficulty.${course.difficultyKey}`)}
                                </span>
                                <span className="inline-block rounded-full bg-foreground/8 px-2.5 py-1 font-supreme text-[11px] font-bold leading-none text-foreground/70 dark:bg-white/10 dark:text-white/70">
                                    {course.track}
                                </span>
                            </div>

                            {/* Title — Quilon */}
                            <h3 className="mb-2 font-display text-lg font-bold text-foreground sm:text-xl">
                                {t(`courses.${course.i18nKey}.title`)}
                            </h3>

                            {/* Description — Supreme, high contrast */}
                            <p className="mb-4 min-h-[3rem] font-supreme text-sm leading-relaxed text-[#3a4d40] dark:text-[#d4e0d7]">
                                {t(`courses.${course.i18nKey}.description`)}
                            </p>

                            {/* Meta row */}
                            <div className="mt-auto flex items-center gap-4 border-t border-foreground/10 pt-3 dark:border-white/15">
                                <div className="flex items-center gap-1 text-brand-green-dark dark:text-brand-yellow">
                                    <Layers size={14} strokeWidth={1.5} aria-hidden="true" />
                                    <span className="font-supreme text-[11px] font-medium">
                                        {course.lessons} {t('courses.lessons')}
                                    </span>
                                </div>
                                <div className="flex items-center gap-1 text-brand-green-dark dark:text-brand-yellow">
                                    <BarChart3 size={14} strokeWidth={1.5} aria-hidden="true" />
                                    <span className="font-supreme text-[11px] font-medium">
                                        {course.track}
                                    </span>
                                </div>
                                <div className="ml-auto flex items-center gap-1">
                                    <span className="font-array text-sm font-bold text-brand-green-dark dark:text-brand-yellow">
                                        {course.xp}
                                    </span>
                                    <span className="font-supreme text-[10px] font-medium text-brand-green-dark dark:text-brand-yellow">
                                        XP
                                    </span>
                                </div>
                            </div>
                        </CourseCard>
                    </div>
                ))}
            </div>

            {/* CTA */}
            <div className="mt-10 flex justify-center sm:mt-12">
                <a
                    href="/login"
                    className="cta-primary rounded-xl px-10 py-3.5 font-supreme text-sm"
                >
                    {t('courses.cta')}
                </a>
            </div>
        </section>
    );
}
