'use client';

import { useTranslations } from 'next-intl';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

const DIFFICULTY_CONFIG = [
  {
    key: 'beginner' as const,
    className: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/25',
  },
  {
    key: 'intermediate' as const,
    className: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/25',
  },
  {
    key: 'advanced' as const,
    className: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/25',
  },
] as const;

interface DifficultyBadgeProps {
  difficulty: number;
  className?: string;
}

export function DifficultyBadge({ difficulty, className }: DifficultyBadgeProps) {
  const t = useTranslations('courses');

  const config = DIFFICULTY_CONFIG[difficulty] ?? DIFFICULTY_CONFIG[0];

  return (
    <Badge
      variant="outline"
      className={cn(config.className, className)}
    >
      {t(config.key)}
    </Badge>
  );
}
