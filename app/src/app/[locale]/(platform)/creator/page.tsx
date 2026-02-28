'use client';

import { useMemo } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  Paintbrush,
  BookOpen,
  Users,
  Zap,
  TrendingUp,
  ArrowRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { MyCourses } from '@/components/creator/my-courses';
import { CourseAnalytics } from '@/components/creator/course-analytics';
import { CreatorRewards } from '@/components/creator/creator-rewards';
import { Drafts } from '@/components/creator/drafts';

// In production, this would be fetched from the course store / API
const MOCK_CREATOR_WALLETS = [
  'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
];

interface StatCardProps {
  icon: typeof BookOpen;
  iconClassName?: string;
  label: string;
  value: string;
}

function StatCard({ icon: Icon, iconClassName, label, value }: StatCardProps) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2">
        <Icon className={cn('size-4', iconClassName ?? 'text-muted-foreground')} />
        <span className="text-xs text-muted-foreground">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function BecomeCreatorCTA() {
  return (
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-primary/30 bg-primary/5 p-10 text-center">
      <div className="flex size-16 items-center justify-center rounded-full bg-primary/15">
        <Paintbrush className="size-8 text-primary" />
      </div>
      <div>
        <h2 className="text-xl font-bold">Become a Creator</h2>
        <p className="mt-1 max-w-md text-sm text-muted-foreground">
          Share your Solana expertise with the community. Create interactive courses,
          earn XP rewards when learners complete your content, and build your reputation
          as an educator.
        </p>
      </div>
      <Button className="mt-2 gap-2">
        Get Started
        <ArrowRight className="size-4" />
      </Button>
    </div>
  );
}

export default function CreatorPage() {
  const { publicKey } = useWallet();

  const isCreator = useMemo(() => {
    if (!publicKey) return false;
    return MOCK_CREATOR_WALLETS.includes(publicKey.toBase58());
  }, [publicKey]);

  // If wallet not connected or not a creator, show CTA
  if (!publicKey || !isCreator) {
    return (
      <div className="flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Creator Dashboard</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {!publicKey
              ? 'Connect your wallet to access the creator dashboard'
              : 'Create and manage your courses on Superteam Academy'}
          </p>
        </div>
        <BecomeCreatorCTA />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Page Header */}
      <div>
        <div className="flex items-center gap-2">
          <Paintbrush className="size-5 text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Creator Dashboard</h1>
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your courses, track performance, and monitor rewards
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          icon={BookOpen}
          iconClassName="text-primary"
          label="Total Courses"
          value="3"
        />
        <StatCard
          icon={Users}
          iconClassName="text-blue-500"
          label="Total Enrollments"
          value="540"
        />
        <StatCard
          icon={Zap}
          iconClassName="text-amber-500"
          label="XP Rewards Earned"
          value="19,200"
        />
        <StatCard
          icon={TrendingUp}
          iconClassName="text-emerald-500"
          label="Completion Rate"
          value="56%"
        />
      </div>

      {/* Two-column layout */}
      <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          <MyCourses />
          <CourseAnalytics />
        </div>

        {/* Right column */}
        <div className="flex flex-col gap-6">
          <CreatorRewards />
          <Drafts />
        </div>
      </div>
    </div>
  );
}
