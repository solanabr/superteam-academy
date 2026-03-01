'use client';

import { useMemo } from 'react';
import {
  UserPlus,
  BookCheck,
  GraduationCap,
  Award,
  Trophy,
  ExternalLink,
  Radio,
  WifiOff,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { useProgramEvents } from '@/lib/hooks/use-program-events';
import type { ProgramEvent, ProgramEventType } from '@/lib/solana/events';
import { CLUSTER } from '@/lib/solana/constants';

const EVENT_CONFIG: Record<ProgramEventType, {
  icon: typeof UserPlus;
  label: string;
  color: string;
  bgColor: string;
}> = {
  EnrollmentCreated: {
    icon: UserPlus,
    label: 'Enrollment',
    color: 'text-blue-500',
    bgColor: 'bg-blue-500/15',
  },
  LessonCompleted: {
    icon: BookCheck,
    label: 'Lesson Completed',
    color: 'text-emerald-500',
    bgColor: 'bg-emerald-500/15',
  },
  CourseFinalized: {
    icon: GraduationCap,
    label: 'Course Finalized',
    color: 'text-violet-500',
    bgColor: 'bg-violet-500/15',
  },
  CredentialIssued: {
    icon: Award,
    label: 'Credential Issued',
    color: 'text-amber-500',
    bgColor: 'bg-amber-500/15',
  },
  AchievementAwarded: {
    icon: Trophy,
    label: 'Achievement',
    color: 'text-pink-500',
    bgColor: 'bg-pink-500/15',
  },
};

function explorerUrl(signature: string): string {
  const base = 'https://explorer.solana.com/tx';
  return `${base}/${signature}?cluster=${CLUSTER}`;
}

function formatTimestamp(ts: number): string {
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);

  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function getEventDescription(event: ProgramEvent): string {
  switch (event.type) {
    case 'EnrollmentCreated':
      return `${event.learner} enrolled in ${event.courseId}`;
    case 'LessonCompleted':
      return `${event.learner} completed lesson ${event.lessonIndex + 1} of ${event.courseId} (+${event.xpAwarded} XP)`;
    case 'CourseFinalized':
      return `${event.learner} finalized ${event.courseId} (+${event.totalXp} XP)`;
    case 'CredentialIssued':
      return `Credential issued to ${event.recipient} for ${event.courseId}`;
    case 'AchievementAwarded':
      return `${event.recipient} earned "${event.achievementId}" (+${event.xpAwarded} XP)`;
  }
}

interface TransactionHistoryProps {
  className?: string;
}

export function TransactionHistory({ className }: TransactionHistoryProps) {
  const { events, isListening, error } = useProgramEvents();

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => b.timestamp - a.timestamp),
    [events],
  );

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">Transaction History</CardTitle>
            {isListening ? (
              <Badge variant="outline" className="gap-1 text-[10px] border-emerald-500/25 text-emerald-600 dark:text-emerald-400">
                <Radio className="size-2.5 animate-pulse" />
                Live
              </Badge>
            ) : error ? (
              <Badge variant="outline" className="gap-1 text-[10px] border-amber-500/25 text-amber-600 dark:text-amber-400">
                <WifiOff className="size-2.5" />
                Mock
              </Badge>
            ) : null}
          </div>
          <span className="text-xs text-muted-foreground">
            {events.length} event{events.length !== 1 ? 's' : ''}
          </span>
        </div>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {sortedEvents.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            No events yet. Transactions will appear here in real time.
          </p>
        ) : (
          <div className="space-y-1">
            {sortedEvents.map((event, idx) => {
              const config = EVENT_CONFIG[event.type];
              const EventIcon = config.icon;
              const description = getEventDescription(event);

              return (
                <div
                  key={`${event.signature}-${idx}`}
                  className="flex items-start gap-3 rounded-lg px-3 py-2.5 transition-colors hover:bg-muted/50"
                >
                  <div
                    className={cn(
                      'mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg',
                      config.bgColor,
                    )}
                  >
                    <EventIcon className={cn('size-3.5', config.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{config.label}</p>
                    <p className="mt-0.5 truncate text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 shrink-0">
                    <span className="text-[10px] text-muted-foreground tabular-nums">
                      {formatTimestamp(event.timestamp)}
                    </span>
                    <a
                      href={explorerUrl(event.signature)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-0.5 text-[10px] text-primary hover:underline"
                    >
                      Explorer
                      <ExternalLink className="size-2.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
