/**
 * LeaderboardContent — Client wrapper with page header, search, and orchestration.
 * Uses custom SVG TrophyIcon. font-display for heading, font-supreme for body.
 */
'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { TrophyIcon } from '@/components/leaderboard/LeaderboardIcons';
import { LeaderboardSearchBar } from '@/components/leaderboard/LeaderboardSearchBar';
import { LeaderboardStats } from '@/components/leaderboard/LeaderboardStats';
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';

export function LeaderboardContent() {
    const t = useTranslations('leaderboard');
    const [searchQuery, setSearchQuery] = useState('');

    return (
        <div className="max-w-[1400px] mx-auto min-w-0">
            {/* Page header */}
            <header className="mb-6">
                <div className="flex items-center gap-2.5 mb-1">
                    <TrophyIcon size={28} />
                    <h1 className="text-2xl sm:text-3xl font-bold font-display text-foreground">
                        {t('title')}
                    </h1>
                </div>
                <p className="text-sm sm:text-base text-muted-foreground font-supreme ml-0 sm:ml-[38px]">
                    {t('subtitle')}
                </p>
            </header>

            {/* Stats bar */}
            <LeaderboardStats />

            {/* Search bar */}
            <LeaderboardSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
            />

            {/* Rankings table with integrated podium */}
            <LeaderboardTable searchQuery={searchQuery} />
        </div>
    );
}
