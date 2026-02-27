'use client';

import { XPBalance, StreakData, UserAchievement, LeaderboardEntry } from '@/types/gamification';
import { XPDisplay, LevelBadge } from './XPDisplay';
import { StreakDisplay, StreakReminder } from './StreakDisplay';
import { AchievementProgress } from './AchievementDisplay';
import { LeaderboardMini } from './Leaderboard';
import { TrendingUp, Target, Zap, Flame } from 'lucide-react';

interface GamificationStatsProps {
  xp: XPBalance;
  streak: StreakData;
  achievements: UserAchievement[];
  leaderboard?: LeaderboardEntry[];
  userRank?: number;
  userId?: string;
  weeklyXP?: number;
  className?: string;
}

/**
 * Complete gamification stats widget for dashboard
 */
export function GamificationStats({
  xp,
  streak,
  achievements,
  leaderboard = [],
  userRank,
  userId,
  weeklyXP = 0,
  className = '',
}: GamificationStatsProps) {
  const unlockedAchievements = achievements.filter((a) => a.unlockedAt).length;

  // Parse lastActivityDate to Date if it's a string
  const lastActivity = streak.lastActivityDate ? new Date(streak.lastActivityDate) : null;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* XP and Level */}
      <XPDisplay xp={xp} weeklyXP={weeklyXP} showDetails size="md" />

      {/* Streak */}
      <StreakDisplay streak={streak} size="sm" />
      <StreakReminder lastActivityDate={lastActivity} />

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <QuickStat
          icon={<TrendingUp size={16} />}
          label="Weekly XP"
          value={weeklyXP.toLocaleString()}
          color="purple"
        />
        <QuickStat
          icon={<Target size={16} />}
          label="Rank"
          value={userRank ? `#${userRank}` : '-'}
          color="blue"
        />
        <QuickStat
          icon={<Zap size={16} />}
          label="Badges"
          value={unlockedAchievements.toString()}
          color="yellow"
        />
      </div>

      {/* Achievement Progress */}
      <AchievementProgress unlocked={unlockedAchievements} total={achievements.length} />

      {/* Mini Leaderboard */}
      {leaderboard.length > 0 && <LeaderboardMini entries={leaderboard} currentUserId={userId} />}
    </div>
  );
}

interface QuickStatProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  color: 'purple' | 'blue' | 'yellow' | 'green' | 'orange';
}

function QuickStat({ icon, label, value, color }: QuickStatProps) {
  const colorClasses = {
    purple: 'text-purple-400 bg-purple-900/30 border-purple-500/20',
    blue: 'text-blue-400 bg-blue-900/30 border-blue-500/20',
    yellow: 'text-yellow-400 bg-yellow-900/30 border-yellow-500/20',
    green: 'text-green-400 bg-green-900/30 border-green-500/20',
    orange: 'text-orange-400 bg-orange-900/30 border-orange-500/20',
  };

  return (
    <div className={`rounded-lg border p-3 text-center ${colorClasses[color]}`}>
      <div className="mb-1 flex justify-center">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-xs opacity-70">{label}</div>
    </div>
  );
}

interface GamificationHeaderProps {
  xp: XPBalance;
  streak: StreakData;
  className?: string;
}

/**
 * Compact gamification header for use in navigation
 */
export function GamificationHeader({ xp, streak, className = '' }: GamificationHeaderProps) {
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      {/* Level Badge */}
      <div className="flex items-center gap-2">
        <LevelBadge level={xp.level} size="sm" />
        <div className="text-xs">
          <div className="font-medium text-purple-300">{xp.total.toLocaleString()} XP</div>
          <div className="text-gray-400">Level {xp.level}</div>
        </div>
      </div>

      {/* Streak */}
      {streak.currentStreak > 0 && (
        <div className="flex items-center gap-1 text-sm text-orange-400">
          <Flame className="h-4 w-4" />
          <span>{streak.currentStreak}</span>
        </div>
      )}
    </div>
  );
}
