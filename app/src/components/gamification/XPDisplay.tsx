'use client';

import { XPBalance, calculateLevel, xpForLevel } from '@/types/gamification';

interface XPDisplayProps {
  xp: XPBalance;
  weeklyXP?: number;
  showDetails?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Display user's XP, level, and progress
 */
export function XPDisplay({
  xp,
  weeklyXP = 0,
  showDetails = false,
  size = 'md',
  className = '',
}: XPDisplayProps) {
  const sizeClasses = {
    sm: {
      container: 'p-3',
      level: 'text-lg',
      xp: 'text-xs',
      bar: 'h-1.5',
    },
    md: {
      container: 'p-4',
      level: 'text-2xl',
      xp: 'text-sm',
      bar: 'h-2',
    },
    lg: {
      container: 'p-6',
      level: 'text-4xl',
      xp: 'text-base',
      bar: 'h-3',
    },
  };

  const styles = sizeClasses[size];
  const xpNeededForNextLevel = xp.nextLevelXp - xp.currentLevelXp;
  const xpInCurrentLevel = xp.total - xp.currentLevelXp;

  return (
    <div
      className={`rounded-xl border border-purple-500/20 bg-gradient-to-br from-purple-900/50 to-blue-900/50 ${styles.container} ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className={`${styles.level} bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text font-bold text-transparent`}
            >
              {xp.level}
            </div>
            <span className="absolute -top-1 -right-2 text-[10px] font-medium text-purple-300">
              LVL
            </span>
          </div>
          <div className="h-8 w-px bg-purple-500/30" />
          <div>
            <div className={`${styles.xp} font-medium text-purple-200`}>
              {xp.total.toLocaleString()} XP
            </div>
            {showDetails && (
              <div className="text-xs text-purple-400">
                {xpInCurrentLevel.toLocaleString()} / {xpNeededForNextLevel.toLocaleString()} to
                next level
              </div>
            )}
          </div>
        </div>

        {weeklyXP > 0 && (
          <div className="text-right">
            <div className="text-xs font-medium text-green-400">
              +{weeklyXP.toLocaleString()} this week
            </div>
          </div>
        )}
      </div>

      {/* Progress bar */}
      <div className={`w-full rounded-full bg-purple-950/50 ${styles.bar} overflow-hidden`}>
        <div
          className={`${styles.bar} rounded-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-500 ease-out`}
          style={{ width: `${xp.progressPercent}%` }}
        />
      </div>

      {showDetails && (
        <div className="mt-2 flex justify-between text-xs text-purple-400">
          <span>Level {xp.level}</span>
          <span>{xp.progressPercent}%</span>
          <span>Level {xp.level + 1}</span>
        </div>
      )}
    </div>
  );
}

interface LevelBadgeProps {
  level: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Circular badge showing user's level
 */
export function LevelBadge({ level, size = 'md', className = '' }: LevelBadgeProps) {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-lg',
    lg: 'w-16 h-16 text-2xl',
  };

  // Color based on level ranges
  const getLevelColor = (lvl: number) => {
    if (lvl >= 50) return 'from-yellow-400 to-orange-500'; // Legendary
    if (lvl >= 30) return 'from-purple-400 to-pink-500'; // Epic
    if (lvl >= 15) return 'from-blue-400 to-cyan-500'; // Rare
    if (lvl >= 5) return 'from-green-400 to-emerald-500'; // Uncommon
    return 'from-gray-400 to-gray-500'; // Common
  };

  return (
    <div
      className={`${sizeClasses[size]} flex items-center justify-center rounded-full bg-gradient-to-br ${getLevelColor(level)} font-bold text-white shadow-lg ${className}`}
      title={`Level ${level}`}
    >
      {level}
    </div>
  );
}

interface XPGainAnimationProps {
  amount: number;
  onComplete?: () => void;
}

/**
 * Animated XP gain notification
 */
export function XPGainAnimation({ amount, onComplete }: XPGainAnimationProps) {
  return (
    <div
      className="fixed top-1/4 left-1/2 z-50 -translate-x-1/2 animate-bounce"
      onAnimationEnd={onComplete}
    >
      <div className="rounded-full bg-gradient-to-r from-purple-600 to-blue-600 px-6 py-3 text-lg font-bold text-white shadow-xl">
        +{amount} XP
      </div>
    </div>
  );
}
