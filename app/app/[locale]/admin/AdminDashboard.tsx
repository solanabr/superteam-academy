'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useLocale, useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import {
  Users,
  BookOpen,
  Award,
  Zap,
  TrendingUp,
  Shield,
  BarChart2,
  Settings,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Eye,
  Flag,
  Trash2,
  Edit3,
  ToggleLeft,
  ToggleRight,
  Activity,
  Database,
  Globe,
  Lock,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { cn } from '@/lib/utils';
import { localePath } from '@/lib/paths';
import { isAdmin as checkIsAdmin } from '@/lib/rbac';

// --- Mock data (production: fetched from Helius DAS API + on-chain accounts) ---

const ENROLLMENT_TREND = [
  { day: 'Feb 15', enrollments: 12, completions: 3 },
  { day: 'Feb 16', enrollments: 18, completions: 5 },
  { day: 'Feb 17', enrollments: 15, completions: 7 },
  { day: 'Feb 18', enrollments: 24, completions: 9 },
  { day: 'Feb 19', enrollments: 31, completions: 12 },
  { day: 'Feb 20', enrollments: 28, completions: 15 },
  { day: 'Feb 21', enrollments: 35, completions: 18 },
  { day: 'Feb 22', enrollments: 42, completions: 22 },
  { day: 'Feb 23', enrollments: 38, completions: 25 },
  { day: 'Feb 24', enrollments: 47, completions: 28 },
  { day: 'Feb 25', enrollments: 53, completions: 31 },
];

const XP_DISTRIBUTION = [
  { range: '0–500', users: 142 },
  { range: '500–2K', users: 89 },
  { range: '2K–5K', users: 54 },
  { range: '5K–10K', users: 31 },
  { range: '10K+', users: 12 },
];

const COMPLETION_FUNNEL = [
  { name: 'Enrolled', value: 428, color: '#7c3aed' },
  { name: 'Started', value: 312, color: '#4f46e5' },
  { name: 'Halfway', value: 189, color: '#2563eb' },
  { name: 'Completed', value: 97, color: '#16a34a' },
];

const COURSES: CourseRow[] = [
  {
    id: 'intro-solana',
    title: 'Introduction to Solana',
    track: 'Solana',
    enrolled: 312,
    completed: 67,
    lessons: 8,
    xpReward: 1200,
    status: 'published',
    lastUpdated: '2026-02-10',
  },
  {
    id: 'anchor-basics',
    title: 'Anchor Fundamentals',
    track: 'Anchor',
    enrolled: 198,
    completed: 42,
    lessons: 10,
    xpReward: 1800,
    status: 'published',
    lastUpdated: '2026-02-12',
  },
  {
    id: 'token-program',
    title: 'Token Program Deep Dive',
    track: 'Tokens',
    enrolled: 156,
    completed: 31,
    lessons: 7,
    xpReward: 1500,
    status: 'published',
    lastUpdated: '2026-02-15',
  },
  {
    id: 'defi-solana',
    title: 'DeFi on Solana',
    track: 'DeFi',
    enrolled: 89,
    completed: 18,
    lessons: 12,
    xpReward: 2200,
    status: 'draft',
    lastUpdated: '2026-02-22',
  },
  {
    id: 'nft-metaplex',
    title: 'NFTs with Metaplex',
    track: 'NFTs',
    enrolled: 0,
    completed: 0,
    lessons: 9,
    xpReward: 1600,
    status: 'draft',
    lastUpdated: '2026-02-24',
  },
];

const TOP_USERS: UserRow[] = [
  { rank: 1, address: '7xKX...AsU', xp: 15420, level: 18, streak: 42, credentials: 3, joinedDaysAgo: 45 },
  { rank: 2, address: '3mNk...F4r', xp: 12890, level: 16, streak: 28, credentials: 2, joinedDaysAgo: 38 },
  { rank: 3, address: '9pQJ...Xw2', xp: 11240, level: 15, streak: 21, credentials: 3, joinedDaysAgo: 52 },
  { rank: 4, address: '5hGZ...Ky9', xp: 9850, level: 14, streak: 14, credentials: 2, joinedDaysAgo: 31 },
  { rank: 5, address: '2wTL...Bm1', xp: 8430, level: 13, streak: 35, credentials: 1, joinedDaysAgo: 27 },
];

const FLAGGED_POSTS: FlaggedPost[] = [
  {
    id: '1',
    author: '8xPz...Kn3',
    content: 'Check out this arbitrage bot that guarantees 50% daily returns...',
    reports: 4,
    category: 'General',
    createdAt: '2h ago',
    status: 'pending',
  },
  {
    id: '2',
    author: '4rMw...Jx7',
    content: 'This thread contains promotional content for an unvetted DeFi protocol',
    reports: 2,
    category: 'DeFi',
    createdAt: '5h ago',
    status: 'pending',
  },
  {
    id: '3',
    author: '6tBn...Qs4',
    content: 'Repeated spam message about NFT mint',
    reports: 7,
    category: 'NFTs',
    createdAt: '1d ago',
    status: 'pending',
  },
];

interface CourseRow {
  id: string;
  title: string;
  track: string;
  enrolled: number;
  completed: number;
  lessons: number;
  xpReward: number;
  status: 'published' | 'draft';
  lastUpdated: string;
}

interface UserRow {
  rank: number;
  address: string;
  xp: number;
  level: number;
  streak: number;
  credentials: number;
  joinedDaysAgo: number;
}

interface FlaggedPost {
  id: string;
  author: string;
  content: string;
  reports: number;
  category: string;
  createdAt: string;
  status: 'pending' | 'approved' | 'removed';
}

function StatCard({
  label,
  value,
  delta,
  icon: Icon,
  color,
}: {
  label: string;
  value: string;
  delta?: string;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className={cn('rounded-2xl border bg-gray-900/60 p-5', color)}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs text-gray-400 mb-1">{label}</p>
          <p className="text-2xl font-extrabold text-white">{value}</p>
          {delta && (
            <p className="text-xs text-green-400 mt-0.5 flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {delta}
            </p>
          )}
        </div>
        <Icon className="h-6 w-6 text-gray-400" />
      </div>
    </div>
  );
}

function SectionHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <div className="mb-4">
      <h2 className="text-base font-bold text-white">{title}</h2>
      {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
    </div>
  );
}

export default function AdminDashboard() {
  const locale = useLocale();
  const t = useTranslations('admin');
  const { connected, publicKey } = useWallet();
  const [courseStatuses, setCourseStatuses] = useState<Record<string, 'published' | 'draft'>>(
    Object.fromEntries(COURSES.map((c) => [c.id, c.status]))
  );
  const [activeTab, setActiveTab] = useState<'overview' | 'courses' | 'users' | 'moderation' | 'system'>('overview');
  const [flaggedPosts, setFlaggedPosts] = useState<FlaggedPost[]>(FLAGGED_POSTS);

  const isAdmin =
    connected && checkIsAdmin(publicKey?.toBase58());

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center max-w-md px-4">
          <Lock className="mx-auto h-12 w-12 text-gray-600 mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">{t('access_denied')}</h2>
          <p className="text-gray-400 text-sm mb-6">{t('access_denied_desc')}</p>
          <Link
            href={localePath(locale, '/')}
            className="text-purple-400 text-sm hover:text-purple-300"
          >
            ← {t('back_home')}
          </Link>
        </div>
      </div>
    );
  }

  const toggleCourseStatus = (id: string) => {
    setCourseStatuses((prev) => ({
      ...prev,
      [id]: prev[id] === 'published' ? 'draft' : 'published',
    }));
  };

  const handlePostAction = (postId: string, action: 'approve' | 'remove') => {
    setFlaggedPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, status: action === 'approve' ? 'approved' : 'removed' } : p
      )
    );
  };

  const TABS = [
    { id: 'overview', label: t('tab_overview'), icon: BarChart2 },
    { id: 'courses', label: t('tab_courses'), icon: BookOpen },
    { id: 'users', label: t('tab_users'), icon: Users },
    { id: 'moderation', label: t('tab_moderation'), icon: Flag },
    { id: 'system', label: t('tab_system'), icon: Settings },
  ] as const;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Admin header */}
      <div className="border-b border-gray-800 bg-gray-900/80 sticky top-0 z-40">
        <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-900/50 border border-purple-700/50">
              <Shield className="h-4 w-4 text-purple-400" />
            </div>
            <div>
              <h1 className="text-sm font-bold text-white">{t('title')}</h1>
              <p className="text-xs text-gray-400">{t('subtitle')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <span className="h-1.5 w-1.5 rounded-full bg-green-400 animate-pulse" />
              {t('system_online')}
            </span>
            <WalletMultiButton
              style={{
                background: 'transparent',
                border: '1px solid #374151',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                padding: '0.4rem 0.75rem',
                height: '2rem',
              }}
            />
          </div>
        </div>
        {/* Tab bar */}
        <div className="mx-auto max-w-7xl px-4 border-t border-gray-800/50">
          <div className="flex gap-1 overflow-x-auto no-scrollbar py-1">
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as typeof activeTab)}
                className={cn(
                  'flex items-center gap-1.5 whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-medium transition-all',
                  activeTab === id
                    ? 'bg-purple-900/50 text-purple-300 border border-purple-700/50'
                    : 'text-gray-400 hover:text-gray-300 hover:bg-gray-800/50'
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-6 space-y-6">
        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                label={t('kpi_users')}
                value="428"
                delta="+12 this week"
                icon={Users}
                color="border-blue-800/30"
              />
              <StatCard
                label={t('kpi_courses')}
                value="5"
                delta="3 published"
                icon={BookOpen}
                color="border-purple-800/30"
              />
              <StatCard
                label={t('kpi_xp')}
                value="3.8M"
                delta="+142K this week"
                icon={Zap}
                color="border-yellow-800/30"
              />
              <StatCard
                label={t('kpi_credentials')}
                value="97"
                delta="+8 this week"
                icon={Award}
                color="border-green-800/30"
              />
            </div>

            {/* Enrollment trend */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
              <SectionHeader
                title={t('enrollment_trend')}
                subtitle={t('enrollment_trend_sub')}
              />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={ENROLLMENT_TREND} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="enrollGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="compGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#16a34a" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#16a34a" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                  <XAxis dataKey="day" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', fontSize: '12px' }}
                    labelStyle={{ color: '#9ca3af' }}
                  />
                  <Area type="monotone" dataKey="enrollments" stroke="#7c3aed" strokeWidth={2} fill="url(#enrollGrad)" name={t('enrollments')} />
                  <Area type="monotone" dataKey="completions" stroke="#16a34a" strokeWidth={2} fill="url(#compGrad)" name={t('completions')} />
                </AreaChart>
              </ResponsiveContainer>
              <div className="flex gap-4 mt-2 text-xs text-gray-400">
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-purple-500" />{t('enrollments')}</span>
                <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-green-500" />{t('completions')}</span>
              </div>
            </div>

            {/* XP Distribution + Completion Funnel */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                <SectionHeader title={t('xp_distribution')} subtitle={t('xp_distribution_sub')} />
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={XP_DISTRIBUTION} margin={{ top: 0, right: 0, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
                    <XAxis dataKey="range" tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} axisLine={false} tickLine={false} />
                    <Tooltip
                      contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: '0.5rem', fontSize: '12px' }}
                      cursor={{ fill: 'rgba(124,58,237,0.1)' }}
                    />
                    <Bar dataKey="users" fill="#7c3aed" radius={[4, 4, 0, 0]} name={t('kpi_users')} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
                <SectionHeader title={t('completion_funnel')} subtitle={t('completion_funnel_sub')} />
                <div className="flex items-center gap-4">
                  <ResponsiveContainer width={140} height={140}>
                    <PieChart>
                      <Pie data={COMPLETION_FUNNEL} cx="50%" cy="50%" innerRadius={40} outerRadius={65} dataKey="value" strokeWidth={0}>
                        {COMPLETION_FUNNEL.map((entry, i) => (
                          <Cell key={i} fill={entry.color} opacity={0.85} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="flex-1 space-y-2">
                    {COMPLETION_FUNNEL.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1.5">
                          <span className="h-2 w-2 rounded-full" style={{ background: entry.color }} />
                          <span className="text-gray-400">{entry.name}</span>
                        </span>
                        <span className="font-semibold text-white">{entry.value}</span>
                      </div>
                    ))}
                    <div className="pt-1 border-t border-gray-800 flex items-center justify-between text-xs">
                      <span className="text-gray-400">{t('conversion_rate')}</span>
                      <span className="font-bold text-green-400">22.7%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* COURSES TAB */}
        {activeTab === 'courses' && (
          <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-gray-800">
              <SectionHeader title={t('course_management')} subtitle={t('course_management_sub')} />
              <button className="flex items-center gap-1.5 rounded-lg bg-purple-900/50 border border-purple-700/50 px-3 py-1.5 text-xs font-medium text-purple-300 hover:bg-purple-900/70 transition-all">
                <BookOpen className="h-3.5 w-3.5" />
                {t('add_course')}
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-gray-800 text-gray-400">
                    <th className="text-left px-5 py-3 font-medium">{t('col_course')}</th>
                    <th className="text-left px-4 py-3 font-medium">{t('col_track')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('col_enrolled')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('col_completed')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('col_completion')}</th>
                    <th className="text-right px-4 py-3 font-medium">{t('col_xp')}</th>
                    <th className="text-center px-4 py-3 font-medium">{t('col_status')}</th>
                    <th className="text-center px-4 py-3 font-medium">{t('col_actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {COURSES.map((course) => {
                    const status = courseStatuses[course.id];
                    const completionRate =
                      course.enrolled > 0
                        ? Math.round((course.completed / course.enrolled) * 100)
                        : 0;
                    return (
                      <tr key={course.id} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="px-5 py-3">
                          <div className="font-medium text-white">{course.title}</div>
                          <div className="text-gray-400 mt-0.5">{course.lessons} lessons · Updated {course.lastUpdated}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="rounded-md bg-gray-800 px-2 py-0.5 text-gray-300">{course.track}</span>
                        </td>
                        <td className="px-4 py-3 text-right text-gray-300">{course.enrolled.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-gray-300">{course.completed}</td>
                        <td className="px-4 py-3 text-right">
                          <span className={cn(
                            'font-semibold',
                            completionRate >= 25 ? 'text-green-400' :
                            completionRate >= 15 ? 'text-yellow-400' : 'text-red-400'
                          )}>
                            {completionRate}%
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-medium">{course.xpReward.toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <button
                            onClick={() => toggleCourseStatus(course.id)}
                            className={cn(
                              'flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium mx-auto transition-all',
                              status === 'published'
                                ? 'bg-green-900/30 text-green-400 border border-green-700/40 hover:bg-red-900/30 hover:text-red-400 hover:border-red-700/40'
                                : 'bg-gray-800 text-gray-400 border border-gray-700 hover:bg-green-900/30 hover:text-green-400 hover:border-green-700/40'
                            )}
                          >
                            {status === 'published' ? (
                              <><ToggleRight className="h-3.5 w-3.5" /> {t('published')}</>
                            ) : (
                              <><ToggleLeft className="h-3.5 w-3.5" /> {t('draft')}</>
                            )}
                          </button>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-2">
                            <button className="text-gray-400 hover:text-blue-400 transition-colors">
                              <Eye className="h-3.5 w-3.5" />
                            </button>
                            <button className="text-gray-400 hover:text-yellow-400 transition-colors">
                              <Edit3 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div className="px-5 py-3 border-t border-gray-800 flex items-center justify-between text-xs text-gray-400">
              <span>{COURSES.length} {t('total_courses')}</span>
              <span>{COURSES.filter((c) => courseStatuses[c.id] === 'published').length} {t('published_courses')}</span>
            </div>
          </div>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* User stats */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: t('total_learners'), value: '428', icon: Users, color: 'border-blue-800/30' },
                { label: t('active_7d'), value: '187', icon: Activity, color: 'border-green-800/30' },
                { label: t('avg_level'), value: '7.4', icon: TrendingUp, color: 'border-purple-800/30' },
                { label: t('avg_streak'), value: '12d', icon: Clock, color: 'border-orange-800/30' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className={cn('rounded-2xl border bg-gray-900/60 p-4', color)}>
                  <Icon className="h-5 w-5 text-gray-400 mb-2" />
                  <div className="text-xl font-extrabold text-white">{value}</div>
                  <div className="text-xs text-gray-400">{label}</div>
                </div>
              ))}
            </div>

            {/* Top learners table */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 overflow-hidden">
              <div className="p-5 border-b border-gray-800">
                <SectionHeader title={t('top_learners')} subtitle={t('top_learners_sub')} />
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b border-gray-800 text-gray-400">
                      <th className="text-left px-5 py-3 font-medium">{t('col_rank')}</th>
                      <th className="text-left px-4 py-3 font-medium">{t('col_address')}</th>
                      <th className="text-right px-4 py-3 font-medium">{t('col_xp')}</th>
                      <th className="text-right px-4 py-3 font-medium">{t('col_level')}</th>
                      <th className="text-right px-4 py-3 font-medium">{t('col_streak')}</th>
                      <th className="text-right px-4 py-3 font-medium">{t('col_credentials')}</th>
                      <th className="text-right px-4 py-3 font-medium">{t('col_joined')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {TOP_USERS.map((user) => (
                      <tr key={user.rank} className="border-b border-gray-800/50 hover:bg-gray-800/20 transition-colors">
                        <td className="px-5 py-3">
                          <span className={cn(
                            'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                            user.rank === 1 ? 'bg-yellow-900/50 text-yellow-300' :
                            user.rank === 2 ? 'bg-gray-700 text-gray-300' :
                            user.rank === 3 ? 'bg-orange-900/50 text-orange-400' :
                            'bg-gray-800 text-gray-400'
                          )}>
                            {user.rank}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-gray-300">{user.address}</td>
                        <td className="px-4 py-3 text-right text-yellow-400 font-semibold">{user.xp.toLocaleString()}</td>
                        <td className="px-4 py-3 text-right text-purple-300">{user.level}</td>
                        <td className="px-4 py-3 text-right text-orange-400">{user.streak}d</td>
                        <td className="px-4 py-3 text-right text-green-400">{user.credentials}</td>
                        <td className="px-4 py-3 text-right text-gray-400">{user.joinedDaysAgo}d ago</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* MODERATION TAB */}
        {activeTab === 'moderation' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <SectionHeader title={t('content_moderation')} subtitle={t('content_moderation_sub')} />
              <span className={cn(
                'rounded-full px-2.5 py-0.5 text-xs font-semibold',
                flaggedPosts.filter((p) => p.status === 'pending').length > 0
                  ? 'bg-red-900/50 text-red-400 border border-red-700/50'
                  : 'bg-green-900/50 text-green-400 border border-green-700/50'
              )}>
                {flaggedPosts.filter((p) => p.status === 'pending').length} {t('pending_reports')}
              </span>
            </div>
            <div className="space-y-3">
              {flaggedPosts.map((post) => (
                <div
                  key={post.id}
                  className={cn(
                    'rounded-xl border p-4 transition-all',
                    post.status === 'pending' ? 'border-red-800/40 bg-red-900/10' :
                    post.status === 'approved' ? 'border-green-800/40 bg-green-900/10 opacity-60' :
                    'border-gray-800 bg-gray-900/30 opacity-40'
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1.5">
                        <AlertTriangle className="h-3.5 w-3.5 text-red-400 shrink-0" />
                        <span className="font-mono text-xs text-gray-400">{post.author}</span>
                        <span className="rounded bg-gray-800 px-1.5 py-0.5 text-xs text-gray-400">{post.category}</span>
                        <span className="text-xs text-gray-600">{post.createdAt}</span>
                        <span className="text-xs text-red-400 font-semibold">{post.reports} {t('reports')}</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed line-clamp-2">{post.content}</p>
                    </div>
                    {post.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handlePostAction(post.id, 'approve')}
                          className="flex items-center gap-1 rounded-lg bg-green-900/30 border border-green-700/40 px-2.5 py-1.5 text-xs text-green-400 hover:bg-green-900/50 transition-all"
                        >
                          <CheckCircle className="h-3.5 w-3.5" />
                          {t('approve')}
                        </button>
                        <button
                          onClick={() => handlePostAction(post.id, 'remove')}
                          className="flex items-center gap-1 rounded-lg bg-red-900/30 border border-red-700/40 px-2.5 py-1.5 text-xs text-red-400 hover:bg-red-900/50 transition-all"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                          {t('remove')}
                        </button>
                      </div>
                    )}
                    {post.status !== 'pending' && (
                      <span className={cn(
                        'text-xs font-medium',
                        post.status === 'approved' ? 'text-green-400' : 'text-red-400'
                      )}>
                        {post.status === 'approved' ? t('approved') : t('removed')}
                      </span>
                    )}
                  </div>
                </div>
              ))}
              {flaggedPosts.every((p) => p.status !== 'pending') && (
                <div className="rounded-xl border border-green-800/30 bg-green-900/10 p-8 text-center">
                  <CheckCircle className="mx-auto h-8 w-8 text-green-500 mb-2" />
                  <p className="text-sm font-semibold text-green-400">{t('all_clear')}</p>
                  <p className="text-xs text-gray-400 mt-1">{t('all_clear_desc')}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* SYSTEM TAB */}
        {activeTab === 'system' && (
          <div className="space-y-6">
            {/* System health */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                {
                  name: t('sys_program'),
                  detail: '3Yr5EZrq8t...',
                  status: 'online',
                  icon: Database,
                  meta: 'Devnet · 16 instructions',
                },
                {
                  name: t('sys_rpc'),
                  detail: 'Helius DAS API',
                  status: 'online',
                  icon: Globe,
                  meta: '34ms avg latency',
                },
                {
                  name: t('sys_cms'),
                  detail: 'Sanity.io',
                  status: 'online',
                  icon: BookOpen,
                  meta: '5 published documents',
                },
                {
                  name: t('sys_analytics'),
                  detail: 'GA4 + Hotjar',
                  status: 'online',
                  icon: BarChart2,
                  meta: '142 active sessions',
                },
                {
                  name: t('sys_auth'),
                  detail: 'Wallet + Google OAuth',
                  status: 'online',
                  icon: Shield,
                  meta: '428 authenticated users',
                },
                {
                  name: t('sys_storage'),
                  detail: 'Vercel Edge',
                  status: 'online',
                  icon: Activity,
                  meta: '99.98% uptime 30d',
                },
              ].map(({ name, detail, status, icon: Icon, meta }) => (
                <div key={name} className="rounded-xl border border-gray-800 bg-gray-900/60 p-4">
                  <div className="flex items-start justify-between mb-2">
                    <Icon className="h-5 w-5 text-gray-400" />
                    <span data-testid="service-online-badge" className="flex items-center gap-1 text-xs text-green-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-green-400" />
                      {t('online')}
                    </span>
                  </div>
                  <div className="text-sm font-semibold text-white">{name}</div>
                  <div className="text-xs text-gray-400 font-mono mt-0.5">{detail}</div>
                  <div className="text-xs text-gray-600 mt-1">{meta}</div>
                </div>
              ))}
            </div>

            {/* Program config */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
              <SectionHeader title={t('program_config')} subtitle={t('program_config_sub')} />
              <div className="space-y-3">
                {[
                  { key: t('cfg_program_id'), value: '3Yr5EZrq8t4fMunuHUZoN9Q6cn4Sf6p3AFAdvWEMaxKU', type: 'address' },
                  { key: t('cfg_authority'), value: 'GpXHXs5KfzfXbNKcMLNbAMsJsgPsBE7y5GtwVoiuxYvH', type: 'address' },
                  { key: t('cfg_xp_mint'), value: 'XPMint...7x9 (Token-2022, NonTransferable)', type: 'text' },
                  { key: t('cfg_network'), value: 'devnet', type: 'badge' },
                  { key: t('cfg_xp_per_lesson'), value: '150 XP', type: 'text' },
                  { key: t('cfg_credential_threshold'), value: '1000 XP', type: 'text' },
                ].map(({ key, value, type }) => (
                  <div key={key} className="flex items-center justify-between text-xs border-b border-gray-800/50 pb-2">
                    <span className="text-gray-400">{key}</span>
                    <span className={cn(
                      type === 'address' ? 'font-mono text-gray-300 text-xs' :
                      type === 'badge' ? 'rounded-full bg-blue-900/50 border border-blue-700/50 px-2 py-0.5 text-blue-300 font-medium' :
                      'text-gray-300'
                    )}>
                      {value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Quick actions */}
            <div className="rounded-2xl border border-gray-800 bg-gray-900/60 p-5">
              <SectionHeader title={t('admin_actions')} subtitle={t('admin_actions_sub')} />
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { label: t('action_sync_cms'), icon: RefreshCw, color: 'text-blue-400' },
                  { label: t('action_clear_cache'), icon: RefreshCw, color: 'text-yellow-400' },
                  { label: t('action_export_users'), icon: Users, color: 'text-green-400' },
                  { label: t('action_rotate_signer'), icon: Shield, color: 'text-purple-400' },
                  { label: t('action_update_config'), icon: Settings, color: 'text-orange-400' },
                  { label: t('action_announce'), icon: Globe, color: 'text-red-400' },
                ].map(({ label, icon: Icon, color }) => (
                  <button
                    key={label}
                    className="flex items-center gap-2 rounded-xl border border-gray-700 bg-gray-800/50 px-3 py-2.5 text-xs font-medium text-gray-300 hover:bg-gray-700/50 hover:border-gray-600 transition-all text-left"
                  >
                    <Icon className={cn('h-3.5 w-3.5 shrink-0', color)} />
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
