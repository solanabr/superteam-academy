'use client';

import { LeaderboardEntry, calculateLevel } from '@/types/gamification';
import { Trophy, Medal, Award, ChevronUp, ChevronDown, Minus } from 'lucide-react';
import { LevelBadge } from './XPDisplay';
import Image from 'next/image';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  userRank?: number;
  className?: string;
}

/**
 * XP Leaderboard display
 */
export function Leaderboard({
  entries,
  currentUserId,
  userRank,
  className = '',
}: LeaderboardProps) {
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy size={20} className="text-yellow-400" />;
      case 2:
        return <Medal size={20} className="text-gray-300" />;
      case 3:
        return <Medal size={20} className="text-amber-600" />;
      default:
        return <span className="w-5 text-center font-mono text-gray-400">{rank}</span>;
    }
  };

  const getRankBg = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-500/20 to-transparent border-yellow-500/30';
      case 2:
        return 'bg-gradient-to-r from-gray-400/20 to-transparent border-gray-400/30';
      case 3:
        return 'bg-gradient-to-r from-amber-600/20 to-transparent border-amber-600/30';
      default:
        return 'bg-gray-900/30 border-gray-700/30';
    }
  };

  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-700 bg-gray-900/50 ${className}`}
    >
      <div className="border-b border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Trophy size={20} className="text-yellow-400" />
          <h3 className="text-lg font-semibold text-white">Leaderboard</h3>
        </div>
        {userRank && userRank > entries.length && (
          <div className="mt-2 text-sm text-gray-400">Your rank: #{userRank}</div>
        )}
      </div>

      <div className="divide-y divide-gray-800">
        {entries.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;
          const level = calculateLevel(entry.xp);

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3 transition-colors ${getRankBg(entry.rank)} border-l-2 ${
                isCurrentUser ? 'ring-1 ring-purple-500/50 ring-inset' : ''
              }`}
            >
              {/* Rank */}
              <div className="flex w-8 justify-center">{getRankIcon(entry.rank)}</div>

              {/* Avatar */}
              <div className="relative">
                {entry.avatarUrl ? (
                  <Image
                    src={entry.avatarUrl}
                    alt={entry.username}
                    width={40}
                    height={40}
                    unoptimized
                    className="h-10 w-10 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-purple-600 font-medium text-white">
                    {entry.username.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="absolute -right-1 -bottom-1">
                  <LevelBadge level={level} size="sm" />
                </div>
              </div>

              {/* User info */}
              <div className="min-w-0 flex-1">
                <div
                  className={`truncate font-medium ${isCurrentUser ? 'text-purple-300' : 'text-white'}`}
                >
                  {entry.username}
                  {isCurrentUser && <span className="ml-2 text-xs text-purple-400">(you)</span>}
                </div>
                <div className="text-xs text-gray-400">Level {level}</div>
              </div>

              {/* XP */}
              <div className="text-right">
                <div className="font-semibold text-purple-300">{entry.xp.toLocaleString()} XP</div>
              </div>
            </div>
          );
        })}
      </div>

      {entries.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <Trophy size={40} className="mx-auto mb-2 opacity-50" />
          <p>No entries yet. Be the first on the leaderboard!</p>
        </div>
      )}
    </div>
  );
}

interface RankChangeProps {
  previousRank?: number;
  currentRank: number;
}

function RankChange({ previousRank, currentRank }: RankChangeProps) {
  if (!previousRank || previousRank === currentRank) {
    return (
      <div className="flex items-center gap-1 text-xs text-gray-500">
        <Minus size={12} />
        <span>-</span>
      </div>
    );
  }

  const change = previousRank - currentRank;

  if (change > 0) {
    return (
      <div className="flex items-center gap-1 text-xs text-green-400">
        <ChevronUp size={12} />
        <span>+{change}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-1 text-xs text-red-400">
      <ChevronDown size={12} />
      <span>{change}</span>
    </div>
  );
}

interface LeaderboardMiniProps {
  entries: LeaderboardEntry[];
  currentUserId?: string;
  className?: string;
}

/**
 * Compact leaderboard for dashboard widgets
 */
export function LeaderboardMini({ entries, currentUserId, className = '' }: LeaderboardMiniProps) {
  const topThree = entries.slice(0, 3);

  const getMedalColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'text-yellow-400';
      case 2:
        return 'text-gray-300';
      case 3:
        return 'text-amber-600';
      default:
        return 'text-gray-400';
    }
  };

  return (
    <div className={`rounded-lg border border-gray-700 bg-gray-900/50 p-3 ${className}`}>
      <div className="mb-3 flex items-center gap-2">
        <Trophy size={16} className="text-yellow-400" />
        <span className="text-sm font-medium text-white">Top Learners</span>
      </div>

      <div className="space-y-2">
        {topThree.map((entry) => {
          const isCurrentUser = entry.userId === currentUserId;

          return (
            <div
              key={entry.userId}
              className={`flex items-center gap-2 text-sm ${isCurrentUser ? 'text-purple-300' : 'text-gray-300'}`}
            >
              <Medal size={14} className={getMedalColor(entry.rank)} />
              <span className="flex-1 truncate">{entry.username}</span>
              <span className="text-xs text-gray-400">{entry.xp.toLocaleString()} XP</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
