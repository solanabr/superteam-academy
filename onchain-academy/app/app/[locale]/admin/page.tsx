'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import type { UserProfileRow, CourseRow, QuizQuestionRow, AchievementRow, XpTransactionRow } from '@/lib/supabase';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'superteam2024';

export default function AdminPage() {
  const [authed, setAuthed] = useState(false);
  const [pw, setPw] = useState('');
  const [tab, setTab] = useState('overview');
  const [stats, setStats] = useState<Record<string, number>>({});
  const [users, setUsers] = useState<UserProfileRow[]>([]);
  const [courses, setCourses] = useState<CourseRow[]>([]);
  const [questions, setQuestions] = useState<QuizQuestionRow[]>([]);
  const [achievements, setAchievements] = useState<AchievementRow[]>([]);
  const [xpLog, setXpLog] = useState<XpTransactionRow[]>([]);
  const [awardWallet, setAwardWallet] = useState('');
  const [awardAmount, setAwardAmount] = useState('');
  const [awardReason, setAwardReason] = useState('');
  const [, setLoading] = useState(false);

  async function loadAll() {
    setLoading(true);
    const [
      { count: userCount },
      { count: enrollCount },
      { count: threadCount },
      { count: challengeCount },
      { count: quizCount },
      { data: xpData },
    ] = await Promise.all([
      supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
      supabase.from('enrollments').select('*', { count: 'exact', head: true }),
      supabase.from('threads').select('*', { count: 'exact', head: true }),
      supabase.from('challenge_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('quiz_attempts').select('*', { count: 'exact', head: true }),
      supabase.from('xp_transactions').select('amount'),
    ]);
    const totalXp = (xpData || []).reduce((s: number, r) => s + (r.amount || 0), 0);
    setStats({ userCount: userCount || 0, enrollCount: enrollCount || 0, threadCount: threadCount || 0, challengeCount: challengeCount || 0, quizCount: quizCount || 0, totalXp });

    const [{ data: u }, { data: c }, { data: q }, { data: a }, { data: xl }] = await Promise.all([
      supabase.from('user_profiles').select('*').order('xp', { ascending: false }).limit(20),
      supabase.from('courses').select('*').order('order_index'),
      supabase.from('quiz_questions').select('*').order('category'),
      supabase.from('achievements').select('*'),
      supabase.from('xp_transactions').select('*').order('created_at', { ascending: false }).limit(30),
    ]);
    setUsers((u || []) as UserProfileRow[]);
    setCourses((c || []) as CourseRow[]);
    setQuestions((q || []) as QuizQuestionRow[]);
    setAchievements((a || []) as AchievementRow[]);
    setXpLog((xl || []) as XpTransactionRow[]);
    setLoading(false);
  }

  useEffect(() => { if (authed) loadAll(); }, [authed, tab]);

  async function awardXp() {
    if (!awardWallet || !awardAmount) return;
    await supabase.from('xp_transactions').insert({ user_wallet: awardWallet, amount: Number(awardAmount), reason: awardReason || 'admin_award' });
    setAwardWallet(''); setAwardAmount(''); setAwardReason('');
    loadAll();
  }

  if (!authed) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="bg-gray-900 border border-gray-800 rounded-2xl p-8 w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-white text-center">Admin Access</h1>
        <input type="password" value={pw} onChange={e => setPw(e.target.value)} onKeyDown={e => e.key === 'Enter' && pw === ADMIN_PASSWORD && setAuthed(true)}
          className="w-full bg-gray-800 border border-gray-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500"
          placeholder="Password" />
        <button onClick={() => pw === ADMIN_PASSWORD && setAuthed(true)}
          className="w-full bg-purple-600 hover:bg-purple-500 text-white font-semibold py-3 rounded-xl">
          Enter
        </button>
      </div>
    </div>
  );

  const TABS = ['overview', 'users', 'courses', 'quiz', 'achievements', 'xp-ledger'];

  return (
    <div className="min-h-screen bg-[#0a0a0a]">
      <div className="border-b border-gray-800 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-bold text-white">Admin Panel</h1>
          <span className="text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-3 py-1 rounded-full">● Live</span>
        </div>
        <div className="max-w-7xl mx-auto flex gap-1 mt-4 overflow-x-auto">
          {TABS.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition-colors ${tab === t ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}>
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {tab === 'overview' && (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[
                { label: 'Users', value: stats.userCount || 0, icon: '👥' },
                { label: 'Enrollments', value: stats.enrollCount || 0, icon: '📚' },
                { label: 'Threads', value: stats.threadCount || 0, icon: '💬' },
                { label: 'XP Awarded', value: stats.totalXp || 0, icon: '⚡' },
                { label: 'Challenges', value: stats.challengeCount || 0, icon: '🎯' },
                { label: 'Quiz Attempts', value: stats.quizCount || 0, icon: '🧠' },
              ].map(s => (
                <div key={s.label} className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
                  <div className="text-2xl mb-1">{s.icon}</div>
                  <div className="text-2xl font-bold text-white">{s.value.toLocaleString()}</div>
                  <div className="text-xs text-gray-500">{s.label}</div>
                </div>
              ))}
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-4">Award XP</h3>
              <div className="flex gap-3 flex-wrap">
                <input value={awardWallet} onChange={e => setAwardWallet(e.target.value)}
                  className="flex-1 min-w-48 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Wallet address" />
                <input value={awardAmount} onChange={e => setAwardAmount(e.target.value)} type="number"
                  className="w-28 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="XP amount" />
                <input value={awardReason} onChange={e => setAwardReason(e.target.value)}
                  className="flex-1 min-w-32 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
                  placeholder="Reason" />
                <button onClick={awardXp} className="bg-purple-600 hover:bg-purple-500 text-white px-5 py-2 rounded-xl text-sm font-medium">Award</button>
              </div>
            </div>

            <div className="bg-gray-900 rounded-2xl border border-gray-800 p-6">
              <h3 className="text-white font-semibold mb-4">Top Users</h3>
              <div className="space-y-2">
                {users.slice(0, 10).map((u, i) => (
                  <div key={u.wallet} className="flex items-center gap-3 p-3 bg-gray-800 rounded-xl">
                    <span className="text-gray-500 w-6 text-sm">#{i+1}</span>
                    <span className="text-white flex-1 text-sm truncate">{u.display_name || (u.wallet?.slice(0,8)+'...')}</span>
                    <span className="text-purple-400 text-sm font-semibold">{u.xp || 0} XP</span>
                    <span className="text-gray-500 text-xs">Lvl {u.level || 1}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'users' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left p-4">Wallet</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-right p-4">XP</th>
                  <th className="text-right p-4">Level</th>
                  <th className="text-right p-4">Streak</th>
                </tr>
              </thead>
              <tbody>
                {users.map(u => (
                  <tr key={u.wallet} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                    <td className="p-4 font-mono text-gray-400 text-xs">{u.wallet?.slice(0,8)}...</td>
                    <td className="p-4 text-white">{u.display_name || '—'}</td>
                    <td className="p-4 text-right text-purple-400 font-semibold">{u.xp ?? 0}</td>
                    <td className="p-4 text-right text-gray-300">{u.level ?? 1}</td>
                    <td className="p-4 text-right text-orange-400">{u.streak ?? 0}🔥</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'courses' && (
          <div className="space-y-3">
            {courses.map(c => (
              <div key={c.id} className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex-1">
                  <p className="text-white font-medium">{c.title}</p>
                  <p className="text-gray-500 text-xs capitalize">{c.category} • {c.difficulty} • {c.lesson_count} lessons</p>
                </div>
                <button
                  onClick={async () => { await supabase.from('courses').update({ is_published: !c.is_published }).eq('id', c.id); loadAll(); }}
                  className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${c.is_published ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                  {c.is_published ? 'Published' : 'Draft'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'quiz' && (
          <div className="space-y-2">
            {questions.map(q => (
              <div key={q.id} className="flex items-center gap-4 p-4 bg-gray-900 rounded-xl border border-gray-800">
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm truncate">{q.question}</p>
                  <p className="text-gray-500 text-xs capitalize">{q.category} • {q.difficulty}</p>
                </div>
                <button
                  onClick={async () => { await supabase.from('quiz_questions').update({ is_active: !q.is_active }).eq('id', q.id); loadAll(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium border shrink-0 ${q.is_active ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-gray-700 text-gray-400 border-gray-600'}`}>
                  {q.is_active ? 'Active' : 'Hidden'}
                </button>
              </div>
            ))}
          </div>
        )}

        {tab === 'achievements' && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {achievements.map(a => (
              <div key={a.id} className="bg-gray-900 rounded-xl border border-gray-800 p-4 text-center">
                <div className="text-4xl mb-2">{a.icon}</div>
                <p className="text-white font-semibold text-sm">{a.title}</p>
                <p className="text-gray-500 text-xs mt-1">{a.description}</p>
                <span className={`mt-2 inline-block text-xs px-2 py-0.5 rounded-full ${a.rarity === 'legendary' ? 'bg-yellow-500/20 text-yellow-400' : a.rarity === 'epic' ? 'bg-purple-500/20 text-purple-400' : a.rarity === 'rare' ? 'bg-blue-500/20 text-blue-400' : 'bg-gray-700 text-gray-400'}`}>
                  {a.rarity}
                </span>
              </div>
            ))}
          </div>
        )}

        {tab === 'xp-ledger' && (
          <div className="bg-gray-900 rounded-2xl border border-gray-800 overflow-hidden">
            <table className="w-full text-sm">
              <thead className="border-b border-gray-800">
                <tr className="text-gray-500">
                  <th className="text-left p-4">Wallet</th>
                  <th className="text-left p-4">Reason</th>
                  <th className="text-right p-4">Amount</th>
                  <th className="text-right p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {xpLog.map(x => (
                  <tr key={x.id} className="border-b border-gray-800/50 hover:bg-gray-800/50">
                    <td className="p-4 font-mono text-gray-400 text-xs">{x.user_wallet?.slice(0,8)}...</td>
                    <td className="p-4 text-gray-300 capitalize">{x.reason?.replace(/_/g, ' ')}</td>
                    <td className="p-4 text-right text-purple-400 font-semibold">+{x.amount}</td>
                    <td className="p-4 text-right text-gray-500 text-xs">{new Date(x.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
