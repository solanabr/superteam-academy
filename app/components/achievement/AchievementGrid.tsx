/**
 * AchievementGrid — Category-filtered grid with progress counter.
 * Redesigned with Tailwind, brand fonts, lucide icons.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useAchievements } from '@/context/hooks/useAchievements';
import { AchievementBadge } from './AchievementBadge';
import { AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
import type { AchievementCategory } from '@/context/types/achievement';

const CATEGORY_KEYS: Array<AchievementCategory | 'all'> = [
    'all', 'progress', 'streak', 'skill', 'community', 'special',
];

export function AchievementGrid() {
    const t = useTranslations('achievements');
    const tc = useTranslations('common');
    const { data: achievements, isLoading, error, refetch } = useAchievements();
    const [category, setCategory] = useState<AchievementCategory | 'all'>('all');

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-brand-green-emerald" />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center gap-3 py-10 text-center">
                <AlertTriangle className="w-8 h-8 text-yellow-500" />
                <p className="text-sm text-muted-foreground font-supreme">{t('loadFailed')}</p>
                <button
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-brand-green-emerald/50 text-brand-green-emerald text-sm font-semibold font-supreme hover:bg-brand-green-emerald/10 transition-colors"
                    onClick={() => refetch()}
                >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {tc('retry')}
                </button>
            </div>
        );
    }

    const filtered =
        category === 'all'
            ? achievements
            : achievements?.filter((a) => a.category === category);

    const unlocked = achievements?.filter((a) => a.unlocked).length ?? 0;
    const total = achievements?.length ?? 0;

    return (
        <div className="space-y-5">
            {/* Progress bar */}
            <div className="space-y-2">
                <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-muted-foreground font-supreme uppercase tracking-wider">
                        {t('progress', { unlocked, total })}
                    </span>
                    <span className="text-xs font-bold text-brand-green-emerald font-array">
                        {total > 0 ? Math.round((unlocked / total) * 100) : 0}%
                    </span>
                </div>
                <div className="w-full h-2 bg-black/10 dark:bg-white/10 rounded-full overflow-hidden border border-border/50">
                    <div
                        className="h-full bg-gradient-to-r from-brand-green-emerald to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: total > 0 ? `${(unlocked / total) * 100}%` : '0%' }}
                    />
                </div>
            </div>

            {/* Category filter tabs */}
            <div className="flex gap-2 flex-wrap">
                {CATEGORY_KEYS.map((key) => (
                    <button
                        key={key}
                        className={`px-3 py-1 sm:px-4 sm:py-1.5 rounded-full text-[10px] sm:text-xs font-semibold font-supreme transition-all border ${category === key
                            ? 'bg-brand-green-emerald text-white border-brand-green-emerald shadow-md'
                            : 'bg-white dark:bg-muted text-foreground dark:text-foreground/70 border-border shadow-sm hover:border-brand-green-emerald/50 hover:text-foreground'
                            }`}
                        onClick={() => setCategory(key)}
                    >
                        {t(`categories.${key}`)}
                    </button>
                ))}
            </div>

            {/* Badge grid */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                {filtered?.map((achievement) => (
                    <AchievementBadge
                        key={achievement.id}
                        achievement={achievement}
                        showDetails
                    />
                ))}
                {filtered?.length === 0 && (
                    <p className="col-span-full text-center text-sm text-muted-foreground py-8 font-supreme">
                        {t('emptyCategory')}
                    </p>
                )}
            </div>
        </div>
    );
}
