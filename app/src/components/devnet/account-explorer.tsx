'use client';

import { useCallback, useMemo, useState } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  ExternalLink,
  Database,
  Key,
  BookOpen,
  Award,
  Shield,
  Settings,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  configPda,
  coursePda,
  enrollmentPda,
  minterRolePda,
  achievementTypePda,
  achievementReceiptPda,
} from '@/lib/solana/pda';
import { CLUSTER } from '@/lib/solana/constants';

interface PdaInfo {
  label: string;
  address: string;
  bump: number;
}

interface AccountSection {
  id: string;
  title: string;
  icon: typeof Database;
  iconColor: string;
  accounts: PdaInfo[];
}

function explorerAccountUrl(address: string): string {
  return `https://explorer.solana.com/address/${address}?cluster=${CLUSTER}`;
}

function truncateAddress(address: string): string {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — silently fail
    }
  }, [text]);

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="rounded p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      aria-label="Copy address"
    >
      {copied ? (
        <Check className="size-3 text-emerald-500" />
      ) : (
        <Copy className="size-3 text-muted-foreground" />
      )}
    </button>
  );
}

interface CollapsibleSectionProps {
  section: AccountSection;
}

function CollapsibleSection({ section }: CollapsibleSectionProps) {
  const [isOpen, setIsOpen] = useState(false);
  const Icon = section.icon;

  return (
    <div className="rounded-lg border">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center gap-3 px-3 py-2.5 text-left transition-colors hover:bg-muted/50"
      >
        {isOpen ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
        <Icon className={cn('size-4 shrink-0', section.iconColor)} />
        <span className="text-sm font-medium">{section.title}</span>
        <span className="ml-auto text-xs text-muted-foreground">
          {section.accounts.length} account{section.accounts.length !== 1 ? 's' : ''}
        </span>
      </button>

      {isOpen && (
        <div className="border-t px-3 pb-3 pt-2">
          <div className="space-y-2">
            {section.accounts.map((account) => (
              <div
                key={account.address}
                className="flex items-center gap-2 rounded-md bg-muted/50 px-2.5 py-2"
              >
                <Key className="size-3 shrink-0 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium">{account.label}</p>
                  <p className="font-mono text-[11px] text-muted-foreground">
                    {truncateAddress(account.address)}
                  </p>
                </div>
                <span className="text-[10px] text-muted-foreground tabular-nums">
                  bump: {account.bump}
                </span>
                <CopyButton text={account.address} />
                <a
                  href={explorerAccountUrl(account.address)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded p-1 transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  aria-label="View on Solana Explorer"
                >
                  <ExternalLink className="size-3 text-primary" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

interface AccountExplorerProps {
  className?: string;
}

export function AccountExplorer({ className }: AccountExplorerProps) {
  const { publicKey } = useWallet();

  const sections = useMemo<AccountSection[]>(() => {
    if (!publicKey) return [];

    // Derive all PDAs
    const [configAddr, configBump] = configPda();

    const courseIds = ['solana-101', 'anchor-deep-dive'];
    const courseAccounts = courseIds.map((id) => {
      const [addr, bump] = coursePda(id);
      return { label: `Course: ${id}`, address: addr.toBase58(), bump };
    });

    const enrollmentAccounts = courseIds.map((id) => {
      const [addr, bump] = enrollmentPda(id, publicKey);
      return { label: `Enrollment: ${id}`, address: addr.toBase58(), bump };
    });

    const [minterAddr, minterBump] = minterRolePda(publicKey);

    const achievementIds = ['first-enrollment', 'speed-demon', 'completionist'];
    const achievementTypeAccounts = achievementIds.map((id) => {
      const [addr, bump] = achievementTypePda(id);
      return { label: `Type: ${id}`, address: addr.toBase58(), bump };
    });

    const achievementReceiptAccounts = achievementIds.map((id) => {
      const [addr, bump] = achievementReceiptPda(id, publicKey);
      return { label: `Receipt: ${id}`, address: addr.toBase58(), bump };
    });

    return [
      {
        id: 'config',
        title: 'Program Config',
        icon: Settings,
        iconColor: 'text-slate-500',
        accounts: [
          { label: 'Config', address: configAddr.toBase58(), bump: configBump },
        ],
      },
      {
        id: 'courses',
        title: 'Courses',
        icon: BookOpen,
        iconColor: 'text-primary',
        accounts: courseAccounts,
      },
      {
        id: 'enrollments',
        title: 'Your Enrollments',
        icon: Database,
        iconColor: 'text-blue-500',
        accounts: enrollmentAccounts,
      },
      {
        id: 'minter',
        title: 'Minter Role',
        icon: Shield,
        iconColor: 'text-amber-500',
        accounts: [
          { label: 'Minter Role', address: minterAddr.toBase58(), bump: minterBump },
        ],
      },
      {
        id: 'achievements',
        title: 'Achievements',
        icon: Award,
        iconColor: 'text-pink-500',
        accounts: [
          ...achievementTypeAccounts,
          ...achievementReceiptAccounts,
        ],
      },
    ];
  }, [publicKey]);

  return (
    <Card className={cn('py-0', className)}>
      <CardHeader className="pt-4 px-4 pb-2">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary" />
          <CardTitle className="text-base">Account Explorer</CardTitle>
        </div>
        <p className="text-xs text-muted-foreground">
          On-chain PDA accounts derived for your wallet
        </p>
      </CardHeader>
      <CardContent className="px-4 pb-4">
        {!publicKey ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Connect your wallet to view PDA accounts
          </p>
        ) : (
          <div className="space-y-2">
            {sections.map((section) => (
              <CollapsibleSection key={section.id} section={section} />
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
