# Leaderboard Service

**Status**: Backend API implementation. Uses Helius DAS API for XP queries.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |
| **XP Mint** | `xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3` |

---

## Overview

The Leaderboard Service provides XP rankings and statistics using Helius DAS API.

## Functions to Implement

### 1. Get XP Leaderboard

```typescript
interface LeaderboardEntry {
  rank: number;
  wallet: PublicKey;
  xp: number;
  change: number;            // Rank change from previous period
}

async function getXpLeaderboard(
  limit: number = 100,
  offset: number = 0
): Promise<LeaderboardEntry[]>
```

### 2. Get User Rank

```typescript
async function getUserRank(
  wallet: PublicKey
): Promise<{
  rank: number;
  xp: number;
  totalUsers: number;
}>
```

### 3. Get Course Leaderboard

```typescript
async function getCourseLeaderboard(
  courseId: string,
  limit: number = 50
): Promise<LeaderboardEntry[]>
```

### 4. Get Track Leaderboard

```typescript
async function getTrackLeaderboard(
  trackId: number,
  limit: number = 100
): Promise<LeaderboardEntry[]>
```

### 5. Get Creator Leaderboard

```typescript
interface CreatorStats {
  rank: number;
  creator: PublicKey;
  totalCreatorRewards: number;
  coursesCreated: number;
  completions: number;
}

async function getCreatorLeaderboard(
  limit: number = 50
): Promise<CreatorStats[]>
```

## Helius DAS API Integration

### Get Token Holders

```typescript
async function getTokenHolders(
  mint: PublicKey,
  limit: number = 100
): Promise<TokenHolder[]>
```

### Get Assets by Owner

```typescript
async function getAssetsByOwner(
  owner: PublicKey,
  limit: number = 100
): Promise<DasAsset[]>
```

### Get Assets by Group

```typescript
async function getAssetsByGroup(
  groupKey: string,
  groupValue: string,
  limit: number = 100
): Promise<DasAsset[]>
```

## Caching Strategy

```typescript
// Redis cache
const LEADERBOARD_CACHE_TTL = 300; // 5 minutes

// Key: "leaderboard:xp"
// Key: "leaderboard:course:{courseId}"
// Key: "leaderboard:track:{trackId}"
// Key: "leaderboard:creator"
// Key: "user:{wallet}:rank"
```

## Historical Rankings

```typescript
interface RankSnapshot {
  timestamp: number;
  rankings: LeaderboardEntry[];
}

// Store daily snapshots in database for historical charts
async function saveRankSnapshot(): Promise<void>
async function getHistoricalRankings(
  wallet: PublicKey,
  startDate: number,
  endDate: number
): Promise<RankSnapshot[]>
```

## Statistics Endpoints

```
GET  /api/leaderboard
GET  /api/leaderboard/user/:wallet
GET  /api/leaderboard/course/:courseId
GET  /api/leaderboard/track/:trackId
GET  /api/leaderboard/creators
GET  /api/stats/global
GET  /api/stats/course/:courseId
GET  /api/stats/track/:trackId
```

## Global Stats

```typescript
interface GlobalStats {
  totalXpMinted: number;
  totalUsers: number;
  totalCourses: number;
  totalCompletions: number;
  totalCredentials: number;
  totalAchievements: number;
}

async function getGlobalStats(): Promise<GlobalStats>
```
