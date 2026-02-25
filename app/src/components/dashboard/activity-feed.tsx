'use client';

import { useMemo } from 'react';
import {
  BookOpen,
  GraduationCap,
  Trophy,
  Flame,
  Code,
  Coins,
} from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { useUserStore } from '@/lib/stores/user-store';
import { useCourseStore } from '@/lib/stores/course-store';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ActivityType =
  | 'lesson_completed'
  | 'course_enrolled'
  | 'achievement_earned'
  | 'xp_earned'
  | 'streak_milestone'
  | 'challenge_completed';

interface ActivityEntry {
  id: string;
  type: ActivityType;
  description: string;
  timestamp: Date;
}

interface ActivityFeedProps {
  className?: string;
}

// ---------------------------------------------------------------------------
// Icon mapping
// ---------------------------------------------------------------------------

const ACTIVITY_ICON: Record<ActivityType, typeof BookOpen> = {
  lesson_completed: BookOpen,
  course_enrolled: GraduationCap,
  achievement_earned: Trophy,
  xp_earned: Coins,
  streak_milestone: Flame,
  challenge_completed: Code,
};

const ACTIVITY_COLOR: Record<ActivityType, string> = {
  lesson_completed: 'text-blue-500 bg-blue-500/10',
  course_enrolled: 'text-emerald-500 bg-emerald-500/10',
  achievement_earned: 'text-amber-500 bg-amber-500/10',
  xp_earned: 'text-yellow-500 bg-yellow-500/10',
  streak_milestone: 'text-orange-500 bg-orange-500/10',
  challenge_completed: 'text-violet-500 bg-violet-500/10',
};

// ---------------------------------------------------------------------------
// Relative time formatting
// ---------------------------------------------------------------------------

function formatRelativeTime(date: Date): string {
  const now = Date.now();
  const diffMs = now - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return 'Yesterday';
  if (diffDay < 7) return `${diffDay}d ago`;
  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

// ---------------------------------------------------------------------------
// Demo data seeding
// ---------------------------------------------------------------------------

function generateDemoActivities(): ActivityEntry[] {
  const now = Date.now();
  const hour = 3_600_000;

  return [
    {
      id: 'demo-1',
      type: 'lesson_completed',
      description: 'Completed "Intro to Solana Accounts"',
      timestamp: new Date(now - 2 * hour),
    },
    {
      id: 'demo-2',
      type: 'xp_earned',
      description: 'Earned 50 XP for lesson completion',
      timestamp: new Date(now - 2.1 * hour),
    },
    {
      id: 'demo-3',
      type: 'streak_milestone',
      description: 'Reached a 7-day learning streak',
      timestamp: new Date(now - 8 * hour),
    },
    {
      id: 'demo-4',
      type: 'challenge_completed',
      description: 'Solved "Token Transfer" challenge',
      timestamp: new Date(now - 24 * hour),
    },
    {
      id: 'demo-5',
      type: 'course_enrolled',
      description: 'Enrolled in "Anchor Framework Basics"',
      timestamp: new Date(now - 36 * hour),
    },
    {
      id: 'demo-6',
      type: 'achievement_earned',
      description: 'Earned "First Steps" achievement',
      timestamp: new Date(now - 48 * hour),
    },
    {
      id: 'demo-7',
      type: 'lesson_completed',
      description: 'Completed "PDAs & Seeds"',
      timestamp: new Date(now - 72 * hour),
    },
    {
      id: 'demo-8',
      type: 'xp_earned',
      description: 'Earned 100 XP milestone bonus',
      timestamp: new Date(now - 96 * hour),
    },
  ];
}

// ---------------------------------------------------------------------------
// Derive activity entries from store data
// ---------------------------------------------------------------------------

function deriveActivitiesFromStore(
  enrollments: Map<string, { courseId: string; completedLessons: number; isFinalized: boolean }>,
  achievements: string[],
  courses: { courseId: string; title: string }[],
): ActivityEntry[] {
  const entries: ActivityEntry[] = [];
  const now = Date.now();
  const hour = 3_600_000;
  let offset = 0;

  const courseMap = new Map(courses.map((c) => [c.courseId, c.title]));

  for (const [courseId, enrollment] of enrollments) {
    const title = courseMap.get(courseId) ?? courseId;

    entries.push({
      id: `enrolled-${courseId}`,
      type: 'course_enrolled',
      description: `Enrolled in "${title}"`,
      timestamp: new Date(now - (offset + 4) * hour),
    });

    if (enrollment.completedLessons > 0) {
      entries.push({
        id: `lessons-${courseId}`,
        type: 'lesson_completed',
        description: `Completed ${enrollment.completedLessons} lesson${enrollment.completedLessons > 1 ? 's' : ''} in "${title}"`,
        timestamp: new Date(now - (offset + 1) * hour),
      });
    }

    if (enrollment.isFinalized) {
      entries.push({
        id: `finalized-${courseId}`,
        type: 'xp_earned',
        description: `Finished "${title}" and earned XP`,
        timestamp: new Date(now - offset * hour),
      });
    }

    offset += 6;
  }

  for (const achievementId of achievements) {
    const name = achievementId.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    entries.push({
      id: `achievement-${achievementId}`,
      type: 'achievement_earned',
      description: `Earned "${name}" achievement`,
      timestamp: new Date(now - offset * hour),
    });
    offset += 3;
  }

  // Sort newest first
  entries.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  return entries;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

function ActivityItem({ entry }: { entry: ActivityEntry }) {
  const Icon = ACTIVITY_ICON[entry.type];
  const colorClass = ACTIVITY_COLOR[entry.type];

  return (
    <div className="flex items-start gap-3 py-2.5">
      <div
        className={cn(
          'flex size-8 shrink-0 items-center justify-center rounded-full',
          colorClass,
        )}
      >
        <Icon className="size-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm leading-snug truncate">{entry.description}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          {formatRelativeTime(entry.timestamp)}
        </p>
      </div>
    </div>
  );
}

export function ActivityFeed({ className }: ActivityFeedProps) {
  const t = useTranslations('dashboard');
  const enrollments = useUserStore((s) => s.enrollments);
  const achievements = useUserStore((s) => s.achievements);
  const courses = useCourseStore((s) => s.courses);

  const activities = useMemo(() => {
    const derived = deriveActivitiesFromStore(enrollments, achievements, courses);
    // If user has real data, show it; otherwise fall back to demo entries
    return derived.length > 0 ? derived : generateDemoActivities();
  }, [enrollments, achievements, courses]);

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pb-2 pt-4 px-4">
        <CardTitle className="text-sm">{t('recent_activity')}</CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        <ScrollArea className="h-[320px]">
          <div className="divide-y divide-border">
            {activities.map((entry) => (
              <ActivityItem key={entry.id} entry={entry} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
