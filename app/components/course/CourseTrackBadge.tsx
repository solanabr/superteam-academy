/**
 * CourseTrackBadge — Displays the track name with its brand color.
 * Uses getTrackName/getTrackColor for data-driven color.
 */
'use client';

import { getTrackName, getTrackColor } from '@/context/course/tracks';

interface CourseTrackBadgeProps {
    trackId: number;
    className?: string;
}

export function CourseTrackBadge({ trackId, className = '' }: CourseTrackBadgeProps) {
    const name = getTrackName(trackId);
    const color = getTrackColor(trackId);

    return (
        <span
            className={`text-xs font-semibold uppercase tracking-wide font-supreme ${className}`}
            style={{ color }}
        >
            {name}
        </span>
    );
}
