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
import type { ChallengeCategory, ChallengeDifficulty, ChallengeLanguage } from '@/lib/challenges';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ChallengeFilters {
  category: ChallengeCategory | null;
  difficulty: ChallengeDifficulty | null;
  language: ChallengeLanguage | null;
  searchQuery: string;
  sortBy: 'default' | 'difficulty' | 'xp' | 'time';
}

export const DEFAULT_FILTERS: ChallengeFilters = {
  category: null,
  difficulty: null,
  language: null,
  searchQuery: '',
  sortBy: 'default',
};

// ---------------------------------------------------------------------------
// Config
// ---------------------------------------------------------------------------

const CATEGORIES: { value: ChallengeCategory; labelKey: string }[] = [
  { value: 'solana-fundamentals', labelKey: 'solana_fundamentals' },
  { value: 'defi', labelKey: 'defi' },
  { value: 'nft-metaplex', labelKey: 'nft_metaplex' },
  { value: 'security', labelKey: 'security' },
  { value: 'token-extensions', labelKey: 'token_extensions' },
];

const DIFFICULTIES: { value: ChallengeDifficulty; labelKey: string }[] = [
  { value: 'beginner', labelKey: 'beginner' },
  { value: 'intermediate', labelKey: 'intermediate' },
  { value: 'advanced', labelKey: 'advanced' },
];

const LANGUAGES: { value: ChallengeLanguage; label: string }[] = [
  { value: 'rust', label: 'Rust' },
  { value: 'typescript', label: 'TypeScript' },
];

const SORT_OPTIONS = [
  { value: 'default', labelKey: 'sort_default' },
  { value: 'difficulty', labelKey: 'sort_difficulty' },
  { value: 'xp', labelKey: 'sort_xp' },
  { value: 'time', labelKey: 'sort_time' },
] as const;

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ChallengeFilterSidebarProps {
  filters: ChallengeFilters;
  onFilterChange: <K extends keyof ChallengeFilters>(key: K, value: ChallengeFilters[K]) => void;
  onReset: () => void;
  className?: string;
}

function countActive(filters: ChallengeFilters): number {
  let count = 0;
  if (filters.category) count++;
  if (filters.difficulty) count++;
  if (filters.language) count++;
  if (filters.searchQuery.trim()) count++;
  if (filters.sortBy !== 'default') count++;
  return count;
}

export function ChallengeFilterSidebar({
  filters,
  onFilterChange,
  onReset,
  className,
}: ChallengeFilterSidebarProps) {
  const t = useTranslations('challenges_page');
  const activeCount = countActive(filters);

  return (
    <aside className={cn('flex flex-col gap-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-semibold">{t('filters')}</h2>
          {activeCount > 0 && (
            <Badge variant="secondary" className="text-xs">
              {activeCount}
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
            {t('reset')}
          </Button>
        )}
      </div>

      <Separator />

      {/* Category */}
      <FilterSection title={t('category')}>
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map((cat) => {
            const isActive = filters.category === cat.value;
            return (
              <Button
                key={cat.value}
                variant={isActive ? 'default' : 'outline'}
                size="xs"
                onClick={() => onFilterChange('category', isActive ? null : cat.value)}
                className={cn('transition-colors', isActive && 'shadow-sm')}
              >
                {t(cat.labelKey)}
              </Button>
            );
          })}
        </div>
      </FilterSection>

      <Separator />

      {/* Difficulty */}
      <FilterSection title={t('difficulty')}>
        <div className="flex flex-wrap gap-1.5">
          {DIFFICULTIES.map((diff) => {
            const isActive = filters.difficulty === diff.value;
            return (
              <Button
                key={diff.value}
                variant={isActive ? 'default' : 'outline'}
                size="xs"
                onClick={() => onFilterChange('difficulty', isActive ? null : diff.value)}
                className={cn('transition-colors', isActive && 'shadow-sm')}
              >
                {t(diff.labelKey)}
              </Button>
            );
          })}
        </div>
      </FilterSection>

      <Separator />

      {/* Language */}
      <FilterSection title={t('language')}>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => {
            const isActive = filters.language === lang.value;
            return (
              <Button
                key={lang.value}
                variant={isActive ? 'default' : 'outline'}
                size="xs"
                onClick={() => onFilterChange('language', isActive ? null : lang.value)}
                className={cn('transition-colors', isActive && 'shadow-sm')}
              >
                {lang.label}
              </Button>
            );
          })}
        </div>
      </FilterSection>

      <Separator />

      {/* Sort */}
      <FilterSection title={t('sort')}>
        <Select
          value={filters.sortBy}
          onValueChange={(val) => onFilterChange('sortBy', val as ChallengeFilters['sortBy'])}
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

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider">
        {title}
      </h3>
      {children}
    </div>
  );
}
