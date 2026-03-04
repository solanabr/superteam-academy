'use client';

import { useState, useEffect } from 'react';
import { usePrivy } from '@privy-io/react-auth';
import { createClient } from '@supabase/supabase-js';
import type { UserProfileRow } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LeaderboardPage() {
  const { user, authenticated } = usePrivy();
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [filter, setFilter] = useState<'xp' | 'streak' | 'level'>('xp');
  const [loading, setLoading] = useState(true);
  const wallet = user?.wallet?.address || '';

  async function loadLeaderboard() {
    setLoading(true);
    const { data } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('show_in_leaderboard', true)
      .order(filter === 'xp' ? 'xp' : filter === 'streak' ? 'streak' : 'level', { ascending: false })
      .limit(50);
    setUsers((data || []) as UserProfileRow[]);
    setLoading(false);
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadLeaderboard(); }, [filter]);

  const myRank = users.findIndex(u => u.wallet === wallet) + 1;

  const MEDALS = ['🥇', '🥈', '🥉'];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 px-6 py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl font-bold text-white mb-2">Leaderboard</h1>
          <p className="text-gray-400">Top learners in the Superteam Academy</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        <div className="flex gap-2 mb-8">
          {(['xp', 'streak', 'level'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-full text-sm font-medium capitalize transition-colors ${filter === f ? 'bg-purple-600 text-white' : 'bg-gray-900 text-gray-400 border border-gray-800'}`}>
              {f === 'xp' ? '⚡ XP' : f === 'streak' ? '🔥 Streak' : '⭐ Level'}
            </button>
          ))}
          {authenticated && myRank > 0 && (
            <span className="ml-auto text-sm text-gray-500 self-center">Your rank: <span className="text-purple-400 font-bold">#{myRank}</span></span>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {users.map((u, i) => {
              const isMe = u.wallet === wallet;
              return (
                <div key={u.wallet} className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${isMe ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-800 bg-gray-900'}`}>
                  <div className="w-10 text-center font-bold">
                    {i < 3 ? <span className="text-2xl">{MEDALS[i]}</span> : <span className="text-gray-500">#{i + 1}</span>}
                  </div>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-600 to-purple-900 flex items-center justify-center text-white font-bold text-sm">
                    {(u.display_name || u.wallet || '?')[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white font-medium truncate">{u.display_name || `${u.wallet?.slice(0,4)}...${u.wallet?.slice(-4)}`} {isMe && <span className="text-purple-400 text-xs">(you)</span>}</p>
                    <p className="text-gray-500 text-xs">Level {u.level ?? 1}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-purple-400 font-bold">{filter === 'xp' ? `${u.xp ?? 0} XP` : filter === 'streak' ? `${u.streak ?? 0} days` : `Lvl ${u.level ?? 1}`}</p>
                  </div>
                </div>
              );
            })}
            {users.length === 0 && (
              <div className="text-center py-20 text-gray-600">No users on the leaderboard yet</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
