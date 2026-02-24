'use client';

import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export type TimeRange = 'all_time' | 'monthly' | 'weekly';

interface TimeFilterProps {
  activeFilter: TimeRange;
  onChange: (filter: TimeRange) => void;
  totalParticipants?: number;
  className?: string;
}

const FILTERS: { key: TimeRange; translationKey: string }[] = [
  { key: 'all_time', translationKey: 'all_time' },
  { key: 'monthly', translationKey: 'monthly' },
  { key: 'weekly', translationKey: 'weekly' },
];

export function TimeFilter({
  activeFilter,
  onChange,
  totalParticipants,
  className,
}: TimeFilterProps) {
  const t = useTranslations('leaderboard');

  return (
    <div className={cn('flex items-center gap-3', className)}>
      <div className="inline-flex rounded-lg bg-muted p-1" role="tablist">
        {FILTERS.map(({ key, translationKey }) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={activeFilter === key}
            onClick={() => onChange(key)}
            className={cn(
              'rounded-md px-3 py-1.5 text-sm font-medium transition-all',
              activeFilter === key
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {t(translationKey)}
          </button>
        ))}
      </div>
      {totalParticipants !== undefined && totalParticipants > 0 && (
        <Badge variant="secondary" className="text-xs tabular-nums">
          {totalParticipants.toLocaleString()} learners
        </Badge>
      )}
    </div>
  );
}
