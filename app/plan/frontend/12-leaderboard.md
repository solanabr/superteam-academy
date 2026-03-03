# Leaderboard Service (Frontend)

**Status**: Frontend implementation. Uses Helius DAS API for XP queries.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |

---

## Overview

The Leaderboard Service displays XP rankings. The leaderboard is derived by indexing XP token balances using Helius DAS API.

## Features

- Global rankings by XP
- Weekly/monthly/all-time filters
- Course-specific leaderboards
- Current user highlighting
- Pagination

## Implementation

### 1. Leaderboard Hook

```typescript
// hooks/useLeaderboard.ts
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';

interface LeaderboardEntry {
  rank: number;
  wallet: string;
  xp: number;
  level: number;
  streak: number;
  name?: string;
  avatar?: string;
}

type Timeframe = 'all-time' | 'weekly' | 'monthly';

export function useLeaderboard(timeframe: Timeframe = 'all-time', courseId?: string) {
  const { publicKey } = useWallet();
  
  return useQuery({
    queryKey: ['leaderboard', timeframe, courseId],
    queryFn: async (): Promise<LeaderboardEntry[]> => {
      const params = new URLSearchParams({ timeframe });
      if (courseId) params.set('courseId', courseId);
      
      const response = await fetch(`/api/leaderboard?${params}`);
      return response.json();
    },
    staleTime: 60000, // 1 minute
  });
}

export function useUserRank(timeframe: Timeframe = 'all-time') {
  const { publicKey } = useWallet();
  
  return useQuery({
    queryKey: ['userRank', publicKey?.toBase58(), timeframe],
    queryFn: async () => {
      if (!publicKey) return null;
      
      const response = await fetch(`/api/leaderboard/rank?wallet=${publicKey.toBase58()}&timeframe=${timeframe}`);
      return response.json();
    },
    enabled: !!publicKey,
  });
}
```

### 2. Leaderboard API (Backend)

```typescript
// app/api/leaderboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const timeframe = searchParams.get('timeframe') || 'all-time';
  const courseId = searchParams.get('courseId');
  const limit = parseInt(searchParams.get('limit') || '100');
  
  let dateFilter: Date | null = null;
  
  switch (timeframe) {
    case 'weekly':
      dateFilter = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'monthly':
      dateFilter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      break;
  }
  
  let rankings;
  
  if (courseId) {
    // Course-specific leaderboard
    rankings = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.wallet_address,
        u.name,
        u.avatar_url,
        COUNT(DISTINCT e.id) as courses_completed,
        COALESCE(SUM(xh.amount), 0) as total_xp
      FROM users u
      LEFT JOIN enrollments e ON e.user_id = u.id AND e.course_id = ${courseId} AND e.completed_at IS NOT NULL
      LEFT JOIN xp_history xh ON xh.user_id = u.id AND xh.source = ${courseId}
      ${dateFilter ? prisma.$queryRaw`AND xh.created_at >= ${dateFilter}` : prisma.$queryRaw``}
      GROUP BY u.id
      ORDER BY total_xp DESC
      LIMIT ${limit}
    `;
  } else {
    // Global leaderboard
    rankings = await prisma.$queryRaw`
      SELECT 
        u.id,
        u.wallet_address,
        u.name,
        u.avatar_url,
        COALESCE(SUM(xh.amount), 0) as total_xp
      FROM users u
      LEFT JOIN xp_history xh ON xh.user_id = u.id
      ${dateFilter ? prisma.$queryRaw`WHERE xh.created_at >= ${dateFilter}` : prisma.$queryRaw``}
      GROUP BY u.id
      ORDER BY total_xp DESC
      LIMIT ${limit}
    `;
  }
  
  // Add rank
  const result = rankings.map((r: any, i: number) => ({
    rank: i + 1,
    wallet: r.wallet_address,
    name: r.name,
    avatar: r.avatar_url,
    xp: r.total_xp,
    level: calculateLevel(r.total_xp),
  }));
  
  return NextResponse.json(result);
}
```

### 3. Leaderboard Table Component

```typescript
// components/leaderboard/LeaderboardTable.tsx
'use client';

import { useLeaderboard, useUserRank } from '@/hooks/useLeaderboard';
import { useWallet } from '@solana/wallet-adapter-react';
import { LeaderboardFilters } from './LeaderboardFilters';

export function LeaderboardTable() {
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<Timeframe>('all-time');
  const [courseId, setCourseId] = useState<string | undefined>();
  
  const { data: leaderboard, isLoading } = useLeaderboard(timeframe, courseId);
  const { data: userRank } = useUserRank(timeframe);
  
  return (
    <div className="leaderboard">
      <LeaderboardFilters
        timeframe={timeframe}
        onTimeframeChange={setTimeframe}
        courseId={courseId}
        onCourseChange={setCourseId}
      />
      
      <div className="table-container">
        <table className="leaderboard-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>User</th>
              <th>XP</th>
              <th>Level</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <LoadingRows />
            ) : (
              leaderboard?.map((entry) => (
                <tr
                  key={entry.wallet}
                  className={entry.wallet === publicKey?.toBase58() ? 'current-user' : ''}
                >
                  <td className="rank">
                    {entry.rank <= 3 ? (
                      <RankBadge rank={entry.rank} />
                    ) : (
                      `#${entry.rank}`
                    )}
                  </td>
                  <td className="user">
                    <UserCell entry={entry} />
                  </td>
                  <td className="xp">{entry.xp.toLocaleString()}</td>
                  <td className="level">{entry.level}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      
      {userRank && userRank.rank > 10 && (
        <div className="your-rank">
          <span>Your Rank: #{userRank.rank}</span>
          <span>{userRank.xp.toLocaleString()} XP</span>
        </div>
      )}
    </div>
  );
}
```

### 4. Rank Badge Component

```typescript
// components/leaderboard/RankBadge.tsx
export function RankBadge({ rank }: { rank: number }) {
  const badges = {
    1: { icon: '🥇', color: 'gold' },
    2: { icon: '🥈', color: 'silver' },
    3: { icon: '🥉', color: 'bronze' },
  };
  
  const badge = badges[rank as keyof typeof badges];
  
  if (!badge) return <span>#{rank}</span>;
  
  return (
    <div className={`rank-badge ${badge.color}`}>
      <span className="icon">{badge.icon}</span>
    </div>
  );
}
```

### 5. User Cell Component

```typescript
// components/leaderboard/UserCell.tsx
export function UserCell({ entry }: { entry: LeaderboardEntry }) {
  return (
    <div className="user-cell">
      <div className="avatar">
        {entry.avatar ? (
          <img src={entry.avatar} alt={entry.name || entry.wallet} />
        ) : (
          <div className="avatar-placeholder">
            {(entry.name || entry.wallet).slice(0, 2).toUpperCase()}
          </div>
        )}
      </div>
      <div className="user-info">
        <span className="name">
          {entry.name || formatWalletAddress(entry.wallet)}
        </span>
        {entry.name && (
          <span className="wallet">{formatWalletAddress(entry.wallet)}</span>
        )}
      </div>
    </div>
  );
}

function formatWalletAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}
```

### 6. Leaderboard Page

```typescript
// app/(dashboard)/leaderboard/page.tsx
import { LeaderboardTable } from '@/components/leaderboard/LeaderboardTable';
import { LeaderboardStats } from '@/components/leaderboard/LeaderboardStats';

export default function LeaderboardPage() {
  return (
    <div className="leaderboard-page">
      <header className="page-header">
        <h1>Leaderboard</h1>
        <p>See how you stack up against other learners</p>
      </header>
      
      <LeaderboardStats />
      
      <LeaderboardTable />
    </div>
  );
}
```

## Leaderboard Stats Component

```typescript
// components/leaderboard/LeaderboardStats.tsx
export function LeaderboardStats() {
  // Fetch global stats
  const { data: stats } = useQuery({
    queryKey: ['leaderboard-stats'],
    queryFn: async () => {
      const response = await fetch('/api/leaderboard/stats');
      return response.json();
    },
  });
  
  return (
    <div className="leaderboard-stats">
      <div className="stat-card">
        <span className="stat-value">{stats?.totalUsers?.toLocaleString()}</span>
        <span className="stat-label">Total Learners</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats?.totalXp?.toLocaleString()}</span>
        <span className="stat-label">Total XP Earned</span>
      </div>
      <div className="stat-card">
        <span className="stat-value">{stats?.totalCompletions?.toLocaleString()}</span>
        <span className="stat-label">Courses Completed</span>
      </div>
    </div>
  );
}
```
