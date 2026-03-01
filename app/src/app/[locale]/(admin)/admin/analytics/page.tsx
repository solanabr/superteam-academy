'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { AUTHORITY } from '@/lib/solana/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  AnalyticsLineChart,
  AnalyticsBarChart,
  AnalyticsPieChart,
} from '@/components/admin/analytics-charts';
import {
  ShieldAlert,
  Wallet,
  TrendingUp,
  Percent,
  Clock,
  Users,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface AnalyticsStat {
  label: string;
  value: string;
  subtext: string;
  icon: typeof TrendingUp;
  color: string;
  bg: string;
}

const ANALYTICS_STATS: AnalyticsStat[] = [
  {
    label: 'Completion Rate',
    value: '67.3%',
    subtext: '+4.2% from last month',
    icon: Percent,
    color: 'text-emerald-600 dark:text-emerald-400',
    bg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    label: 'Avg XP / User',
    value: '1,247',
    subtext: 'Across all active users',
    icon: TrendingUp,
    color: 'text-blue-600 dark:text-blue-400',
    bg: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    label: '7-Day Retention',
    value: '82.1%',
    subtext: '+2.8% from prior period',
    icon: Users,
    color: 'text-violet-600 dark:text-violet-400',
    bg: 'bg-violet-100 dark:bg-violet-950',
  },
  {
    label: 'Avg Session Time',
    value: '24m 18s',
    subtext: 'Per active user per day',
    icon: Clock,
    color: 'text-amber-600 dark:text-amber-400',
    bg: 'bg-amber-100 dark:bg-amber-950',
  },
];

function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Admin access is required to view analytics.
        </p>
      </div>
      <div className="flex items-center gap-2 rounded-lg border bg-muted/50 px-4 py-2">
        <Wallet className="size-4 text-muted-foreground" />
        <code className="text-xs font-mono text-muted-foreground">
          Required: {AUTHORITY.toBase58().slice(0, 8)}...
          {AUTHORITY.toBase58().slice(-8)}
        </code>
      </div>
    </div>
  );
}

export default function AdminAnalyticsPage() {
  const { publicKey, connected } = useWallet();

  const isAuthorized =
    connected && publicKey?.toBase58() === AUTHORITY.toBase58();

  if (!isAuthorized) {
    return <UnauthorizedState />;
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="text-muted-foreground">
          Platform metrics and learner engagement data.
        </p>
      </div>

      {/* Summary stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {ANALYTICS_STATS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label} className="gap-0 py-4">
              <CardContent className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">
                    {stat.label}
                  </p>
                  <p className="text-2xl font-bold tracking-tight">
                    {stat.value}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {stat.subtext}
                  </p>
                </div>
                <div className={cn('rounded-lg p-2.5', stat.bg)}>
                  <Icon className={cn('size-5', stat.color)} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Daily Active Users</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsLineChart />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Enrollments per Course</CardTitle>
          </CardHeader>
          <CardContent>
            <AnalyticsBarChart />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Users by Track</CardTitle>
        </CardHeader>
        <CardContent>
          <AnalyticsPieChart />
        </CardContent>
      </Card>
    </div>
  );
}
