'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { AUTHORITY } from '@/lib/solana/constants';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { StatsCards } from '@/components/admin/stats-cards';
import { EnrollmentChart } from '@/components/admin/enrollment-chart';
import { ActivityFeed } from '@/components/admin/activity-feed';
import {
  BookOpen,
  Users,
  Award,
  ShieldAlert,
  Wallet,
} from 'lucide-react';

function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Your connected wallet does not match the program authority. Only the
          admin wallet can access this dashboard.
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

export default function AdminDashboardPage() {
  const { publicKey, connected } = useWallet();

  const isAuthorized =
    connected && publicKey?.toBase58() === AUTHORITY.toBase58();

  if (!isAuthorized) {
    return <UnauthorizedState />;
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Admin Dashboard
          </h1>
          <p className="text-muted-foreground">
            Platform overview and management controls.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/courses">
              <BookOpen className="size-4" />
              Manage Courses
            </Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/users">
              <Users className="size-4" />
              View Users
            </Link>
          </Button>
          <Button size="sm" asChild>
            <Link href="/admin/achievements">
              <Award className="size-4" />
              Award Achievement
            </Link>
          </Button>
        </div>
      </div>

      {/* Stats */}
      <StatsCards />

      {/* Chart + Activity */}
      <div className="grid gap-6 lg:grid-cols-5">
        <div className="lg:col-span-3">
          <EnrollmentChart />
        </div>
        <div className="lg:col-span-2">
          <ActivityFeed />
        </div>
      </div>
    </div>
  );
}
