'use client';

import { StreakData, StreakDay, STREAK_MILESTONES } from '@/types/gamification';
import { Flame, Calendar, Award, Check } from 'lucide-react';

interface StreakDisplayProps {
  streak: StreakData;
  showCalendar?: boolean;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * Display user's current streak and activity calendar
 */
export function StreakDisplay({
  streak,
  showCalendar = false,
  size = 'md',
  className = '',
}: StreakDisplayProps) {
  const sizeClasses = {
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
  };

  const iconSizes = {
    sm: 16,
    md: 20,
    lg: 28,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  // Get next milestone
  const nextMilestone = STREAK_MILESTONES.find((m) => m.days > streak.currentStreak);
  const prevMilestone = [...STREAK_MILESTONES]
    .reverse()
    .find((m) => m.days <= streak.currentStreak);

  // Calculate streak color based on length
  const getStreakColor = (days: number) => {
    if (days >= 30) return 'text-orange-400';
    if (days >= 14) return 'text-yellow-400';
    if (days >= 7) return 'text-amber-400';
    if (days >= 3) return 'text-red-400';
    return 'text-gray-400';
  };

  return (
    <div
      className={`rounded-xl border border-orange-500/20 bg-gradient-to-br from-orange-900/30 to-red-900/30 ${sizeClasses[size]} ${className}`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={`${getStreakColor(streak.currentStreak)}`}>
            <Flame size={iconSizes[size]} className="animate-pulse" />
          </div>
          <div>
            <div className={`${textSizes[size]} font-bold ${getStreakColor(streak.currentStreak)}`}>
              {streak.currentStreak}
            </div>
            <div className="text-xs text-orange-300">day streak</div>
          </div>
        </div>

        <div className="text-right">
          <div className="text-sm text-orange-200">Best: {streak.longestStreak} days</div>
          {nextMilestone && (
            <div className="text-xs text-orange-400">
              {nextMilestone.days - streak.currentStreak} days to {nextMilestone.name}
            </div>
          )}
        </div>
      </div>

      {prevMilestone && streak.currentStreak > 0 && (
        <div className="mt-3 flex items-center gap-2 text-xs text-orange-300">
          <Award size={14} />
          <span>
            Current: {prevMilestone.name} (+{prevMilestone.xpReward} XP bonus)
          </span>
        </div>
      )}

      {showCalendar && (
        <div className="mt-4">
          <StreakCalendar streakHistory={streak.streakHistory} />
        </div>
      )}
    </div>
  );
}

interface StreakCalendarProps {
  streakHistory: StreakDay[];
  weeks?: number;
  className?: string;
}

/**
 * GitHub-style activity calendar for streaks
 */
export function StreakCalendar({ streakHistory, weeks = 12, className = '' }: StreakCalendarProps) {
  // Generate last N weeks of dates
  const today = new Date();
  const dates: Date[] = [];

  for (let i = weeks * 7 - 1; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    dates.push(date);
  }

  // Group by weeks
  const weekGroups: Date[][] = [];
  for (let i = 0; i < dates.length; i += 7) {
    weekGroups.push(dates.slice(i, i + 7));
  }

  // Format date as YYYY-MM-DD for comparison
  const formatDate = (date: Date) =>
    `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

  // Create a set of active days from streak history
  const activeDaysSet = new Set(
    streakHistory.filter((day) => day.hasActivity).map((day) => day.date)
  );

  const isActive = (date: Date) => activeDaysSet.has(formatDate(date));
  const isToday = (date: Date) => formatDate(date) === formatDate(today);

  return (
    <div className={`${className}`}>
      <div className="mb-2 flex items-center gap-2 text-xs text-orange-400">
        <Calendar size={14} />
        <span>Activity Calendar</span>
      </div>

      <div className="flex gap-1">
        {weekGroups.map((week, weekIndex) => (
          <div key={weekIndex} className="flex flex-col gap-1">
            {week.map((date, dayIndex) => {
              const active = isActive(date);
              const todayClass = isToday(date);

              return (
                <div
                  key={dayIndex}
                  className={`h-3 w-3 rounded-sm transition-colors ${
                    active
                      ? 'bg-orange-500 hover:bg-orange-400'
                      : 'bg-orange-950/50 hover:bg-orange-900/50'
                  } ${todayClass ? 'ring-1 ring-orange-400' : ''}`}
                  title={`${formatDate(date)}${active ? ' - Active' : ''}`}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-2 flex items-center justify-between text-xs text-orange-500">
        <span>{weeks} weeks ago</span>
        <span>Today</span>
      </div>
    </div>
  );
}

interface StreakReminderProps {
  lastActivityDate: Date | null;
  className?: string;
}

/**
 * Reminder if user hasn't been active today
 */
export function StreakReminder({ lastActivityDate, className = '' }: StreakReminderProps) {
  const today = new Date().toDateString();
  const lastActive = lastActivityDate ? new Date(lastActivityDate).toDateString() : null;
  const isActiveToday = lastActive === today;

  if (isActiveToday) {
    return (
      <div className={`flex items-center gap-2 text-sm text-green-400 ${className}`}>
        <Flame size={16} />
        <span className="flex items-center gap-1">
          Streak secured for today!
          <Check size={14} />
        </span>
      </div>
    );
  }

  return (
    <div className={`flex animate-pulse items-center gap-2 text-sm text-orange-400 ${className}`}>
      <Flame size={16} />
      <span>Complete a lesson to maintain your streak!</span>
    </div>
  );
}
