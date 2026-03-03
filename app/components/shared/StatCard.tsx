'use client';

/**
 * StatCard — reusable solid-color stat block.
 * Used on profile & dashboard pages.
 */

import type { LucideIcon } from 'lucide-react';

interface StatCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    bgColor: string;
    textColor?: string;
}

export function StatCard({ icon: Icon, label, value, bgColor, textColor = '#1b231d' }: StatCardProps) {
    return (
        <div
            className="rounded-3xl p-5 border-0 shadow-sm"
            style={{ backgroundColor: bgColor, color: textColor, minHeight: 120 }}
            role="status"
            aria-label={`${label}: ${value}`}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium font-supreme">
                    {label}
                </span>
                <Icon className="w-5 h-5" style={{ color: textColor }} aria-hidden="true" />
            </div>
            <div className="text-2xl font-bold font-supreme tabular-nums">
                {value}
            </div>
        </div>
    );
}
