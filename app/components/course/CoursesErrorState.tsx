/**
 * CoursesErrorState — Shown when the courses API request fails.
 * Uses destructive color tokens for error emphasis.
 */
'use client';

import { AlertTriangle } from 'lucide-react';

interface CoursesErrorStateProps {
    message?: string;
    className?: string;
}

export function CoursesErrorState({
    message = 'Failed to load courses. Please try again later.',
    className = '',
}: CoursesErrorStateProps) {
    return (
        <div
            className={`flex items-center gap-3 p-6 rounded-2xl border border-destructive/20 bg-destructive/5 ${className}`}
            role="alert"
        >
            <AlertTriangle className="w-5 h-5 text-destructive shrink-0" aria-hidden="true" />
            <p className="text-sm text-destructive font-supreme m-0">{message}</p>
        </div>
    );
}
