'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { AUTHORITY } from '@/lib/solana/constants';
import { Button } from '@/components/ui/button';
import { CourseTable } from '@/components/admin/course-table';
import { ShieldAlert, Wallet, ExternalLink } from 'lucide-react';

function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Admin access is required to manage courses.
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

export default function AdminCoursesPage() {
  const { publicKey, connected } = useWallet();

  const isAuthorized =
    connected && publicKey?.toBase58() === AUTHORITY.toBase58();

  if (!isAuthorized) {
    return <UnauthorizedState />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">
            Course Management
          </h1>
          <p className="text-muted-foreground">
            View, manage, and monitor all courses on the platform.
          </p>
        </div>
        <Button size="sm" asChild>
          <a href="/studio" target="_blank" rel="noopener noreferrer">
            <ExternalLink className="size-4" />
            Create Course in Sanity
          </a>
        </Button>
      </div>

      <CourseTable />
    </div>
  );
}
