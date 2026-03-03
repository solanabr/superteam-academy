/**
 * ChallengeCard — Individual challenge card with language badge,
 * difficulty indicator, XP reward, and link to the lesson page.
 *
 * Uses lucide-react icons (no emojis), brand fonts (Supreme/Quilon),
 * and brand color variables.
 */
'use client';

import { useTranslations } from 'next-intl';
import { Code2, Zap, ArrowRight, BookOpen } from 'lucide-react';
import { Link } from '@/context/i18n/navigation';
import { DIFFICULTY_LABELS, DIFFICULTY_COLORS } from '@/context/types/course';
import type { ChallengeItem } from '@/context/hooks/useChallenges';

interface ChallengeCardProps {
    challenge: ChallengeItem;
}

export function ChallengeCard({ challenge }: ChallengeCardProps) {
    const t = useTranslations('challenges.card');

    return (
        <div className="group relative flex flex-col rounded-2xl border border-border bg-card overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1 hover:border-accent/50">
            {/* Top accent bar */}
            <div className="h-1 w-full bg-gradient-to-r from-brand-green-emerald to-brand-yellow" />

            <div className="flex flex-col flex-1 p-5 gap-4">
                {/* Header: Language badge + Difficulty */}
                <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-accent/10 text-accent">
                        <Code2 className="w-3.5 h-3.5" />
                        <span className="text-xs font-semibold font-supreme uppercase tracking-wide">
                            {challenge.language}
                        </span>
                    </div>
                    <span className={`text-[0.65rem] font-semibold font-supreme px-2 py-0.5 rounded-full border ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
                        {DIFFICULTY_LABELS[challenge.difficulty]}
                    </span>
                </div>

                {/* Title */}
                <h3 className="font-display text-base font-bold text-card-foreground leading-snug line-clamp-2">
                    {challenge.lessonTitle}
                </h3>

                {/* Course name */}
                <div className="flex items-center gap-1.5 text-muted-foreground">
                    <BookOpen className="w-3.5 h-3.5 flex-shrink-0" />
                    <span className="text-xs font-supreme truncate">
                        {challenge.courseTitle}
                    </span>
                </div>

                {/* Instructions preview */}
                <p className="text-xs text-muted-foreground font-supreme leading-relaxed line-clamp-2 flex-1">
                    {challenge.instructions}
                </p>

                {/* Footer: XP + CTA */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                    <div className="flex items-center gap-1.5 text-brand-yellow">
                        <Zap className="w-4 h-4" />
                        <span className="text-sm font-bold font-supreme">
                            {t('xpReward', { xp: challenge.xpReward })}
                        </span>
                    </div>
                    <Link
                        href={challenge.linkHref}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold font-supreme bg-brand-green-emerald text-white transition-all duration-200 hover:bg-brand-green-dark hover:gap-2.5"
                    >
                        {t('startChallenge')}
                        <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>
            </div>
        </div>
    );
}
