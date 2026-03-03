/**
 * Predefined achievement definitions — on-chain trackable achievements only.
 * Each has a corresponding SVG badge in public/badges/.
 *
 * On-chain: awarded via `award_achievement` (mints NFT + XP).
 * Streak milestones: XP via `reward_xp` with memo.
 */
import type { AchievementDefinition } from '@/context/types/achievement';

export const ACHIEVEMENTS: AchievementDefinition[] = [
    // ─── Progress ───────────────────────────────────────────────────
    { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', category: 'progress', icon: '🚀', xpReward: 50, badge: '/badges/first_steps.svg' },
    { id: 'course-completer', name: 'Course Completer', description: 'Complete your first course', category: 'progress', icon: '🎓', xpReward: 100, badge: '/badges/course_completor.svg' },
    { id: 'five-courses', name: 'Knowledge Seeker', description: 'Complete 5 courses', category: 'progress', icon: '📚', xpReward: 500, badge: '/badges/five_courses.svg' },
    { id: 'ten-courses', name: 'Scholar', description: 'Complete 10 courses', category: 'progress', icon: '🧠', xpReward: 1000, badge: '/badges/ten_courses.svg' },

    // ─── Streaks ────────────────────────────────────────────────────
    { id: 'week-warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', category: 'streak', icon: '🔥', xpReward: 100, badge: '/badges/week_warrior.svg' },
    { id: 'monthly-master', name: 'Monthly Master', description: 'Maintain a 30-day streak', category: 'streak', icon: '👑', xpReward: 500, badge: '/badges/monthly_master.svg' },
    { id: 'consistency-king', name: 'Consistency King', description: 'Maintain a 100-day streak', category: 'streak', icon: '💎', xpReward: 2000, badge: '/badges/consistency_king.svg' },

    // ─── Skills ─────────────────────────────────────────────────────
    { id: 'rust-rookie', name: 'Rust Rookie', description: 'Complete 5 Rust lessons', category: 'skill', icon: '🦀', xpReward: 100, badge: '/badges/rust_rookie.svg' },
    { id: 'anchor-novice', name: 'Anchor Novice', description: 'Complete the Anchor basics', category: 'skill', icon: '⚓', xpReward: 100, badge: '/badges/anchor_novice.svg' },
    { id: 'anchor-expert', name: 'Anchor Expert', description: 'Complete the Anchor track', category: 'skill', icon: '🏆', xpReward: 500, badge: '/badges/anchor_expert.svg' },
    { id: 'full-stack-solana', name: 'Full Stack Solana', description: 'Complete all Solana tracks', category: 'skill', icon: '🌟', xpReward: 1000, badge: '/badges/full_stack_solana.svg' },

    // ─── Special ────────────────────────────────────────────────────
    { id: 'early-adopter', name: 'Early Adopter', description: 'Join during beta', category: 'special', icon: '⭐', xpReward: 500, badge: '/badges/early_adopter.svg' },
    { id: 'speed-runner', name: 'Speed Runner', description: 'Complete a course in under 24 hours', category: 'special', icon: '⚡', xpReward: 300, badge: '/badges/speed_runner.svg' },
];

