'use client';

import {
  Users,
  BookOpen,
  Coins,
  GraduationCap,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCard {
  label: string;
  value: string;
  change: number;
  icon: LucideIcon;
  iconColor: string;
  iconBg: string;
}

const STATS: StatCard[] = [
  {
    label: 'Total Users',
    value: '2,547',
    change: 12.5,
    icon: Users,
    iconColor: 'text-blue-600 dark:text-blue-400',
    iconBg: 'bg-blue-100 dark:bg-blue-950',
  },
  {
    label: 'Active Courses',
    value: '42',
    change: 8.2,
    icon: BookOpen,
    iconColor: 'text-emerald-600 dark:text-emerald-400',
    iconBg: 'bg-emerald-100 dark:bg-emerald-950',
  },
  {
    label: 'XP Minted',
    value: '1.2M',
    change: 23.1,
    icon: Coins,
    iconColor: 'text-amber-600 dark:text-amber-400',
    iconBg: 'bg-amber-100 dark:bg-amber-950',
  },
  {
    label: 'Active Enrollments',
    value: '1,893',
    change: -3.4,
    icon: GraduationCap,
    iconColor: 'text-violet-600 dark:text-violet-400',
    iconBg: 'bg-violet-100 dark:bg-violet-950',
  },
];

function StatCardItem({ stat }: { stat: StatCard }) {
  const Icon = stat.icon;
  const isPositive = stat.change >= 0;
  const TrendIcon = isPositive ? TrendingUp : TrendingDown;

  return (
    <Card className="gap-0 py-4">
      <CardContent className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">
            {stat.label}
          </p>
          <p className="text-2xl font-bold tracking-tight">{stat.value}</p>
          <div className="flex items-center gap-1">
            <TrendIcon
              className={cn(
                'size-3.5',
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            />
            <span
              className={cn(
                'text-xs font-medium',
                isPositive
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-red-600 dark:text-red-400',
              )}
            >
              {isPositive ? '+' : ''}
              {stat.change}%
            </span>
            <span className="text-xs text-muted-foreground">vs last month</span>
          </div>
        </div>
        <div className={cn('rounded-lg p-2.5', stat.iconBg)}>
          <Icon className={cn('size-5', stat.iconColor)} />
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsCards() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {STATS.map((stat) => (
        <StatCardItem key={stat.label} stat={stat} />
      ))}
    </div>
  );
}
