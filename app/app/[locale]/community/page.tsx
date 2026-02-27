'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import {
  MessageSquare,
  ThumbsUp,
  Search,
  Plus,
  Pin,
  Eye,
  Users2,
  TrendingUp,
  Clock,
  Flame,
} from 'lucide-react';
import { cn } from '@/lib/utils';

// ─── Types ────────────────────────────────────────────────────────────────────

type Category = 'all' | 'anchor' | 'solana' | 'defi' | 'nft' | 'general';
type SortKey = 'latest' | 'replies' | 'top';

interface Thread {
  id: number;
  titleKey: string;
  category: Exclude<Category, 'all'>;
  author: string;
  replies: number;
  views: number;
  upvotes: number;
  hoursAgo: number;
  pinned?: boolean;
  hot?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const MOCK_THREADS: Thread[] = [
  { id: 1, titleKey: 'thread_1_title', category: 'anchor', author: '7xKX...9mNp', replies: 23, views: 156, upvotes: 41, hoursAgo: 2, pinned: true },
  { id: 2, titleKey: 'thread_2_title', category: 'solana', author: '3fBZ...2qRt', replies: 18, views: 89, upvotes: 27, hoursAgo: 5 },
  { id: 3, titleKey: 'thread_3_title', category: 'defi', author: 'Ap9S...7kLm', replies: 31, views: 203, upvotes: 68, hoursAgo: 24, pinned: true, hot: true },
  { id: 4, titleKey: 'thread_4_title', category: 'general', author: '9mQR...4nVz', replies: 45, views: 312, upvotes: 94, hoursAgo: 48, hot: true },
  { id: 5, titleKey: 'thread_5_title', category: 'nft', author: '2kTp...8jWx', replies: 12, views: 78, upvotes: 19, hoursAgo: 72 },
  { id: 6, titleKey: 'thread_6_title', category: 'solana', author: 'HnRs...1cBq', replies: 27, views: 145, upvotes: 53, hoursAgo: 96, hot: true },
  { id: 7, titleKey: 'thread_7_title', category: 'anchor', author: 'QmKv...5pLz', replies: 19, views: 94, upvotes: 35, hoursAgo: 120 },
  { id: 8, titleKey: 'thread_8_title', category: 'defi', author: 'WrXd...0tGy', replies: 8, views: 52, upvotes: 14, hoursAgo: 144 },
  { id: 9, titleKey: 'thread_9_title', category: 'general', author: 'TbFq...6hJn', replies: 67, views: 445, upvotes: 112, hoursAgo: 168, hot: true },
  { id: 10, titleKey: 'thread_10_title', category: 'solana', author: 'VpYc...3mDk', replies: 14, views: 88, upvotes: 22, hoursAgo: 168 },
];

const CATEGORY_STYLES: Record<Exclude<Category, 'all'>, string> = {
  anchor: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  solana: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
  defi: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  nft: 'bg-pink-900/40 text-pink-300 border border-pink-700/40',
  general: 'bg-gray-800 text-gray-300 border border-gray-700/40',
};

const CATEGORY_FILTER_STYLES: Record<Category, string> = {
  all: 'bg-gray-800 text-gray-300 border border-gray-700/40',
  anchor: 'bg-blue-900/40 text-blue-300 border border-blue-700/40',
  solana: 'bg-purple-900/40 text-purple-300 border border-purple-700/40',
  defi: 'bg-emerald-900/40 text-emerald-300 border border-emerald-700/40',
  nft: 'bg-pink-900/40 text-pink-300 border border-pink-700/40',
  general: 'bg-gray-800 text-gray-300 border border-gray-700/40',
};

// ─── Avatar helper ─────────────────────────────────────────────────────────────

function WalletAvatar({ address }: { address: string }) {
  const initials = address.slice(0, 2).toUpperCase();
  const colors = [
    'from-purple-600 to-indigo-600',
    'from-blue-600 to-cyan-600',
    'from-emerald-600 to-teal-600',
    'from-pink-600 to-rose-600',
    'from-orange-600 to-amber-600',
  ];
  const colorIndex = address.charCodeAt(0) % colors.length;
  return (
    <div
      className={cn(
        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br text-xs font-bold text-white',
        colors[colorIndex]
      )}
    >
      {initials}
    </div>
  );
}

// ─── Thread row ───────────────────────────────────────────────────────────────

type TFunc = ReturnType<typeof useTranslations<'community'>>;

interface ThreadRowProps {
  key?: number;
  thread: Thread;
  t: TFunc;
}

function formatRelativeTime(hoursAgo: number, t: TFunc): string {
  if (hoursAgo < 24) return t('time_hours_ago', { count: hoursAgo });
  if (hoursAgo < 168) return t('time_days_ago', { count: Math.floor(hoursAgo / 24) });
  return t('time_weeks_ago', { count: Math.floor(hoursAgo / 168) });
}

function ThreadRow({ thread, t }: ThreadRowProps) {
  return (
    <div
      className={cn(
        'group flex flex-col sm:flex-row sm:items-center gap-3 rounded-xl border p-4 transition-all hover:border-purple-700/50 hover:bg-gray-900/60 cursor-pointer',
        thread.pinned
          ? 'border-purple-800/50 bg-gray-900/40'
          : 'border-gray-800 bg-gray-900/20'
      )}
    >
      {/* Left: avatar */}
      <WalletAvatar address={thread.author} />

      {/* Center: title + meta */}
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2 mb-1">
          {/* Pinned badge */}
          {thread.pinned && (
            <span className="flex items-center gap-1 text-xs font-semibold text-amber-400">
              <Pin className="h-3 w-3" />
              {t('pinned')}
            </span>
          )}

          {/* Hot badge */}
          {thread.hot && !thread.pinned && (
            <span className="flex items-center gap-1 text-xs font-semibold text-orange-400">
              <Flame className="h-3 w-3" />
              {t('hot')}
            </span>
          )}

          {/* Category badge */}
          <span
            className={cn(
              'rounded-full px-2.5 py-0.5 text-xs font-semibold',
              CATEGORY_STYLES[thread.category]
            )}
          >
            {t(`filter_${thread.category}`)}
          </span>
        </div>

        <h3 className="text-sm font-semibold text-gray-100 group-hover:text-white truncate leading-snug">
          {t(thread.titleKey)}
        </h3>

        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-gray-500">
          <span className="font-mono">{thread.author}</span>
          <span>·</span>
          <span>{formatRelativeTime(thread.hoursAgo, t)}</span>
        </div>
      </div>

      {/* Right: stats */}
      <div className="flex items-center gap-4 sm:gap-5 text-xs text-gray-500 shrink-0 ml-10 sm:ml-0">
        {/* Upvotes */}
        <div className="flex items-center gap-1.5">
          <ThumbsUp className="h-3.5 w-3.5 text-purple-500" />
          <span className="font-medium text-gray-300">{thread.upvotes}</span>
        </div>

        {/* Replies */}
        <div className="flex items-center gap-1.5">
          <MessageSquare className="h-3.5 w-3.5 text-blue-500" />
          <span className="font-medium text-gray-300">{thread.replies}</span>
          <span className="hidden sm:inline">{t('replies')}</span>
        </div>

        {/* Views */}
        <div className="flex items-center gap-1.5">
          <Eye className="h-3.5 w-3.5 text-gray-600" />
          <span className="font-medium text-gray-400">{thread.views}</span>
          <span className="hidden sm:inline">{t('views')}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CommunityPage() {
  const t = useTranslations('community');
  // locale used implicitly by useTranslations

  const [selectedCategory, setSelectedCategory] = useState<Category>('all');
  const [sortKey, setSortKey] = useState<SortKey>('latest');
  const [search, setSearch] = useState('');
  const [showNewThread, setShowNewThread] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newBody, setNewBody] = useState('');
  const [newCategory, setNewCategory] = useState<Exclude<Category, 'all'>>('general');
  const [submitting, setSubmitting] = useState(false);

  // Fetch threads from API on mount
  useEffect(() => {
    fetch('/api/community/threads')
      .then(r => r.json())
      .then(data => {
        if (data.threads) {
          // Log that API data was loaded
          console.log('[community] Loaded', data.threads.length, 'threads from API');
        }
      })
      .catch(() => {});
  }, []);

  const handleNewThread = useCallback(async () => {
    if (!newTitle.trim() || !newBody.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch('/api/community/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTitle, bodyText: newBody, author: 'You', category: newCategory }),
      });
      if (res.ok) {
        setShowNewThread(false);
        setNewTitle('');
        setNewBody('');
      }
    } finally {
      setSubmitting(false);
    }
  }, [newTitle, newBody, newCategory]);

  interface CategoryItem {
    key: Category;
    label: string;
  }

  interface SortItem {
    key: SortKey;
    label: string;
    icon: string;
  }

  const CATEGORIES: CategoryItem[] = [
    { key: 'all', label: t('filter_all') },
    { key: 'solana', label: t('filter_solana') },
    { key: 'anchor', label: t('filter_anchor') },
    { key: 'defi', label: t('filter_defi') },
    { key: 'nft', label: t('filter_nft') },
    { key: 'general', label: t('filter_general') },
  ];

  const SORTS: SortItem[] = [
    { key: 'latest', label: t('sort_latest'), icon: 'clock' },
    { key: 'replies', label: t('sort_replies'), icon: 'msg' },
    { key: 'top', label: t('sort_top'), icon: 'trending' },
  ];

  const filteredAndSorted = useMemo(() => {
    let threads = [...MOCK_THREADS];

    // Filter by category
    if (selectedCategory !== 'all') {
      threads = threads.filter((th) => th.category === selectedCategory);
    }

    // Filter by search (search translated titles)
    if (search.trim()) {
      const query = search.trim().toLowerCase();
      threads = threads.filter((th) =>
        t(th.titleKey).toLowerCase().includes(query)
      );
    }

    // Sort — pinned always first within each sort
    threads.sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;

      if (sortKey === 'replies') return b.replies - a.replies;
      if (sortKey === 'top') return b.upvotes - a.upvotes;
      // latest: by id desc (proxy for time)
      return b.id - a.id;
    });

    return threads;
  }, [selectedCategory, sortKey, search]);

  const totalReplies = MOCK_THREADS.reduce((s, th) => s + th.replies, 0);

  function getSortIcon(iconKey: string) {
    if (iconKey === 'clock') return <Clock className="h-3.5 w-3.5" />;
    if (iconKey === 'msg') return <MessageSquare className="h-3.5 w-3.5" />;
    return <TrendingUp className="h-3.5 w-3.5" />;
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Page header */}
      <div className="border-b border-gray-800 bg-gray-900/60 py-12 px-4">
        <div className="mx-auto max-w-5xl">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600">
                <Users2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h1 className="text-3xl font-extrabold text-white">{t('title')}</h1>
                <p className="text-sm text-gray-400 mt-0.5">{t('subtitle')}</p>
              </div>
            </div>
            <button onClick={() => setShowNewThread(true)} className="flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2.5 text-sm font-semibold text-white transition-all hover:bg-purple-500 active:scale-95 w-fit">
              <Plus className="h-4 w-4" />
              {t('new_thread')}
            </button>
          </div>

          {/* Stats bar */}
          <div className="mt-6 flex flex-wrap gap-6">
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <MessageSquare className="h-4 w-4 text-purple-400" />
              <span className="font-semibold text-white">{MOCK_THREADS.length}</span>
              <span>{t('stats_threads')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Users2 className="h-4 w-4 text-emerald-400" />
              <span className="font-semibold text-white">1,247</span>
              <span>{t('stats_members')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <Flame className="h-4 w-4 text-orange-400" />
              <span className="font-semibold text-white">{totalReplies}</span>
              <span>{t('stats_today')}</span>
            </div>
          </div>
        </div>
      </div>


      {/* New Thread Dialog */}
      {showNewThread && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowNewThread(false)}>
          <div className="w-full max-w-lg rounded-2xl border border-gray-700 bg-gray-900 p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <h2 className="text-lg font-bold text-white">{t('new_thread')}</h2>
            <input
              type="text"
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Thread title..."
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-600"
            />
            <textarea
              value={newBody}
              onChange={e => setNewBody(e.target.value)}
              rows={4}
              placeholder="What's on your mind?"
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white placeholder-gray-500 outline-none focus:border-purple-600 resize-none"
            />
            <select
              value={newCategory}
              onChange={e => setNewCategory(e.target.value as Exclude<Category, 'all'>)}
              className="w-full rounded-lg border border-gray-700 bg-gray-800 px-4 py-2.5 text-sm text-white outline-none"
            >
              <option value="general">General</option>
              <option value="solana">Solana</option>
              <option value="anchor">Anchor</option>
              <option value="defi">DeFi</option>
              <option value="nft">NFT</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setShowNewThread(false)} className="px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors">
                Cancel
              </button>
              <button
                onClick={handleNewThread}
                disabled={submitting || !newTitle.trim() || !newBody.trim()}
                className="rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white hover:bg-purple-500 disabled:opacity-50 transition-all"
              >
                {submitting ? '...' : t('new_thread')}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-5xl px-4 py-8">
        {/* Search + Sort row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          {/* Search */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <input
              type="text"
              value={search}
              onChange={(e: { target: { value: string } }) => setSearch(e.target.value)}
              placeholder={t('search')}
              className="w-full rounded-lg border border-gray-800 bg-gray-900 py-2.5 pl-10 pr-4 text-sm text-gray-100 placeholder-gray-600 outline-none transition-colors focus:border-purple-600 focus:ring-1 focus:ring-purple-600/30"
            />
          </div>

          {/* Sort */}
          <div className="flex gap-1 bg-gray-900 rounded-lg p-1 border border-gray-800">
            {SORTS.map((s) => (
              <button
                key={s.key}
                onClick={() => setSortKey(s.key)}
                className={cn(
                  'flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-all',
                  sortKey === s.key
                    ? 'bg-purple-600 text-white shadow-md shadow-purple-900/40'
                    : 'text-gray-400 hover:text-white hover:bg-gray-800'
                )}
              >
                {getSortIcon(s.icon)}
                <span className="hidden sm:inline">{s.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Category filter pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={cn(
                'rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all hover:scale-105 active:scale-95',
                selectedCategory === cat.key
                  ? cn(CATEGORY_FILTER_STYLES[cat.key], 'ring-2 ring-offset-1 ring-offset-gray-950 ring-purple-500')
                  : cn(CATEGORY_FILTER_STYLES[cat.key], 'opacity-70 hover:opacity-100')
              )}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Thread list */}
        {filteredAndSorted.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-gray-600">
            <MessageSquare className="h-10 w-10 mb-3" />
            <p className="text-sm">{t('no_results')}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredAndSorted.map((thread: Thread) => (
              <ThreadRow key={thread.id} thread={thread} t={t} />
            ))}
          </div>
        )}

        {/* Wallet CTA */}
        <p className="mt-8 text-center text-xs text-gray-700">
          {t('connect_to_post')}
        </p>
      </div>
    </div>
  );
}
