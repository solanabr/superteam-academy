# Streak Service

## Overview

The Streak Service tracks consecutive days of learning activity. This is a **frontend-only feature** - streaks are not tracked on-chain.

## Features

- Track consecutive days with activity
- Visual calendar showing streak history
- Streak freeze (skip one day)
- Milestone rewards at 7, 30, 100 days
- Local storage + database backup

## Data Types

```typescript
// types/streak.ts
export interface Streak {
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: string; // YYYY-MM-DD
  streakHistory: StreakDay[];
  freezeCount: number;
  maxFreezes: number;
}

export interface StreakDay {
  date: string;
  xpEarned: number;
  lessonsCompleted: number;
  coursesCompleted: number;
}

export interface StreakMilestone {
  days: number;
  xpReward: number;
  achievement?: string;
  claimed: boolean;
}

export const STREAK_MILESTONES: StreakMilestone[] = [
  { days: 7, xpReward: 100, achievement: 'week-warrior' },
  { days: 30, xpReward: 500, achievement: 'monthly-master' },
  { days: 100, xpReward: 2000, achievement: 'consistency-king' },
  { days: 365, xpReward: 10000, achievement: 'year-legend' },
];
```

## Implementation

### 1. Streak Service Interface

```typescript
// services/streak-service.ts
import { Streak, StreakDay, StreakMilestone, STREAK_MILESTONES } from '@/types/streak';

const STREAK_KEY = 'streak_data';
const MAX_FREEZES = 3;

export interface IStreakService {
  getStreak(userId: string): Promise<Streak>;
  recordActivity(userId: string, data: Partial<StreakDay>): Promise<Streak>;
  useFreeze(userId: string): Promise<Streak>;
  getMilestones(userId: string): Promise<StreakMilestone[]>;
  claimMilestone(userId: string, days: number): Promise<void>;
}

export class LocalStreakService implements IStreakService {
  async getStreak(userId: string): Promise<Streak> {
    const data = localStorage.getItem(`${STREAK_KEY}_${userId}`);
    if (data) {
      return JSON.parse(data);
    }
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastActivityDate: '',
      streakHistory: [],
      freezeCount: MAX_FREEZES,
    };
  }
  
  async recordActivity(userId: string, data: Partial<StreakDay>): Promise<Streak> {
    const streak = await this.getStreak(userId);
    const today = this.getToday();
    
    // Already recorded today
    if (streak.lastActivityDate === today) {
      // Update today's data
      const todayIndex = streak.streakHistory.findIndex(d => d.date === today);
      if (todayIndex >= 0) {
        streak.streakHistory[todayIndex] = {
          ...streak.streakHistory[todayIndex],
          xpEarned: (streak.streakHistory[todayIndex].xpEarned || 0) + (data.xpEarned || 0),
          lessonsCompleted: (streak.streakHistory[todayIndex].lessonsCompleted || 0) + (data.lessonsCompleted || 0),
          coursesCompleted: (streak.streakHistory[todayIndex].coursesCompleted || 0) + (data.coursesCompleted || 0),
        };
      }
      this.saveStreak(userId, streak);
      return streak;
    }
    
    const yesterday = this.getYesterday();
    
    // Check if streak continues
    if (streak.lastActivityDate === yesterday) {
      // Continue streak
      streak.currentStreak++;
    } else if (streak.lastActivityDate !== today) {
      // Streak broken - check for freeze
      const daysMissed = this.getDaysBetween(streak.lastActivityDate, today);
      
      if (daysMissed === 2 && streak.freezeCount > 0) {
        // Auto-use freeze if only missed one day
        streak.freezeCount--;
      } else {
        // Streak broken
        streak.currentStreak = 1;
      }
    }
    
    // Update longest streak
    if (streak.currentStreak > streak.longestStreak) {
      streak.longestStreak = streak.currentStreak;
    }
    
    // Add today's entry
    streak.streakHistory.push({
      date: today,
      xpEarned: data.xpEarned || 0,
      lessonsCompleted: data.lessonsCompleted || 0,
      coursesCompleted: data.coursesCompleted || 0,
    });
    
    // Keep only last 365 days
    streak.streakHistory = streak.streakHistory.slice(-365);
    
    streak.lastActivityDate = today;
    
    this.saveStreak(userId, streak);
    
    // Check for milestone
    this.checkMilestone(userId, streak);
    
    return streak;
  }
  
  async useFreeze(userId: string): Promise<Streak> {
    const streak = await this.getStreak(userId);
    
    if (streak.freezeCount <= 0) {
      throw new Error('No streak freezes available');
    }
    
    streak.freezeCount--;
    this.saveStreak(userId, streak);
    
    return streak;
  }
  
  async getMilestones(userId: string): Promise<StreakMilestone[]> {
    const streak = await this.getStreak(userId);
    const claimedKey = `${STREAK_KEY}_${userId}_claimed`;
    const claimed = JSON.parse(localStorage.getItem(claimedKey) || '[]');
    
    return STREAK_MILESTONES.map(m => ({
      ...m,
      claimed: claimed.includes(m.days) || streak.currentStreak < m.days,
    }));
  }
  
  async claimMilestone(userId: string, days: number): Promise<void> {
    const streak = await this.getStreak(userId);
    const milestone = STREAK_MILESTONES.find(m => m.days === days);
    
    if (!milestone) {
      throw new Error('Invalid milestone');
    }
    
    if (streak.currentStreak < days) {
      throw new Error('Milestone not reached');
    }
    
    const claimedKey = `${STREAK_KEY}_${userId}_claimed`;
    const claimed = JSON.parse(localStorage.getItem(claimedKey) || '[]');
    
    if (claimed.includes(days)) {
      throw new Error('Milestone already claimed');
    }
    
    claimed.push(days);
    localStorage.setItem(claimedKey, JSON.stringify(claimed));
    
    // Award XP (stub - would call XP service)
    console.log(`Awarding ${milestone.xpReward} XP for ${days} day streak`);
    
    // Award achievement if exists
    if (milestone.achievement) {
      console.log(`Awarding achievement: ${milestone.achievement}`);
    }
  }
  
  private saveStreak(userId: string, streak: Streak): void {
    localStorage.setItem(`${STREAK_KEY}_${userId}`, JSON.stringify(streak));
  }
  
  private getToday(): string {
    return new Date().toISOString().split('T')[0];
  }
  
  private getYesterday(): string {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  }
  
  private getDaysBetween(date1: string, date2: string): number {
    const d1 = new Date(date1);
    const d2 = new Date(date2);
    const diffTime = Math.abs(d2.getTime() - d1.getTime());
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  
  private checkMilestone(userId: string, streak: Streak): void {
    STREAK_MILESTONES.forEach(milestone => {
      if (streak.currentStreak === milestone.days) {
        console.log(`Milestone reached: ${milestone.days} days!`);
        // Could show notification
      }
    });
  }
}

export const streakService = new LocalStreakService();
```

### 2. Streak Hook

```typescript
// hooks/useStreak.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { streakService } from '@/services/streak-service';
import { useAuth } from './useAuth';

export function useStreak() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const streak = useQuery({
    queryKey: ['streak', user?.id],
    queryFn: () => streakService.getStreak(user!.id),
    enabled: !!user?.id,
  });
  
  const milestones = useQuery({
    queryKey: ['milestones', user?.id],
    queryFn: () => streakService.getMilestones(user!.id),
    enabled: !!user?.id,
  });
  
  const recordActivity = useMutation({
    mutationFn: (data: { xpEarned?: number; lessonsCompleted?: number; coursesCompleted?: number }) =>
      streakService.recordActivity(user!.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
  
  const useFreeze = useMutation({
    mutationFn: () => streakService.useFreeze(user!.id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['streak'] });
    },
  });
  
  const claimMilestone = useMutation({
    mutationFn: (days: number) => streakService.claimMilestone(user!.id, days),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones'] });
    },
  });
  
  return {
    streak: streak.data,
    isLoading: streak.isLoading,
    milestones: milestones.data,
    recordActivity,
    useFreeze,
    claimMilestone,
  };
}
```

### 3. Streak Calendar Component

```typescript
// components/streak/StreakCalendar.tsx
'use client';

import { Streak, StreakDay } from '@/types/streak';

interface StreakCalendarProps {
  streak: Streak;
}

export function StreakCalendar({ streak }: StreakCalendarProps) {
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth();
  
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  
  const activityMap = new Map<string, StreakDay>();
  streak.streakHistory.forEach(day => {
    activityMap.set(day.date, day);
  });
  
  const days = [];
  
  // Empty cells for days before month starts
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(<div key={`empty-${i}`} className="day empty" />);
  }
  
  // Days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    const date = new Date(year, month, day);
    const dateStr = date.toISOString().split('T')[0];
    const activity = activityMap.get(dateStr);
    const isToday = dateStr === today.toISOString().split('T')[0];
    const isFuture = date > today;
    
    let level = 0;
    if (activity) {
      const totalXp = activity.xpEarned;
      if (totalXp > 100) level = 4;
      else if (totalXp > 50) level = 3;
      else if (totalXp > 25) level = 2;
      else if (totalXp > 0) level = 1;
    }
    
    days.push(
      <div
        key={day}
        className={`day ${isToday ? 'today' : ''} ${isFuture ? 'future' : ''} level-${level}`}
        title={activity ? `${activity.xpEarned} XP earned` : ''}
      >
        {day}
      </div>
    );
  }
  
  return (
    <div className="streak-calendar">
      <div className="calendar-header">
        <span className="month-name">
          {today.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </span>
      </div>
      
      <div className="calendar-weekdays">
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
          <div key={d} className="weekday">{d}</div>
        ))}
      </div>
      
      <div className="calendar-grid">
        {days}
      </div>
      
      <div className="calendar-legend">
        <span>Less</span>
        <div className="legend-colors">
          <div className="level-0" />
          <div className="level-1" />
          <div className="level-2" />
          <div className="level-3" />
          <div className="level-4" />
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
```

### 4. Streak Display Component

```typescript
// components/streak/StreakDisplay.tsx
'use client';

import { useStreak } from '@/hooks/useStreak';
import { StreakCalendar } from './StreakCalendar';
import { Card } from '@/components/ui/card';

export function StreakDisplay() {
  const { streak, isLoading, milestones, claimMilestone } = useStreak();
  
  if (isLoading || !streak) {
    return <div>Loading...</div>;
  }
  
  return (
    <Card className="streak-display">
      <div className="streak-header">
        <div className="current-streak">
          <span className="flame">🔥</span>
          <span className="count">{streak.currentStreak}</span>
          <span className="label">day streak</span>
        </div>
        
        <div className="streak-stats">
          <div className="stat">
            <span className="value">{streak.longestStreak}</span>
            <span className="label">Longest</span>
          </div>
          <div className="stat">
            <span className="value">{streak.freezeCount}</span>
            <span className="label">Freezes</span>
          </div>
        </div>
      </div>
      
      <StreakCalendar streak={streak} />
      
      <div className="milestones">
        <h4>Milestones</h4>
        <div className="milestone-list">
          {milestones?.map(m => (
            <div key={m.days} className={`milestone ${m.claimed ? 'claimed' : ''}`}>
              <span className="days">{m.days} days</span>
              <span className="reward">{m.xpReward} XP</span>
              {!m.claimed && streak.currentStreak >= m.days && (
                <button onClick={() => claimMilestone.mutate(m.days)}>
                  Claim
                </button>
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
```

## XP Rewards

| Action | XP |
|--------|-----|
| Daily activity | 10 XP |
| First completion of the day | 25 XP |
| 7-day streak | 100 XP |
| 30-day streak | 500 XP |
| 100-day streak | 2000 XP |
| 365-day streak | 10000 XP |

## Streak Freeze Rules

- Maximum 3 freezes available
- Regenerate 1 freeze per 30 days of activity
- Auto-used if only 1 day missed
- Cannot use freeze if 2+ days missed
