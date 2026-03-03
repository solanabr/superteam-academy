/**
 * ChallengesContent — Main page component for /challenges.
 *
 * Displays a banner image, header, difficulty filter pills,
 * and a responsive grid of ChallengeCard components.
 * Uses the useChallenges() hook to aggregate challenge-type
 * lessons across all active courses.
 */
'use client';

import { useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Swords, Loader2, Code2 } from 'lucide-react';
import { ChallengeCard } from './ChallengeCard';
import { useChallenges } from '@/context/hooks/useChallenges';
import { BANNER } from '@/lib/banner-constants';
import type { Difficulty } from '@/context/types/course';

type DifficultyFilter = 'all' | Difficulty;

const FILTER_OPTIONS: { key: string; value: DifficultyFilter }[] = [
    { key: 'all', value: 'all' },
    { key: 'beginner', value: 1 },
    { key: 'intermediate', value: 2 },
    { key: 'advanced', value: 3 },
];

export function ChallengesContent() {
    const t = useTranslations('challenges');
    const { data: challenges, isLoading } = useChallenges();
    const [activeFilter, setActiveFilter] = useState<DifficultyFilter>('all');

    const filtered =
        activeFilter === 'all'
            ? challenges
            : challenges.filter((c) => c.difficulty === activeFilter);

    return (
        <div className="max-w-7xl mx-auto space-y-5 sm:space-y-8">
            {/* Banner */}
            <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1] rounded-2xl overflow-hidden">
                <Image
                    src={BANNER.challenges.light.src}
                    alt="Challenges"
                    width={1400}
                    height={400}
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL={BANNER.challenges.light.blur}
                    className="absolute inset-0 w-full h-full object-cover object-top dark:hidden"
                    priority
                />
                <Image
                    src={BANNER.challenges.dark.src}
                    alt="Challenges"
                    width={1400}
                    height={400}
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL={BANNER.challenges.dark.blur}
                    className="absolute inset-0 w-full h-full object-cover object-top hidden dark:block"
                    priority
                />
                {/* Gradient overlay — stronger for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-green-emerald/90 flex items-center justify-center">
                            <Swords className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h1 className="font-display text-base sm:text-xl md:text-3xl font-bold text-white drop-shadow-lg">
                            {t('title')}
                        </h1>
                    </div>
                    <p className="font-supreme text-[11px] sm:text-xs md:text-sm text-white/90 max-w-xl drop-shadow-md">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 sm:gap-6 flex-wrap">
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <Code2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                    <span className="text-xs sm:text-sm font-supreme">
                        <span className="font-bold text-foreground">{challenges.length}</span>{' '}
                        {t('stats.total')}
                    </span>
                </div>
                <div className="w-px h-4 bg-border" />
                <div className="flex items-center gap-1.5 sm:gap-2 text-muted-foreground">
                    <span className="text-xs sm:text-sm font-supreme">
                        <span className="font-bold text-foreground">{filtered.length}</span>{' '}
                        {t('stats.available')}
                    </span>
                </div>
            </div>

            {/* Filter pills */}
            <div className="flex flex-wrap items-center gap-2">
                {FILTER_OPTIONS.map((opt) => {
                    const isActive = activeFilter === opt.value;
                    return (
                        <button
                            key={opt.key}
                            onClick={() => setActiveFilter(opt.value)}
                            className={`
                                px-3 py-1.5 sm:px-4 sm:py-2 rounded-full text-[10px] sm:text-xs font-bold font-supreme uppercase tracking-wide
                                border transition-all duration-200
                                ${isActive
                                    ? 'bg-brand-green-emerald text-white border-brand-green-emerald shadow-md'
                                    : 'bg-card text-muted-foreground border-border hover:border-accent/50 hover:text-foreground'
                                }
                            `}
                            type="button"
                        >
                            {t(`filter.${opt.key}`)}
                        </button>
                    );
                })}
            </div>

            {/* Content */}
            {isLoading ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-muted-foreground">
                    <Loader2 className="w-8 h-8 animate-spin" />
                    <p className="text-sm font-supreme">{t('title')}...</p>
                </div>
            ) : filtered.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                    <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center">
                        <Swords className="w-8 h-8 text-muted-foreground" />
                    </div>
                    <h3 className="font-display text-lg font-bold text-foreground">
                        {t('empty')}
                    </h3>
                    <p className="text-sm font-supreme text-muted-foreground max-w-md">
                        {t('emptyHint')}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filtered.map((challenge) => (
                        <ChallengeCard
                            key={`${challenge.courseId}-${challenge.lessonIndex}`}
                            challenge={challenge}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
