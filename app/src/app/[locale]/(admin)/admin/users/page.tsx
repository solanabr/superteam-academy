'use client';

import { useWallet } from '@solana/wallet-adapter-react';
import { AUTHORITY } from '@/lib/solana/constants';
import { UserTable } from '@/components/admin/user-table';
import { ShieldAlert, Wallet } from 'lucide-react';

function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Admin access is required to view user data.
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

export default function AdminUsersPage() {
  const { publicKey, connected } = useWallet();

  const isAuthorized =
    connected && publicKey?.toBase58() === AUTHORITY.toBase58();

  if (!isAuthorized) {
    return <UnauthorizedState />;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
        <p className="text-muted-foreground">
          Browse and manage registered users across the platform.
        </p>
      </div>

      <UserTable />
    </div>
  );
}
