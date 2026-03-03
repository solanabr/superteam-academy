/**
 * LeaderboardSearchBar — Search input to filter leaderboard users.
 * Matches the filter bar / search bar styling from courses page.
 * Searches across username, wallet address, and rank.
 */
'use client';

import { useRef } from 'react';
import { Search, X } from 'lucide-react';

interface LeaderboardSearchBarProps {
    value: string;
    onChange: (value: string) => void;
    resultCount?: number;
    placeholder?: string;
}

export function LeaderboardSearchBar({
    value,
    onChange,
    resultCount,
    placeholder = 'Search by name, username, wallet, or rank...',
}: LeaderboardSearchBarProps) {
    const inputRef = useRef<HTMLInputElement>(null);

    return (
        <div className="mb-4">
            <div className="flex items-center gap-2.5 rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] px-4 py-2.5">
                {/* Search icon */}
                <Search className="w-4 h-4 text-muted-foreground shrink-0" aria-hidden="true" />

                {/* Input */}
                <input
                    ref={inputRef}
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-supreme text-foreground placeholder:text-muted-foreground/60 min-w-0"
                    aria-label="Search leaderboard users"
                    id="leaderboard-search-input"
                />

                {/* Clear button */}
                {value.length > 0 && (
                    <button
                        type="button"
                        className="flex items-center justify-center w-5 h-5 rounded-full bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        onClick={() => {
                            onChange('');
                            inputRef.current?.focus();
                        }}
                        aria-label="Clear search"
                    >
                        <X className="w-3 h-3" />
                    </button>
                )}

                {/* Result count */}
                {value.length > 0 && resultCount !== undefined && (
                    <span className="text-[11px] text-muted-foreground font-supreme shrink-0 tabular-nums">
                        {resultCount} found
                    </span>
                )}
            </div>
        </div>
    );
}
