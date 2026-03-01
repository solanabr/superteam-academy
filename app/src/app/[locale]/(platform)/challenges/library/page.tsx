'use client';

import { useCallback, useMemo, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Code2, SlidersHorizontal, Zap } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { SearchBar } from '@/components/courses/search-bar';
import { ChallengeFilterSidebar, DEFAULT_FILTERS } from '@/components/challenges/challenge-filter-sidebar';
import { ChallengeGrid } from '@/components/challenges/challenge-grid';
import { getAllChallenges, getChallengesByCategory } from '@/lib/challenges';
import { cn } from '@/lib/utils';
import type { ChallengeFilters } from '@/components/challenges/challenge-filter-sidebar';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const ALL_CHALLENGES = getAllChallenges();

const CATEGORY_STATS = [
  { key: 'solana-fundamentals', labelKey: 'solana_fundamentals', color: 'text-violet-400' },
  { key: 'defi', labelKey: 'defi', color: 'text-emerald-400' },
  { key: 'nft-metaplex', labelKey: 'nft_metaplex', color: 'text-amber-400' },
  { key: 'security', labelKey: 'security', color: 'text-rose-400' },
  { key: 'token-extensions', labelKey: 'token_extensions', color: 'text-fuchsia-400' },
] as const;

const DIFFICULTY_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ChallengeLibraryPage() {
  const t = useTranslations('challenges_page');

  const [filters, setFilters] = useState<ChallengeFilters>({ ...DEFAULT_FILTERS });
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const setFilter = useCallback(<K extends keyof ChallengeFilters>(key: K, value: ChallengeFilters[K]) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters({ ...DEFAULT_FILTERS });
  }, []);

  const filtered = useMemo(() => {
    let result = [...ALL_CHALLENGES];

    if (filters.category) {
      result = result.filter((c) => c.category === filters.category);
    }
    if (filters.difficulty) {
      result = result.filter((c) => c.difficulty === filters.difficulty);
    }
    if (filters.language) {
      result = result.filter((c) => c.language === filters.language);
    }
    if (filters.searchQuery.trim()) {
      const q = filters.searchQuery.toLowerCase();
      result = result.filter(
        (c) =>
          c.title.toLowerCase().includes(q) ||
          c.description.toLowerCase().includes(q),
      );
    }

    switch (filters.sortBy) {
      case 'difficulty':
        result.sort((a, b) => DIFFICULTY_ORDER[a.difficulty] - DIFFICULTY_ORDER[b.difficulty]);
        break;
      case 'xp':
        result.sort((a, b) => b.xpReward - a.xpReward);
        break;
      case 'time':
        result.sort((a, b) => a.estimatedMinutes - b.estimatedMinutes);
        break;
    }

    return result;
  }, [filters]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.category) count++;
    if (filters.difficulty) count++;
    if (filters.language) count++;
    if (filters.searchQuery.trim()) count++;
    if (filters.sortBy !== 'default') count++;
    return count;
  }, [filters]);

  return (
    <div className="flex flex-col gap-6">
      {/* Tab navigation */}
      <div className="flex items-center gap-2">
        <Link href="/challenges">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
            <Zap className="size-4" />
            {t('daily_tab')}
          </Button>
        </Link>
        <Button variant="secondary" size="sm" className="gap-1.5">
          <Code2 className="size-4" />
          {t('library_tab')}
          <Badge variant="outline" className="ml-1 text-[10px]">
            {ALL_CHALLENGES.length}
          </Badge>
        </Button>
      </div>

      {/* Page header */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <Code2 className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">
            {t('library_title')}
          </h1>
        </div>
        <p className="text-muted-foreground text-sm lg:text-base">
          {t('library_description')}
        </p>
      </div>

      {/* Category stats row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {CATEGORY_STATS.map((cat) => (
          <button
            key={cat.key}
            onClick={() =>
              setFilter('category', filters.category === cat.key ? null : (cat.key as ChallengeFilters['category']))
            }
            className={cn(
              'flex flex-col items-center gap-1 rounded-lg border p-3 transition-colors hover:bg-accent/50',
              filters.category === cat.key && 'border-primary bg-primary/5',
            )}
          >
            <span className={cn('text-2xl font-bold', cat.color)}>
              {getChallengesByCategory(cat.key as Parameters<typeof getChallengesByCategory>[0]).length}
            </span>
            <span className="text-xs text-muted-foreground text-center leading-tight">
              {t(cat.labelKey)}
            </span>
          </button>
        ))}
      </div>

      {/* Search + mobile filter toggle */}
      <div className="flex items-center gap-3">
        <SearchBar
          value={filters.searchQuery}
          onChange={(q) => setFilter('searchQuery', q)}
          className="flex-1"
        />
        <Button
          variant="outline"
          size="default"
          onClick={() => setMobileFiltersOpen(true)}
          className="relative lg:hidden"
          aria-label={t('filters')}
        >
          <SlidersHorizontal className="size-4" />
          <span className="hidden sm:inline">{t('filters')}</span>
          {activeFilterCount > 0 && (
            <Badge className="absolute -top-2 -right-2 size-5 items-center justify-center p-0 text-[10px]">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
      </div>

      {/* Main layout: sidebar + grid */}
      <div className="flex gap-8">
        <ChallengeFilterSidebar
          filters={filters}
          onFilterChange={setFilter}
          onReset={resetFilters}
          className="hidden w-56 shrink-0 lg:flex"
        />
        <ChallengeGrid
          challenges={filtered}
          total={ALL_CHALLENGES.length}
          className="flex-1"
        />
      </div>

      {/* Mobile filter sheet */}
      <Sheet open={mobileFiltersOpen} onOpenChange={setMobileFiltersOpen}>
        <SheetContent side="left" className="w-80 overflow-y-auto">
          <SheetHeader>
            <SheetTitle>{t('filters')}</SheetTitle>
            <SheetDescription className="sr-only">
              {t('library_description')}
            </SheetDescription>
          </SheetHeader>
          <div className="px-4 pb-6">
            <ChallengeFilterSidebar
              filters={filters}
              onFilterChange={(key, value) => {
                setFilter(key, value);
              }}
              onReset={() => {
                resetFilters();
                setMobileFiltersOpen(false);
              }}
            />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
