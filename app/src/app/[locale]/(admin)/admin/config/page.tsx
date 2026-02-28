'use client';

import { useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  AUTHORITY,
  PROGRAM_ID,
  XP_MINT,
  CLUSTER,
} from '@/lib/solana/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  ShieldAlert,
  Wallet,
  Copy,
  Check,
  Server,
  Key,
  Coins,
  Globe,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConfigField {
  label: string;
  value: string;
  icon: typeof Key;
  iconColor: string;
  iconBg: string;
  mono?: boolean;
}

function UnauthorizedState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center">
      <div className="rounded-full bg-destructive/10 p-4">
        <ShieldAlert className="size-10 text-destructive" />
      </div>
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight">Unauthorized</h1>
        <p className="text-muted-foreground max-w-md">
          Admin access is required to view program configuration.
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

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API may not be available in all contexts
    }
  };

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          variant="ghost"
          size="icon-xs"
          onClick={handleCopy}
          className="shrink-0"
          aria-label={copied ? 'Copied' : 'Copy to clipboard'}
        >
          {copied ? (
            <Check className="size-3.5 text-emerald-600" />
          ) : (
            <Copy className="size-3.5" />
          )}
        </Button>
      </TooltipTrigger>
      <TooltipContent>{copied ? 'Copied!' : 'Copy'}</TooltipContent>
    </Tooltip>
  );
}

function ConfigRow({ field }: { field: ConfigField }) {
  const Icon = field.icon;

  return (
    <div className="flex items-center gap-4 py-3">
      <div className={cn('rounded-lg p-2 shrink-0', field.iconBg)}>
        <Icon className={cn('size-4', field.iconColor)} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{field.label}</p>
        <p
          className={cn(
            'text-sm text-muted-foreground truncate',
            field.mono && 'font-mono text-xs',
          )}
        >
          {field.value}
        </p>
      </div>
      <CopyButton value={field.value} />
    </div>
  );
}

const MOCK_MINTERS = [
  {
    label: 'Authority (self)',
    wallet: AUTHORITY.toBase58(),
  },
  {
    label: 'Bot Signer',
    wallet: 'SigNr1sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn123',
  },
];

export default function AdminConfigPage() {
  const { publicKey, connected } = useWallet();

  const isAuthorized =
    connected && publicKey?.toBase58() === AUTHORITY.toBase58();

  if (!isAuthorized) {
    return <UnauthorizedState />;
  }

  const configFields: ConfigField[] = [
    {
      label: 'Authority Wallet',
      value: AUTHORITY.toBase58(),
      icon: Key,
      iconColor: 'text-amber-600 dark:text-amber-400',
      iconBg: 'bg-amber-100 dark:bg-amber-950',
      mono: true,
    },
    {
      label: 'XP Mint Address',
      value: XP_MINT.toBase58(),
      icon: Coins,
      iconColor: 'text-emerald-600 dark:text-emerald-400',
      iconBg: 'bg-emerald-100 dark:bg-emerald-950',
      mono: true,
    },
    {
      label: 'Program ID',
      value: PROGRAM_ID.toBase58(),
      icon: Server,
      iconColor: 'text-blue-600 dark:text-blue-400',
      iconBg: 'bg-blue-100 dark:bg-blue-950',
      mono: true,
    },
    {
      label: 'Cluster',
      value: CLUSTER,
      icon: Globe,
      iconColor: 'text-violet-600 dark:text-violet-400',
      iconBg: 'bg-violet-100 dark:bg-violet-950',
      mono: false,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          Program Configuration
        </h1>
        <p className="text-muted-foreground">
          Read-only view of on-chain program parameters.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Program Config */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Program Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {configFields.map((field) => (
                <ConfigRow key={field.label} field={field} />
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Minter Roles */}
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base">Minter Roles</CardTitle>
              <Badge variant="secondary" className="text-xs">
                {MOCK_MINTERS.length} authorized
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="divide-y divide-border">
              {MOCK_MINTERS.map((minter) => (
                <div
                  key={minter.wallet}
                  className="flex items-center gap-4 py-3"
                >
                  <div className="rounded-lg p-2 bg-primary/10 shrink-0">
                    <Shield className="size-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{minter.label}</p>
                    <p className="text-xs font-mono text-muted-foreground truncate">
                      {minter.wallet}
                    </p>
                  </div>
                  <CopyButton value={minter.wallet} />
                </div>
              ))}
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Minter roles are managed on-chain via the program&apos;s authority.
              Contact the program authority to request role changes.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
