'use client';

import { useTranslations } from 'next-intl';
import { RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { CourseFilters, Difficulty, SortBy } from '@/lib/stores/course-store';

// ---------------------------------------------------------------------------
// Track config
// ---------------------------------------------------------------------------

const TRACKS = [
  { value: null, labelKey: 'track_all' },
  { value: 'solana-core', labelKey: 'track_solana_core' },
  { value: 'defi', labelKey: 'track_defi' },
  { value: 'nft', labelKey: 'track_nft' },
  { value: 'security', labelKey: 'track_security' },
] as const;

const DIFFICULTIES: { value: Difficulty; labelKey: string }[] = [
  { value: 'beginner', labelKey: 'beginner' },
  { value: 'intermediate', labelKey: 'intermediate' },
  { value: 'advanced', labelKey: 'advanced' },
];

const SORT_OPTIONS: { value: SortBy; labelKey: string }[] = [
  { value: 'newest', labelKey: 'sort_newest' },
  { value: 'popular', labelKey: 'sort_popular' },
  { value: 'difficulty', labelKey: 'sort_difficulty' },
  { value: 'title', labelKey: 'sort_title' },
];

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface FilterSidebarProps {
  filters: CourseFilters;
  onFilterChange: <K extends keyof CourseFilters>(key: K, value: CourseFilters[K]) => void;
  onReset: () => void;
  className?: string;
}

function countActiveFilters(filters: CourseFilters): number {
  let count = 0;
  if (filters.track) count++;
  if (filters.difficulty) count++;
  if (filters.searchQuery.trim()) count++;
  if (filters.sortBy !== 'newest') count++;
  return count;
}

export function FilterSidebar({
  filters,
  onFilterChange,
  onReset,
  className,
}: FilterSidebarProps) {
  const t = useTranslations('courses');
  const activeCount = countActiveFilters(filters);

  return (
    <aside className={cn('flex flex-col gap-6', className)}>
      {/* Header with active count + reset */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{t('filter_filters')}</h2>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {t('active_filters', { count: activeCount })}
            </Badge>
          )}
        </div>
        {activeCount > 0 && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="text-muted-foreground h-auto gap-1 px-2 py-1"
          >
            <RotateCcw className="size-3" />
            {t('reset_filters')}
          </Button>
        )}
      </div>

      <Separator />

      {/* Track filter */}
      <FilterSection title={t('filter_track')}>
        <div className="flex flex-wrap gap-1.5">
          {TRACKS.map((track) => {
            const isActive = filters.track === track.value;
            return (
              <Button
                key={track.labelKey}
                variant={isActive ? 'default' : 'outline'}
                size="xs"
                onClick={() =>
                  onFilterChange('track', isActive ? null : (track.value as string | null))
                }
                className={cn(
                  'transition-colors',
                  isActive && 'shadow-sm',
                )}
              >
                {t(track.labelKey)}
              </Button>
            );
          })}
        </div>
      </FilterSection>

      <Separator />

      {/* Difficulty filter */}
      <FilterSection title={t('filter_difficulty')}>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((diff) => {
            const isActive = filters.difficulty === diff.value;
            return (
              <Button
                key={diff.value}
                variant={isActive ? 'default' : 'outline'}
                size="xs"
                onClick={() =>
                  onFilterChange(
                    'difficulty',
                    isActive ? null : diff.value,
                  )
                }
                className={cn(
                  'transition-colors',
                  isActive && 'shadow-sm',
                )}
              >
                {t(diff.labelKey)}
              </Button>
            );
          })}
        </div>
      </FilterSection>

      <Separator />

      {/* Sort by */}
      <FilterSection title={t('sort_by')}>
        <Select
          value={filters.sortBy}
          onValueChange={(val) => onFilterChange('sortBy', val as SortBy)}
        >
          <SelectTrigger className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((opt) => (
              <SelectItem key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Internal
// ---------------------------------------------------------------------------

function FilterSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}
