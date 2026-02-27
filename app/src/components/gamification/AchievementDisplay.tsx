'use client';

import {
  Achievement,
  UserAchievement,
  AchievementRarity,
  getRarityColor,
  ACHIEVEMENTS,
} from '@/types/gamification';
import { Trophy, Lock, Star } from 'lucide-react';
import { getLucideIcon } from '@/lib/icon-utils';

// Extended type for display purposes - combines Achievement metadata with unlock status
export interface DisplayAchievement extends Achievement {
  unlockedAt?: Date;
  nftMintAddress?: string;
}

// Helper to create display achievements from user achievements
export function createDisplayAchievements(
  userAchievements: UserAchievement[],
  allAchievements: Achievement[] = ACHIEVEMENTS
): DisplayAchievement[] {
  const userAchMap = new Map(userAchievements.map((ua) => [ua.achievementId, ua]));

  return allAchievements.map((achievement) => {
    const userAch = userAchMap.get(achievement.id);
    return {
      ...achievement,
      unlockedAt: userAch?.unlockedAt,
      nftMintAddress: userAch?.nftMintAddress,
    };
  });
}

// Rarity color helper that returns an object with color properties
function getRarityColorObject(rarity: AchievementRarity): {
  bg: string;
  border: string;
  shadow: string;
} {
  switch (rarity) {
    case 'common':
      return { bg: 'rgb(107, 114, 128)', border: 'rgb(156, 163, 175)', shadow: 'gray' };
    case 'uncommon':
      return { bg: 'rgb(34, 197, 94)', border: 'rgb(74, 222, 128)', shadow: 'green' };
    case 'rare':
      return { bg: 'rgb(59, 130, 246)', border: 'rgb(96, 165, 250)', shadow: 'blue' };
    case 'epic':
      return { bg: 'rgb(168, 85, 247)', border: 'rgb(192, 132, 252)', shadow: 'purple' };
    case 'legendary':
      return { bg: 'rgb(234, 179, 8)', border: 'rgb(250, 204, 21)', shadow: 'yellow' };
    default:
      return { bg: 'rgb(107, 114, 128)', border: 'rgb(156, 163, 175)', shadow: 'gray' };
  }
}

interface AchievementCardProps {
  achievement: DisplayAchievement;
  size?: 'sm' | 'md' | 'lg';
  onClick?: () => void;
  className?: string;
}

/**
 * Card displaying a single achievement
 */
export function AchievementCard({
  achievement,
  size = 'md',
  onClick,
  className = '',
}: AchievementCardProps) {
  const isUnlocked = !!achievement.unlockedAt;
  const rarityColor = getRarityColorObject(achievement.rarity);

  const sizeClasses = {
    sm: {
      container: 'p-2',
      icon: 20,
      title: 'text-xs',
      desc: 'text-[10px]',
    },
    md: {
      container: 'p-3',
      icon: 24,
      title: 'text-sm',
      desc: 'text-xs',
    },
    lg: {
      container: 'p-4',
      icon: 32,
      title: 'text-base',
      desc: 'text-sm',
    },
  };

  const styles = sizeClasses[size];

  return (
    <div
      className={`relative rounded-lg border transition-all ${
        isUnlocked
          ? 'hover:shadow-lg'
          : 'border-gray-700 bg-gray-900/50 opacity-60 hover:opacity-80'
      } ${styles.container} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      onClick={onClick}
      style={
        isUnlocked
          ? {
              background: `linear-gradient(135deg, ${rarityColor.bg}20, transparent)`,
              borderColor: rarityColor.border,
            }
          : undefined
      }
    >
      {/* Rarity indicator */}
      {isUnlocked && (
        <div
          className="absolute top-1 right-1 h-2 w-2 rounded-full"
          style={{ backgroundColor: rarityColor.border }}
          title={achievement.rarity}
        />
      )}

      <div className="flex items-start gap-3">
        <div className={isUnlocked ? '' : 'grayscale'}>
          {isUnlocked ? (
            (() => {
              const Icon = getLucideIcon(achievement.icon);
              return <Icon size={styles.icon} />;
            })()
          ) : (
            <Lock size={styles.icon} className="text-gray-500" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div
            className={`${styles.title} font-semibold ${isUnlocked ? 'text-white' : 'text-gray-400'}`}
          >
            {achievement.name}
          </div>
          <div
            className={`${styles.desc} ${isUnlocked ? 'text-gray-300' : 'text-gray-500'} line-clamp-2`}
          >
            {achievement.description}
          </div>

          {/* XP reward */}
          <div className={`${styles.desc} mt-1 flex items-center gap-1`}>
            <Star size={12} className={isUnlocked ? 'text-yellow-400' : 'text-gray-600'} />
            <span className={isUnlocked ? 'text-yellow-400' : 'text-gray-600'}>
              {achievement.xpReward} XP
            </span>
          </div>
        </div>
      </div>

      {/* Unlock date */}
      {isUnlocked && achievement.unlockedAt && (
        <div className="mt-2 text-[10px] text-gray-400">
          Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
        </div>
      )}
    </div>
  );
}

interface AchievementGridProps {
  achievements: DisplayAchievement[];
  columns?: 2 | 3 | 4;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Grid of achievement cards
 */
export function AchievementGrid({
  achievements,
  columns = 3,
  size = 'md',
  className = '',
}: AchievementGridProps) {
  const columnClasses = {
    2: 'grid-cols-2',
    3: 'grid-cols-2 md:grid-cols-3',
    4: 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4',
  };

  return (
    <div className={`grid ${columnClasses[columns]} gap-3 ${className}`}>
      {achievements.map((achievement) => (
        <AchievementCard key={achievement.id} achievement={achievement} size={size} />
      ))}
    </div>
  );
}

interface AchievementProgressProps {
  unlocked: number;
  total: number;
  className?: string;
}

/**
 * Overall achievement progress bar
 */
export function AchievementProgress({ unlocked, total, className = '' }: AchievementProgressProps) {
  const percentage = total > 0 ? Math.round((unlocked / total) * 100) : 0;

  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-900/50 p-4 ${className}`}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <span className="font-medium text-white">Achievements</span>
        </div>
        <span className="font-bold text-yellow-400">
          {unlocked} / {total}
        </span>
      </div>

      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-800">
        <div
          className="h-2 rounded-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <div className="mt-1 text-right text-xs text-gray-400">{percentage}% complete</div>
    </div>
  );
}

interface AchievementUnlockModalProps {
  achievement: Achievement;
  onClose: () => void;
}

/**
 * Modal shown when user unlocks a new achievement
 */
export function AchievementUnlockModal({ achievement, onClose }: AchievementUnlockModalProps) {
  const rarityColor = getRarityColorObject(achievement.rarity);

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/80">
      <div
        className="animate-scale-in relative mx-4 max-w-sm rounded-2xl border-2 bg-gradient-to-br from-gray-900 to-gray-800 p-8 text-center"
        style={{ borderColor: rarityColor.border }}
      >
        {/* Glow effect */}
        <div
          className="absolute inset-0 rounded-2xl opacity-30 blur-xl"
          style={{ background: rarityColor.bg }}
        />

        <div className="relative">
          <div className="mb-2 text-xs tracking-wider text-gray-400 uppercase">
            Achievement Unlocked!
          </div>

          <div className="mb-4">
            {(() => {
              const Icon = getLucideIcon(achievement.icon);
              return <Icon className="mx-auto h-14 w-14" />;
            })()}
          </div>

          <h3 className="mb-2 text-xl font-bold text-white">{achievement.name}</h3>

          <p className="mb-4 text-sm text-gray-300">{achievement.description}</p>

          <div
            className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium"
            style={{ backgroundColor: `${rarityColor.bg}30`, color: rarityColor.border }}
          >
            <Star size={16} />
            <span>+{achievement.xpReward} XP</span>
          </div>

          <button
            onClick={onClose}
            className="mt-6 w-full rounded-lg bg-white/10 py-3 text-white transition-colors hover:bg-white/20"
          >
            Awesome!
          </button>
        </div>
      </div>
    </div>
  );
}
