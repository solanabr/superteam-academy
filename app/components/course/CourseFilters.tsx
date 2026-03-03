/**
 * CourseFilters — Single horizontal bar with:
 *   Left:  Level dropdown ("All Courses") → inline track chips
 *   Right: Status dropdown (Not started / In progress / Completed) + Sort dropdown
 *
 * Custom dropdowns built without external deps. Fully responsive.
 */
'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { ChevronDown, ChevronLeft, ChevronRight, Check, ArrowUpDown } from 'lucide-react';
import { TRACKS } from '@/context/course/tracks';
import { DIFFICULTY_LABELS, type Difficulty } from '@/context/types/course';

/* ── Types ── */

export type CourseStatus = 'all' | 'not_started' | 'in_progress' | 'completed';
export type SortOption = 'relevance' | 'newest' | 'popular' | 'xp_high' | 'xp_low';

interface CourseFiltersProps {
    selectedTrack: number | null;
    selectedDifficulty: Difficulty | null;
    selectedStatus: CourseStatus;
    selectedSort: SortOption;
    onTrackChange: (trackId: number | null) => void;
    onDifficultyChange: (difficulty: Difficulty | null) => void;
    onStatusChange: (status: CourseStatus) => void;
    onSortChange: (sort: SortOption) => void;
    courseCount: number;
}

/* ── Difficulty options for the "All courses" dropdown ── */

const LEVEL_OPTIONS: { value: Difficulty | null; label: string; bars: number }[] = [
    { value: null, label: 'All Courses', bars: 0 },
    { value: 1, label: 'Beginner', bars: 1 },
    { value: 2, label: 'Intermediate', bars: 2 },
    { value: 3, label: 'Advanced', bars: 3 },
];

const STATUS_OPTIONS: { value: CourseStatus; label: string }[] = [
    { value: 'all', label: 'All' },
    { value: 'not_started', label: 'Not started' },
    { value: 'in_progress', label: 'In progress' },
    { value: 'completed', label: 'Completed' },
];

const SORT_OPTIONS: { value: SortOption; label: string }[] = [
    { value: 'relevance', label: 'Relevance' },
    { value: 'newest', label: 'Newest' },
    { value: 'popular', label: 'Most popular' },
    { value: 'xp_high', label: 'XP: High → Low' },
    { value: 'xp_low', label: 'XP: Low → High' },
];

/* ── Main component ── */

export function CourseFilters({
    selectedTrack,
    selectedDifficulty,
    selectedStatus,
    selectedSort,
    onTrackChange,
    onDifficultyChange,
    onStatusChange,
    onSortChange,
    courseCount,
}: CourseFiltersProps) {
    const t = useTranslations('courses');
    const tc = useTranslations('common');

    const currentLevel = LEVEL_OPTIONS.find((o) => o.value === selectedDifficulty) ?? LEVEL_OPTIONS[0];

    return (
        <div className="mb-6" role="search" aria-label="Course filters">
            {/* ── Single-row bar ── */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl bg-card border border-border shadow-md ring-1 ring-black/[0.04] dark:ring-white/[0.04] px-3 py-2.5 sm:px-4 sm:py-2">
                {/* Left section: Level dropdown + track chips */}
                <div className="flex items-center gap-2 flex-1 min-w-0">
                    {/* Level dropdown */}
                    <FilterDropdown
                        trigger={
                            <span className="inline-flex items-center gap-1.5">
                                {currentLevel.bars > 0 && <SignalBars bars={currentLevel.bars} />}
                                <span className="font-semibold">{currentLevel.label}</span>
                            </span>
                        }
                    >
                        {LEVEL_OPTIONS.map((opt) => (
                            <DropdownItem
                                key={String(opt.value)}
                                selected={selectedDifficulty === opt.value}
                                onClick={() => onDifficultyChange(opt.value)}
                            >
                                <span className="inline-flex items-center gap-2">
                                    {opt.bars > 0 && <SignalBars bars={opt.bars} />}
                                    {opt.label}
                                </span>
                            </DropdownItem>
                        ))}
                    </FilterDropdown>

                    {/* Divider */}
                    <div className="w-px h-5 bg-border/50 shrink-0 hidden sm:block" />

                    {/* Track chips — scrollable with arrow indicators */}
                    <TrackChipScroller
                        tracks={TRACKS}
                        selectedTrack={selectedTrack}
                        onTrackChange={onTrackChange}
                    />
                </div>

                {/* Right section: Status + Sort dropdowns */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Status dropdown */}
                    <FilterDropdown
                        trigger={
                            <span className="inline-flex items-center gap-1.5">
                                Status
                            </span>
                        }
                        align="right"
                    >
                        {STATUS_OPTIONS.map((opt) => (
                            <DropdownItem
                                key={opt.value}
                                selected={selectedStatus === opt.value}
                                onClick={() => onStatusChange(opt.value)}
                                showCheckbox
                            >
                                {opt.label}
                            </DropdownItem>
                        ))}
                    </FilterDropdown>

                    {/* Sort dropdown */}
                    <FilterDropdown
                        trigger={
                            <span className="inline-flex items-center gap-1.5">
                                <ArrowUpDown className="w-3 h-3" />
                                Sort
                            </span>
                        }
                        align="right"
                    >
                        {SORT_OPTIONS.map((opt) => (
                            <DropdownItem
                                key={opt.value}
                                selected={selectedSort === opt.value}
                                onClick={() => onSortChange(opt.value)}
                            >
                                {opt.label}
                            </DropdownItem>
                        ))}
                    </FilterDropdown>
                </div>
            </div>

            {/* Results count — below bar */}
            <p className="text-xs text-muted-foreground font-supreme mt-2 ml-1">
                {t('available', { count: courseCount })}
            </p>
        </div>
    );
}

/* ── SignalBars — visual difficulty indicator like in the reference ── */

const SIGNAL_COLORS: Record<number, string> = {
    1: 'bg-emerald-500',
    2: 'bg-amber-500',
    3: 'bg-rose-500',
};

function SignalBars({ bars }: { bars: number }) {
    const color = SIGNAL_COLORS[bars] ?? 'bg-accent';
    return (
        <span className="inline-flex items-end gap-[2px]" aria-hidden="true">
            {[1, 2, 3].map((level) => (
                <span
                    key={level}
                    className={`rounded-[1px] w-[3px] ${level <= bars ? color : 'bg-muted-foreground/30'}`}
                    style={{ height: 4 + level * 3 }}
                />
            ))}
        </span>
    );
}

/* ── FilterDropdown — reusable dropdown trigger + menu ── */

interface FilterDropdownProps {
    trigger: React.ReactNode;
    children: React.ReactNode;
    align?: 'left' | 'right';
}

function FilterDropdown({ trigger, children, align = 'left' }: FilterDropdownProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    // Close on click outside
    useEffect(() => {
        if (!open) return;
        function handleClick(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Close on escape
    useEffect(() => {
        if (!open) return;
        function handleKey(e: KeyboardEvent) {
            if (e.key === 'Escape') setOpen(false);
        }
        document.addEventListener('keydown', handleKey);
        return () => document.removeEventListener('keydown', handleKey);
    }, [open]);

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                className={`inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-xs sm:text-sm font-medium font-supreme whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${open
                    ? 'border-accent/50 bg-accent/10 text-foreground'
                    : 'border-border/60 bg-transparent text-muted-foreground hover:border-border hover:text-foreground'
                    }`}
                onClick={() => setOpen(!open)}
                aria-expanded={open}
                aria-haspopup="listbox"
            >
                {trigger}
                <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    className={`absolute z-50 mt-1.5 min-w-[160px] rounded-xl border border-border bg-card shadow-lg py-1 animate-in fade-in-0 zoom-in-95 ${align === 'right' ? 'right-0' : 'left-0'
                        }`}
                    role="listbox"
                >
                    {children}
                </div>
            )}
        </div>
    );
}

/* ── DropdownItem — single item inside a dropdown ── */

interface DropdownItemProps {
    selected: boolean;
    onClick: () => void;
    children: React.ReactNode;
    showCheckbox?: boolean;
}

function DropdownItem({ selected, onClick, children, showCheckbox }: DropdownItemProps) {
    return (
        <button
            type="button"
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs sm:text-sm font-medium font-supreme text-left transition-colors hover:bg-muted/50 ${selected ? 'text-foreground' : 'text-muted-foreground'
                }`}
            role="option"
            aria-selected={selected}
            onClick={onClick}
        >
            {showCheckbox ? (
                <span
                    className={`w-4 h-4 shrink-0 rounded border flex items-center justify-center transition-colors ${selected
                        ? 'bg-accent border-accent'
                        : 'border-border'
                        }`}
                >
                    {selected && <Check className="w-3 h-3 text-accent-foreground" />}
                </span>
            ) : (
                <span className="w-4 shrink-0 flex justify-center">
                    {selected && <Check className="w-3.5 h-3.5 text-accent" />}
                </span>
            )}
            {children}
        </button>
    );
}

/* ── TrackChipScroller — scrollable chip row with arrow indicators ── */

interface TrackChipScrollerProps {
    tracks: typeof TRACKS;
    selectedTrack: number | null;
    onTrackChange: (trackId: number | null) => void;
}

function TrackChipScroller({ tracks, selectedTrack, onTrackChange }: TrackChipScrollerProps) {
    const scrollRef = useRef<HTMLDivElement>(null);
    const [canScrollLeft, setCanScrollLeft] = useState(false);
    const [canScrollRight, setCanScrollRight] = useState(false);

    const checkScroll = useCallback(() => {
        const el = scrollRef.current;
        if (!el) return;
        setCanScrollLeft(el.scrollLeft > 4);
        setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    }, []);

    useEffect(() => {
        checkScroll();
        const el = scrollRef.current;
        if (!el) return;
        el.addEventListener('scroll', checkScroll, { passive: true });
        const ro = new ResizeObserver(checkScroll);
        ro.observe(el);
        return () => {
            el.removeEventListener('scroll', checkScroll);
            ro.disconnect();
        };
    }, [checkScroll]);

    const scroll = (dir: 'left' | 'right') => {
        const el = scrollRef.current;
        if (!el) return;
        el.scrollBy({ left: dir === 'left' ? -150 : 150, behavior: 'smooth' });
    };

    return (
        <div className="relative flex items-center flex-1 min-w-0">
            {/* Left arrow */}
            {canScrollLeft && (
                <button
                    type="button"
                    className="absolute left-0 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors -ml-1"
                    onClick={() => scroll('left')}
                    aria-label="Scroll left"
                >
                    <ChevronLeft className="w-3.5 h-3.5" />
                </button>
            )}

            {/* Left fade */}
            {canScrollLeft && (
                <div className="absolute left-5 top-0 bottom-0 w-4 bg-gradient-to-r from-card to-transparent z-[5] pointer-events-none" />
            )}

            {/* Scrollable chips */}
            <div
                ref={scrollRef}
                className="flex gap-1.5 overflow-x-auto hide-scrollbar scroll-smooth px-1"
            >
                {tracks.map((track) => (
                    <button
                        key={track.id}
                        type="button"
                        className={`rounded-full text-[11px] sm:text-xs font-medium font-supreme whitespace-nowrap transition-colors duration-150 px-2.5 py-[3px] sm:px-3 sm:py-1 border focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${selectedTrack === track.id
                            ? 'bg-accent text-accent-foreground border-transparent'
                            : 'bg-transparent text-muted-foreground border-border/60 hover:border-border hover:text-foreground'
                            }`}
                        onClick={() => onTrackChange(selectedTrack === track.id ? null : track.id)}
                        aria-pressed={selectedTrack === track.id}
                    >
                        {track.name}
                    </button>
                ))}
            </div>

            {/* Right fade */}
            {canScrollRight && (
                <div className="absolute right-5 top-0 bottom-0 w-4 bg-gradient-to-l from-card to-transparent z-[5] pointer-events-none" />
            )}

            {/* Right arrow */}
            {canScrollRight && (
                <button
                    type="button"
                    className="absolute right-0 z-10 flex items-center justify-center w-6 h-6 rounded-full bg-card border border-border shadow-sm text-muted-foreground hover:text-foreground transition-colors -mr-1"
                    onClick={() => scroll('right')}
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-3.5 h-3.5" />
                </button>
            )}
        </div>
    );
}
