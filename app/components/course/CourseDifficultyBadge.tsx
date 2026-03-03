/**
 * CourseDifficultyBadge — Pill badge for course difficulty level.
 * Uses existing DIFFICULTY_COLORS Tailwind classes and DIFFICULTY_LABELS.
 */
'use client';

import { DIFFICULTY_LABELS, DIFFICULTY_COLORS, type Difficulty } from '@/context/types/course';

interface CourseDifficultyBadgeProps {
    difficulty: Difficulty;
    className?: string;
}

export function CourseDifficultyBadge({ difficulty, className = '' }: CourseDifficultyBadgeProps) {
    const label = DIFFICULTY_LABELS[difficulty] ?? 'Unknown';
    const colorClasses = DIFFICULTY_COLORS[difficulty] ?? '';

    return (
        <span
            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold font-supreme border ${colorClasses} ${className}`}
            aria-label={`Difficulty: ${label}`}
        >
            {label}
        </span>
    );
}
