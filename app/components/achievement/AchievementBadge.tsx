/**
 * AchievementBadge — Renders a badge with locked/unlocked/eligible state.
 * Redesigned with Tailwind, brand fonts, lucide icons — no emojis.
 */
'use client';

import Image from 'next/image';
import { Lock, ExternalLink, Zap } from 'lucide-react';
import type { Achievement } from '@/context/types/achievement';

interface AchievementBadgeProps {
    achievement: Achievement;
    size?: 'sm' | 'md' | 'lg';
    showDetails?: boolean;
    onClaim?: (achievementId: string) => void;
}

const SIZES = {
    sm: { box: 'w-12 h-12', imgPx: 48 },
    md: { box: 'w-16 h-16', imgPx: 64 },
    lg: { box: 'w-24 h-24', imgPx: 96 },
} as const;

export function AchievementBadge({
    achievement,
    size = 'md',
    showDetails = false,
    onClaim,
}: AchievementBadgeProps) {
    const s = SIZES[size];
    const isClaimed = !!achievement.txSignature;
    const isEligible = achievement.eligible;
    const isUnlocked = achievement.unlocked;

    return (
        <div className="flex flex-col items-center gap-2 text-center">
            {/* Badge circle */}
            <div className="relative mb-3">
                <div
                    className={`${s.box} rounded-full flex items-center justify-center border-2 transition-all overflow-hidden ${isEligible
                        ? 'border-brand-green-emerald shadow-[0_0_20px_rgba(0,140,76,0.3)] animate-pulse'
                        : isUnlocked
                            ? 'border-brand-green-emerald/60 bg-gradient-to-br from-brand-green-emerald/20 to-emerald-500/20 shadow-md'
                            : 'border-border bg-muted/50 opacity-50 grayscale'
                        }`}
                >
                    {achievement.badge ? (
                        <Image
                            src={achievement.badge}
                            alt={achievement.name}
                            width={s.imgPx}
                            height={s.imgPx}
                            className="object-cover"
                        />
                    ) : (
                        <span className="text-lg text-muted-foreground">{achievement.icon}</span>
                    )}
                </div>

                {/* Lock overlay */}
                {!isUnlocked && (
                    <div className="absolute top-0 -right-1 w-5 h-5 rounded-full bg-card border border-border flex items-center justify-center z-20 shadow-sm">
                        <Lock className="w-3 h-3 text-muted-foreground" />
                    </div>
                )}

                {/* XP Pill attached to badge */}
                {!isUnlocked && (
                    <div className="absolute -bottom-2.5 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-card dark:bg-muted border border-border shadow-sm shadow-brand-green-emerald/20 dark:shadow-brand-yellow/20 flex items-center gap-1 z-10 whitespace-nowrap">
                        <Zap className="w-2.5 h-2.5 text-foreground dark:text-brand-yellow drop-shadow-[0_0_2px_rgba(0,140,76,0.5)] dark:drop-shadow-[0_0_2px_rgba(255,210,63,0.5)]" />
                        <span className="text-[10px] font-bold font-supreme text-foreground dark:text-brand-yellow">
                            +{achievement.xpReward} XP
                        </span>
                    </div>
                )}
            </div>

            {/* Details */}
            {showDetails && (
                <div className="flex flex-col items-center gap-0.5 max-w-[130px] text-center">
                    <span className="text-xs font-bold font-supreme text-foreground leading-tight truncate">
                        {achievement.name}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-supreme line-clamp-2 leading-tight">
                        {achievement.description}
                    </span>

                    {isClaimed && achievement.unlockedAt && (
                        <span className="text-[10px] text-brand-green-emerald font-supreme">
                            {new Date(achievement.unlockedAt * 1000).toLocaleDateString()}
                        </span>
                    )}

                    {isClaimed && achievement.txSignature && (
                        <a
                            href={`https://explorer.solana.com/tx/${achievement.txSignature}?cluster=devnet`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[10px] text-brand-green-emerald hover:underline font-supreme"
                        >
                            <ExternalLink className="w-2.5 h-2.5" />
                            View on Explorer
                        </a>
                    )}

                    {isEligible && !isClaimed && (
                        <button
                            className="mt-1 px-2.5 py-1 rounded-md bg-gradient-to-r from-brand-green-emerald to-emerald-500 text-white text-[10px] font-bold font-supreme hover:shadow-md transition-shadow"
                            onClick={() => onClaim?.(achievement.id)}
                            type="button"
                        >
                            Claim +{achievement.xpReward} XP
                        </button>
                    )}


                </div>
            )}
        </div>
    );
}
