'use client';

import { xpProgress, formatXp } from '@/lib/program';

interface Props {
  xp: number;
  showBar?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export default function XpDisplay({ xp, showBar = true, size = 'md' }: Props) {
  const { level, currentXp, nextLevelXp, progress } = xpProgress(xp);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <div className={`flex items-center justify-center rounded-xl bg-gradient-to-br from-accent-500 to-brand-600 font-bold text-white ${
          size === 'sm' ? 'h-8 w-8 text-xs' : size === 'lg' ? 'h-14 w-14 text-xl' : 'h-10 w-10 text-sm'
        }`}>
          {level}
        </div>
        <div>
          <div className={`font-bold text-surface-50 ${size === 'lg' ? 'text-2xl' : 'text-lg'}`}>
            {formatXp(xp)} XP
          </div>
          <div className="text-xs text-surface-200">
            Level {level} · {formatXp(currentXp)}/{formatXp(nextLevelXp)} to next
          </div>
        </div>
      </div>

      {showBar && (
        <div className="h-2 w-full overflow-hidden rounded-full bg-surface-800">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-500 to-brand-500 transition-all duration-700"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      )}
    </div>
  );
}
