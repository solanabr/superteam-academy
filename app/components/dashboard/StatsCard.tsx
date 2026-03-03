/**
 * StatsCard — Reusable stat card with solid background color.
 * Used in dashboard for Completed, Lessons, Hours, etc.
 */
import { type LucideIcon } from 'lucide-react';

interface StatsCardProps {
    icon: LucideIcon;
    label: string;
    value: string | number;
    subtext?: string;
    /** Solid card background color (light mode) */
    bgColor: string;
    /** Solid card background color (dark mode) */
    bgColorDark: string;
    /** Icon color */
    iconColor?: string;
}

export function StatsCard({
    icon: Icon,
    label,
    value,
    subtext,
    bgColor,
    bgColorDark,
    iconColor = 'currentColor',
}: StatsCardProps) {
    return (
        <div
            className="rounded-xl p-5 border border-border/50 font-supreme"
            style={{
                // Use CSS custom property trick for theme-aware inline styles
                '--stats-bg-light': bgColor,
                '--stats-bg-dark': bgColorDark,
            } as React.CSSProperties}
        >
            <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground/70">{label}</span>
                <Icon className="w-5 h-5" style={{ color: iconColor }} />
            </div>
            <div className="text-2xl font-bold text-foreground font-supreme tabular-nums">
                {value}
            </div>
            {subtext && (
                <div className="text-xs text-muted-foreground mt-1">{subtext}</div>
            )}

            <style jsx>{`
                div:first-child {
                    background-color: var(--stats-bg-light);
                }
                :global(.dark) div:first-child {
                    background-color: var(--stats-bg-dark);
                }
            `}</style>
        </div>
    );
}
