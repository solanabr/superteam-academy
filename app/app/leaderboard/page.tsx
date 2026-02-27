'use client';

import { useState, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';
import { Header } from '@/components/Header';
import { learningProgressService, xpToLevel } from '@/lib/services';
import type { LeaderboardEntry, LeaderboardTimeframe } from '@/lib/services/types';
import { courses } from '@/lib/data/courses';

const TIMEFRAMES: { value: LeaderboardTimeframe; label: string }[] = [
  { value: 'all-time', label: 'All time' },
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
];

export default function LeaderboardPage() {
  const { publicKey } = useWallet();
  const [timeframe, setTimeframe] = useState<LeaderboardTimeframe>('all-time');
  const [courseId, setCourseId] = useState<string>('');
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [myXp, setMyXp] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    learningProgressService.getLeaderboard(timeframe, courseId || undefined).then((list) => {
      setEntries(list);
      setLoading(false);
    });
  }, [timeframe, courseId]);

  useEffect(() => {
    if (!publicKey) { setMyXp(null); return; }
    learningProgressService.getXPBalance(publicKey.toBase58()).then((b) => setMyXp(b.xp));
  }, [publicKey]);

  const myRank = publicKey && entries.length ? (() => {
    const wallet = publicKey.toBase58();
    const idx = entries.findIndex((e) => e.wallet === wallet);
    return idx >= 0 ? idx + 1 : null;
  })() : null;

  return (
    <>
      <Header />
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-10 sm:px-6" tabIndex={-1}>
        <h1 className="text-title font-semibold text-[rgb(var(--text))]">
          Leaderboard
        </h1>
        <p className="text-body mt-1 text-[rgb(var(--text-muted))]">
          Rankings by XP (off-chain index). Filter by timeframe and course. Production: Helius DAS or custom indexer.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <div className="flex gap-2">
            {TIMEFRAMES.map(({ value, label }) => (
            <button
              key={value}
              type="button"
              onClick={() => setTimeframe(value)}
              className={`rounded-lg px-4 py-2 text-caption font-medium transition ${
                timeframe === value
                  ? 'bg-accent text-[rgb(3_7_18)]'
                  : 'border border-border bg-surface text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text))]'
              }`}
            >
              {label}
            </button>
          ))}
          </div>
          <label htmlFor="leaderboard-course" className="sr-only">Filter by course</label>
          <select
            id="leaderboard-course"
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            aria-label="Filter by course"
            className="rounded-lg border border-border/50 bg-surface px-3 py-2 text-caption text-[rgb(var(--text))] focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
          >
            <option value="">All courses</option>
            {courses.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>
        {publicKey && (myXp !== null || myRank !== null) && (
          <div className="mt-4 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3">
            <p className="text-caption font-medium text-[rgb(var(--text))]">
              Your XP: {myXp ?? 0} · Level {myXp != null ? xpToLevel(myXp) : 0}
              {myRank != null ? ` · Rank #${myRank}` : ''}
            </p>
          </div>
        )}
        {loading ? (
          <p className="text-body mt-6 text-[rgb(var(--text-muted))]" role="status" aria-live="polite">Loading…</p>
        ) : entries.length === 0 ? (
          <div className="mt-6 rounded-xl border border-border/50 border-dashed bg-surface/50 p-8 text-center">
            <p className="text-body text-[rgb(var(--text-muted))]">No leaderboard entries yet. Complete lessons to earn XP and appear here.</p>
          </div>
        ) : (
          <ul className="mt-6 space-y-3">
            {entries.map((u) => {
              const isCurrentUser = publicKey && u.wallet === publicKey.toBase58();
              return (
                <li
                  key={u.rank}
                  className={`flex items-center gap-3 rounded-xl border px-4 py-3 ${
                    isCurrentUser
                      ? 'border-accent/60 bg-accent/10'
                      : 'border-border/50 bg-surface'
                  }`}
                >
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface-elevated text-caption font-medium text-[rgb(var(--text-muted))]" aria-hidden title={`Avatar for ${u.displayName ?? u.wallet}`}>
                    {(u.displayName ?? u.wallet).charAt(0).toUpperCase()}
                  </span>
                  <span className="text-body font-medium text-[rgb(var(--text-subtle))]">#{u.rank}</span>
                  <span className="text-body font-medium text-[rgb(var(--text))] min-w-0 truncate">
                    {u.displayName ?? u.wallet}
                    {isCurrentUser && <span className="text-caption ml-2 font-normal text-accent">(you)</span>}
                  </span>
                  <span className="text-caption font-medium text-accent">{u.xp} XP</span>
                  <span className="text-caption text-[rgb(var(--text-muted))]">
                    Level {u.level}
                    {u.streak != null && u.streak > 0 && ` · ${u.streak}d streak`}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </main>
    </>
  );
}
