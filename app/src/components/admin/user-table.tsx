'use client';

import { useState, useMemo } from 'react';
import { ArrowUpDown, ExternalLink, Search } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Link } from '@/i18n/routing';
import { cn } from '@/lib/utils';

interface User {
  wallet: string;
  level: number;
  xp: number;
  courses: number;
  credentials: number;
  lastActive: string;
}

const MOCK_USERS: User[] = [
  {
    wallet: 'ACAd3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 15,
    xp: 48200,
    courses: 12,
    credentials: 8,
    lastActive: '2026-02-24T09:30:00Z',
  },
  {
    wallet: '7nYK3PxJK9fBV2sMq6drKcMY2wZtNkhVDHWpC4tfJe93',
    level: 12,
    xp: 35600,
    courses: 9,
    credentials: 6,
    lastActive: '2026-02-24T08:15:00Z',
  },
  {
    wallet: 'Bx3M9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 10,
    xp: 28400,
    courses: 7,
    credentials: 5,
    lastActive: '2026-02-23T22:45:00Z',
  },
  {
    wallet: 'C4tFjK9fBV2sMq6drKcMY2wZtNkhVDHWpC4tfJe93hgq',
    level: 9,
    xp: 24100,
    courses: 6,
    credentials: 4,
    lastActive: '2026-02-23T18:20:00Z',
  },
  {
    wallet: 'DRwP3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 8,
    xp: 19800,
    courses: 5,
    credentials: 3,
    lastActive: '2026-02-23T14:00:00Z',
  },
  {
    wallet: 'E5sQ9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 7,
    xp: 15200,
    courses: 4,
    credentials: 3,
    lastActive: '2026-02-22T11:30:00Z',
  },
  {
    wallet: 'F8tR3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 6,
    xp: 12100,
    courses: 4,
    credentials: 2,
    lastActive: '2026-02-22T09:15:00Z',
  },
  {
    wallet: 'G2uS9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 5,
    xp: 9400,
    courses: 3,
    credentials: 2,
    lastActive: '2026-02-21T16:45:00Z',
  },
  {
    wallet: 'H9vT3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 4,
    xp: 6700,
    courses: 3,
    credentials: 1,
    lastActive: '2026-02-21T08:00:00Z',
  },
  {
    wallet: 'J3wU9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 3,
    xp: 4200,
    courses: 2,
    credentials: 1,
    lastActive: '2026-02-20T20:30:00Z',
  },
  {
    wallet: 'K7xV3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 3,
    xp: 3800,
    courses: 2,
    credentials: 1,
    lastActive: '2026-02-20T15:00:00Z',
  },
  {
    wallet: 'L1yW9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 2,
    xp: 2100,
    courses: 1,
    credentials: 0,
    lastActive: '2026-02-19T12:45:00Z',
  },
  {
    wallet: 'M4zA3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 2,
    xp: 1800,
    courses: 1,
    credentials: 0,
    lastActive: '2026-02-18T10:20:00Z',
  },
  {
    wallet: 'N8aB9USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 1,
    xp: 900,
    courses: 1,
    credentials: 0,
    lastActive: '2026-02-17T07:30:00Z',
  },
  {
    wallet: 'P2bC3USj2sMV6drKcMY2wZtNkhVDHWpC4tfJe93hgqYn',
    level: 1,
    xp: 350,
    courses: 1,
    credentials: 0,
    lastActive: '2026-02-16T19:00:00Z',
  },
];

function truncateWallet(wallet: string): string {
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getLevelVariant(
  level: number,
): 'default' | 'secondary' | 'outline' {
  if (level >= 10) return 'default';
  if (level >= 5) return 'secondary';
  return 'outline';
}

type SortKey = keyof Pick<User, 'level' | 'xp' | 'courses' | 'lastActive'>;
type SortDirection = 'asc' | 'desc';

export function UserTable() {
  const [search, setSearch] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('xp');
  const [sortDir, setSortDir] = useState<SortDirection>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    let result = MOCK_USERS.filter((u) =>
      u.wallet.toLowerCase().includes(term),
    );

    result.sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc'
          ? aVal.localeCompare(bVal)
          : bVal.localeCompare(aVal);
      }
      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortDir === 'asc' ? aVal - bVal : bVal - aVal;
      }
      return 0;
    });

    return result;
  }, [search, sortKey, sortDir]);

  function SortableHead({
    label,
    columnKey,
  }: {
    label: string;
    columnKey: SortKey;
  }) {
    return (
      <TableHead>
        <button
          type="button"
          onClick={() => handleSort(columnKey)}
          className="inline-flex items-center gap-1.5 hover:text-foreground transition-colors"
        >
          {label}
          <ArrowUpDown
            className={cn(
              'size-3.5',
              sortKey === columnKey
                ? 'text-foreground'
                : 'text-muted-foreground/50',
            )}
          />
        </button>
      </TableHead>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by wallet address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Wallet</TableHead>
              <SortableHead label="Level" columnKey="level" />
              <SortableHead label="XP" columnKey="xp" />
              <SortableHead label="Courses" columnKey="courses" />
              <TableHead>Credentials</TableHead>
              <SortableHead label="Last Active" columnKey="lastActive" />
              <TableHead className="w-[60px]">
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="h-24 text-center text-muted-foreground"
                >
                  No users found.
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((user) => (
                <TableRow key={user.wallet}>
                  <TableCell>
                    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs">
                      {truncateWallet(user.wallet)}
                    </code>
                  </TableCell>
                  <TableCell>
                    <Badge variant={getLevelVariant(user.level)}>
                      Lvl {user.level}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">
                    {user.xp.toLocaleString()}
                  </TableCell>
                  <TableCell>{user.courses}</TableCell>
                  <TableCell>{user.credentials}</TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {formatDate(user.lastActive)}
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="icon-xs" asChild>
                      <Link href={`/profile/${user.wallet}`}>
                        <ExternalLink className="size-3.5" />
                        <span className="sr-only">
                          View profile for {truncateWallet(user.wallet)}
                        </span>
                      </Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <p className="text-xs text-muted-foreground">
        Showing {filtered.length} of {MOCK_USERS.length} users
      </p>
    </div>
  );
}
