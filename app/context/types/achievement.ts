/**
 * Achievement types.
 */

export type AchievementCategory = 'progress' | 'streak' | 'skill' | 'community' | 'special';

export interface AchievementDefinition {
    id: string;
    name: string;
    description: string;
    category: AchievementCategory;
    icon: string;
    xpReward: number;
    /** Path to badge image (PNG or SVG) in public/badges/ */
    badge?: string;
}

export interface Achievement extends AchievementDefinition {
    /** Whether the achievement is unlocked (eligible or claimed) */
    unlocked: boolean;
    /** Whether the user is eligible but hasn't claimed yet */
    eligible: boolean;
    /** Unix timestamp when claimed on-chain */
    unlockedAt: number | null;
    /** On-chain NFT asset address (if claimed) */
    asset: string | null;
    /** On-chain transaction signature (if claimed) */
    txSignature: string | null;
}
