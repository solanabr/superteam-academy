'use client';

import {
  UserPlus,
  CheckCircle2,
  Award,
  Medal,
  BookOpen,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

type ActivityType =
  | 'enrollment'
  | 'completion'
  | 'credential'
  | 'achievement'
  | 'course_created';

interface Activity {
  id: string;
  type: ActivityType;
  description: string;
  wallet: string;
  timestamp: string;
}

const ACTIVITY_CONFIG: Record<
  ActivityType,
  { icon: LucideIcon; color: string; bg: string }
> = {
  enrollment: {
    icon: UserPlus,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },
  completion: {
    icon: CheckCircle2,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  credential: {
    icon: Award,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950',
  },
  achievement: {
    icon: Medal,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-950',
  },
  course_created: {
    icon: BookOpen,
    color: 'text-rose-600 dark:text-rose-400',
    bg: 'bg-rose-100 dark:bg-rose-950',
  },
};

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function timeAgo(timestamp: string): string {
  const now = new Date();
  const then = new Date(timestamp);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours}h ago`;
  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}d ago`;
}

const MOCK_ACTIVITIES: Activity[] = [
  {
    id: '1',
    type: 'enrollment',
    description: 'Enrolled in "Solana Fundamentals"',
    wallet: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 3 * 60000).toISOString(),
  },
  {
    id: '2',
    type: 'completion',
    description: 'Completed "Intro to Anchor"',
    wallet: '7nYK3PxJK9fBV2sMq6drKcMY2wZtNkhVDHWpC4tfJe93',
    timestamp: new Date(Date.now() - 12 * 60000).toISOString(),
  },
  {
    id: '3',
    type: 'credential',
    description: 'Credential issued for "DeFi Developer"',
    wallet: 'Bx3M9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 25 * 60000).toISOString(),
  },
  {
    id: '4',
    type: 'achievement',
    description: 'Unlocked "First Blood" achievement',
    wallet: 'C4tFjK9fBV2sMq6drKcMY2wZtNkhVDHWpC4tfJe93hgq',
    timestamp: new Date(Date.now() - 45 * 60000).toISOString(),
  },
  {
    id: '5',
    type: 'enrollment',
    description: 'Enrolled in "Token Extensions Deep Dive"',
    wallet: 'DRwP3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 72 * 60000).toISOString(),
  },
  {
    id: '6',
    type: 'completion',
    description: 'Completed "NFT Minting Workshop"',
    wallet: 'E5sQ9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 120 * 60000).toISOString(),
  },
  {
    id: '7',
    type: 'credential',
    description: 'Credential upgraded to Gold for "Rust Master"',
    wallet: 'F8tR3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 180 * 60000).toISOString(),
  },
  {
    id: '8',
    type: 'achievement',
    description: 'Unlocked "Streak Master" achievement',
    wallet: 'G2uS9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 240 * 60000).toISOString(),
  },
  {
    id: '9',
    type: 'course_created',
    description: 'New course "Blinks & Actions" published',
    wallet: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 360 * 60000).toISOString(),
  },
  {
    id: '10',
    type: 'enrollment',
    description: 'Enrolled in "Web3 Security Essentials"',
    wallet: 'H9vT3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 420 * 60000).toISOString(),
  },
  {
    id: '11',
    type: 'completion',
    description: 'Completed "SPL Token Creation"',
    wallet: 'J3wU9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 600 * 60000).toISOString(),
  },
  {
    id: '12',
    type: 'achievement',
    description: 'Unlocked "Knowledge Seeker" achievement',
    wallet: 'K7xV3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 720 * 60000).toISOString(),
  },
  {
    id: '13',
    type: 'enrollment',
    description: 'Enrolled in "cNFT Compression Guide"',
    wallet: 'L1yW9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 900 * 60000).toISOString(),
  },
  {
    id: '14',
    type: 'credential',
    description: 'Credential issued for "Solana Builder"',
    wallet: 'M4zA3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 1080 * 60000).toISOString(),
  },
  {
    id: '15',
    type: 'completion',
    description: 'Completed "Program Derived Addresses"',
    wallet: 'N8aB9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 1200 * 60000).toISOString(),
  },
  {
    id: '16',
    type: 'enrollment',
    description: 'Enrolled in "Metaplex Core Assets"',
    wallet: 'P2bC3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 1440 * 60000).toISOString(),
  },
  {
    id: '17',
    type: 'achievement',
    description: 'Unlocked "Early Adopter" achievement',
    wallet: 'Q6dE9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 1800 * 60000).toISOString(),
  },
  {
    id: '18',
    type: 'credential',
    description: 'Credential issued for "Anchor Pro"',
    wallet: 'R9eF3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 2160 * 60000).toISOString(),
  },
  {
    id: '19',
    type: 'enrollment',
    description: 'Enrolled in "Cross-Program Invocations"',
    wallet: 'S3fG9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 2520 * 60000).toISOString(),
  },
  {
    id: '20',
    type: 'completion',
    description: 'Completed "Wallet Adapter Integration"',
    wallet: 'T7hJ3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    timestamp: new Date(Date.now() - 2880 * 60000).toISOString(),
  },
];

function ActivityItem({ activity }: { activity: Activity }) {
  const config = ACTIVITY_CONFIG[activity.type];
  const Icon = config.icon;

  return (
    <div className="flex items-start gap-3 py-3">
      <div className={cn('rounded-lg p-2 shrink-0', config.bg)}>
        <Icon className={cn('size-4', config.color)} />
      </div>
      <div className="flex-1 min-w-0 space-y-0.5">
        <p className="text-sm leading-snug">{activity.description}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <code className="rounded bg-muted px-1 py-0.5 font-mono text-[11px]">
            {truncateWallet(activity.wallet)}
          </code>
          <span aria-hidden="true">&middot;</span>
          <time dateTime={activity.timestamp}>
            {timeAgo(activity.timestamp)}
          </time>
        </div>
      </div>
    </div>
  );
}

export function ActivityFeed() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[420px] pr-3">
          <div className="divide-y divide-border">
            {MOCK_ACTIVITIES.map((activity) => (
              <ActivityItem key={activity.id} activity={activity} />
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
