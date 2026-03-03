/**
 * AchievementsContent — Redesigned wrapper for achievements + credentials page.
 * Uses Tailwind, brand fonts, lucide icons — matches dashboard/challenges pattern.
 */
'use client';

import { AchievementGrid } from '@/components/achievement/AchievementGrid';
import { CredentialsSection } from '@/components/achievement/CredentialsSection';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Trophy, Shield } from 'lucide-react';
import Image from 'next/image';
import { BANNER } from '@/lib/banner-constants';

export function AchievementsContent() {
    const t = useTranslations('achievements');
    const { data: session } = useSession();
    const userName = session?.user?.name || 'Learner';

    return (
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-10">
            {/* Banner */}
            <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1] rounded-2xl overflow-hidden border border-border shadow-sm">
                <Image
                    src={BANNER.achievements.src}
                    alt="Achievements"
                    width={1400}
                    height={400}
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL={BANNER.achievements.blur}
                    className="absolute inset-0 w-full h-full object-cover object-top"
                    priority
                />
                {/* Bottom gradient — stronger for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                {/* Text overlay */}
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-1.5">
                        <div className="w-7 h-7 sm:w-9 sm:h-9 rounded-lg sm:rounded-xl bg-brand-yellow/90 flex items-center justify-center">
                            <Trophy className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h1 className="font-display text-base sm:text-xl md:text-2xl lg:text-3xl font-bold text-white drop-shadow-lg">
                            {t('bannerGreeting', { name: userName })}
                        </h1>
                    </div>
                    <p className="font-supreme text-[10px] sm:text-xs md:text-sm text-white/90 max-w-lg drop-shadow-md">
                        {t('bannerMessage')}
                    </p>
                </div>
            </div>

            {/* Badges section */}
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm">
                <div className="flex items-center gap-2 mb-5">
                    <Trophy className="w-5 h-5 text-brand-yellow" />
                    <h2 className="text-lg font-bold font-display text-foreground">
                        {t('badgesTitle')}
                    </h2>
                </div>
                <ErrorBoundary>
                    <AchievementGrid />
                </ErrorBoundary>
            </section>

            {/* Credentials section */}
            <section className="rounded-2xl border border-border bg-card p-5 sm:p-6 shadow-sm space-y-4">
                <div className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-brand-green-emerald" />
                    <h2 className="text-lg font-bold font-display text-foreground">
                        {t('credentialsTitle')}
                    </h2>
                </div>
                <p className="text-sm text-muted-foreground font-supreme">
                    {t('credentialsSubtitle')}
                </p>
                <ErrorBoundary>
                    <CredentialsSection />
                </ErrorBoundary>
            </section>
        </div>
    );
}
