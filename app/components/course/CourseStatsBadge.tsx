/**
 * CourseStatsBadge — Stat pill with Lucide icon for course metadata.
 * No emojis — uses Lucide icon components.
 * All variants have visible borders for light mode contrast.
 * XP variant uses native dark colors (zinc/stone) for readability.
 */
'use client';

import type { LucideIcon } from 'lucide-react';

interface CourseStatsBadgeProps {
    Icon: LucideIcon;
    label: string;
    variant?: 'default' | 'xp';
    className?: string;
}

export function CourseStatsBadge({ Icon, label, variant = 'default', className = '' }: CourseStatsBadgeProps) {
    const variantClasses = variant === 'xp'
        ? 'bg-zinc-100 text-zinc-800 border-zinc-300 dark:bg-zinc-800 dark:text-zinc-200 dark:border-zinc-500'
        : 'bg-muted/60 text-muted-foreground border-border dark:border-zinc-600';

    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-xs font-medium font-supreme ${variantClasses} ${className}`}
        >
            <Icon className="w-3 h-3" aria-hidden="true" />
            {label}
        </span>
    );
}
