'use client';

/**
 * Achievement showcase — displays earned achievement badges in a grid.
 * Links to the /achievements page for full details.
 */

import { Trophy, Award } from 'lucide-react';
import Link from 'next/link';

interface AchievementItem {
    achievement_id: string;
    awarded_at: string;
    asset_address?: string | null;
}

interface AchievementShowcaseProps {
    achievements: AchievementItem[];
    isLoading?: boolean;
    maxDisplay?: number;
}

/** Map achievement IDs to display info */
const ACHIEVEMENT_DISPLAY: Record<string, { icon: typeof Trophy; label: string }> = {
    first_steps: { icon: Award, label: 'First Steps' },
    course_completer: { icon: Award, label: 'Course Completer' },
    speed_runner: { icon: Award, label: 'Speed Runner' },
    week_warrior: { icon: Award, label: 'Week Warrior' },
    monthly_master: { icon: Award, label: 'Monthly Master' },
    consistency_king: { icon: Trophy, label: 'Consistency King' },
    rust_rookie: { icon: Award, label: 'Rust Rookie' },
    anchor_expert: { icon: Trophy, label: 'Anchor Expert' },
    full_stack_solana: { icon: Trophy, label: 'Full Stack Solana' },
    early_adopter: { icon: Award, label: 'Early Adopter' },
    bug_hunter: { icon: Award, label: 'Bug Hunter' },
    perfect_score: { icon: Trophy, label: 'Perfect Score' },
};

export function AchievementShowcase({
    achievements,
    isLoading,
    maxDisplay = 12,
}: AchievementShowcaseProps) {
    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-8">
                <div className="w-5 h-5 border-2 border-brand-green-emerald border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (achievements.length === 0) {
        return (
            <div className="rounded-xl p-8 text-center" style={{ backgroundColor: 'var(--profile-center-muted-bg)', border: '1px solid var(--profile-center-muted-border)' }}>
                <Trophy className="w-5 h-5 mx-auto mb-2" style={{ color: 'var(--profile-center-sub)' }} />
                <p className="text-sm font-supreme" style={{ color: 'var(--profile-center-sub)' }}>
                    No achievements yet. Start learning to unlock badges!
                </p>
            </div>
        );
    }

    const displayed = achievements.slice(0, maxDisplay);
    const remaining = achievements.length - maxDisplay;

    return (
        <div>
            <div className="flex flex-wrap gap-2.5">
                {displayed.map((ach) => {
                    const display = ACHIEVEMENT_DISPLAY[ach.achievement_id] || {
                        icon: Trophy,
                        label: ach.achievement_id.replace(/_/g, ' '),
                    };
                    const IconComp = display.icon;

                    return (
                        <div
                            key={ach.achievement_id}
                            title={`${display.label} — ${new Date(ach.awarded_at).toLocaleDateString()}`}
                            className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-supreme transition-colors"
                            style={{ backgroundColor: 'var(--profile-center-muted-bg)', border: '1px solid var(--profile-center-muted-border)', color: 'var(--profile-center-text)' }}
                        >
                            <IconComp className="w-4 h-4 text-brand-green-emerald shrink-0" />
                            <span className="capitalize">{display.label}</span>
                        </div>
                    );
                })}
            </div>

            {remaining > 0 && (
                <Link
                    href="/achievements"
                    className="inline-block mt-3 text-xs font-semibold text-brand-green-emerald hover:underline font-supreme"
                >
                    +{remaining} more
                </Link>
            )}
        </div>
    );
}
