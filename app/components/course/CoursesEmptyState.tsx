/**
 * CoursesEmptyState — Shown when no courses match the current filters.
 * Uses design-system tokens for consistent empty state rendering.
 */
'use client';

import { BookOpen } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface CoursesEmptyStateProps {
    className?: string;
}

export function CoursesEmptyState({ className = '' }: CoursesEmptyStateProps) {
    const t = useTranslations('courses');

    return (
        <div
            className={`flex flex-col items-center justify-center py-20 text-center ${className}`}
            role="status"
            aria-label="No courses found"
        >
            <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mb-4">
                <BookOpen className="w-7 h-7 text-muted-foreground" aria-hidden="true" />
            </div>
            <h3 className="text-lg font-semibold text-foreground font-supreme mb-1">
                {t('empty')}
            </h3>
            <p className="text-sm text-muted-foreground font-supreme max-w-sm">
                {t('emptyHint')}
            </p>
        </div>
    );
}
