/**
 * CategoryFilter — badge-chip style filter bar matching CourseFilters UI.
 * Uses Lucide icons instead of emojis, inside a card-styled bar.
 * Accepts optional trailing element (e.g. "New Thread" button).
 * Hidden scrollbar on mobile overflow (UX principle #6).
 */
'use client';

import { useTranslations } from 'next-intl';
import {
    MessageCircle,
    FileText,
    HelpCircle,
    Rocket,
    Megaphone,
} from 'lucide-react';

type Category = 'all' | 'general' | 'help' | 'showcase' | 'feedback';

const CATEGORIES: { key: Category; icon: React.ComponentType<{ className?: string }> }[] = [
    { key: 'all', icon: MessageCircle },
    { key: 'general', icon: FileText },
    { key: 'help', icon: HelpCircle },
    { key: 'showcase', icon: Rocket },
    { key: 'feedback', icon: Megaphone },
];

interface CategoryFilterProps {
    active: Category;
    onChange: (cat: Category) => void;
    /** Optional trailing element rendered at the right edge of the filter bar */
    trailing?: React.ReactNode;
}

export function CategoryFilter({ active, onChange, trailing }: CategoryFilterProps) {
    const t = useTranslations('community.categories');

    return (
        <div role="tablist" aria-label="Category filter">
            <div className="flex items-center gap-1.5 rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] px-3 py-2">
                {/* Scrollable chips */}
                <div className="flex items-center gap-1.5 overflow-x-auto hide-scrollbar flex-1 min-w-0">
                    {CATEGORIES.map((c) => {
                        const Icon = c.icon;
                        const isActive = active === c.key;
                        return (
                            <button
                                key={c.key}
                                onClick={() => onChange(c.key)}
                                role="tab"
                                aria-selected={isActive}
                                className={`inline-flex items-center gap-1.5 rounded-full text-xs sm:text-sm font-medium font-supreme whitespace-nowrap transition-colors duration-150 px-3 py-1.5 sm:px-4 sm:py-2 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring min-h-[36px] ${isActive
                                        ? 'bg-accent text-accent-foreground border-transparent'
                                        : 'bg-transparent text-muted-foreground border-border/60 hover:border-border hover:text-foreground'
                                    }`}
                            >
                                <Icon className="w-3.5 h-3.5" />
                                {t(c.key)}
                            </button>
                        );
                    })}
                </div>

                {/* Trailing element (e.g. New Thread button) */}
                {trailing && (
                    <>
                        <div className="w-px h-5 bg-border/50 shrink-0 hidden sm:block" />
                        {trailing}
                    </>
                )}
            </div>
        </div>
    );
}

export type { Category };
