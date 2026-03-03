/**
 * CommunityFeed — Lavender pastel card showing recent community threads.
 */
'use client';

import { useQuery } from '@tanstack/react-query';
import { MessageSquare, ArrowUp, Pin } from 'lucide-react';
import { Link } from '@/context/i18n/navigation';

interface ThreadAuthor {
    id: string;
    name: string | null;
    avatar_url: string | null;
    username: string | null;
}

interface Thread {
    id: string;
    title: string;
    content: string;
    category: string;
    author: ThreadAuthor;
    upvotes: number;
    reply_count: number;
    is_pinned: boolean;
    created_at: string;
    tags: string[];
}

const CATEGORY_COLORS: Record<string, string> = {
    general: '#4338ca',
    help: '#b45309',
    showcase: '#15803d',
    feedback: '#be185d',
};

function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    return `${days}d ago`;
}

export function CommunityFeed() {
    const { data, isLoading } = useQuery<{ threads: Thread[] }>({
        queryKey: ['community-threads-dashboard'],
        queryFn: async () => {
            const res = await fetch('/api/community/threads?page=1');
            if (!res.ok) throw new Error('Failed to fetch threads');
            return res.json();
        },
        staleTime: 60_000,
    });

    const threads = data?.threads?.slice(0, 5) ?? [];

    return (
        <div
            className="rounded-3xl p-5 font-supreme shadow-sm"
            style={{ backgroundColor: 'var(--dash-card-lavender)', color: '#1b231d' }}
        >
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold font-display" style={{ color: '#1b231d' }}>
                    Community
                </h2>
                <Link
                    href="/community"
                    className="text-xs font-semibold hover:underline"
                    style={{ color: '#3730a3' }}
                >
                    View all
                </Link>
            </div>

            {isLoading ? (
                <div className="space-y-3">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <div className="h-4 w-3/4 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                            <div className="h-3 w-1/2 rounded animate-pulse" style={{ backgroundColor: 'rgba(0,0,0,0.08)' }} />
                        </div>
                    ))}
                </div>
            ) : threads.length === 0 ? (
                <div className="text-center py-6">
                    <MessageSquare className="w-8 h-8 mx-auto mb-2" style={{ color: '#3730a3' }} />
                    <p className="text-sm" style={{ color: '#3730a3' }}>No posts yet</p>
                    <Link
                        href="/community"
                        className="text-xs font-semibold mt-2 inline-block hover:underline"
                        style={{ color: '#3730a3' }}
                    >
                        Start a discussion
                    </Link>
                </div>
            ) : (
                <div className="overflow-y-auto hide-scrollbar" style={{ maxHeight: 200 }}>
                    <div className="space-y-3">
                        {threads.map((thread) => {
                            const authorName = thread.author?.name ||
                                thread.author?.username || 'Anon';
                            const initials = authorName.slice(0, 2).toUpperCase();
                            const catColor = CATEGORY_COLORS[thread.category] || '#4338ca';

                            return (
                                <Link
                                    key={thread.id}
                                    href={`/community/${thread.id}`}
                                    className="block rounded-2xl p-3 mx-0 transition-colors"
                                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.35)')}
                                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = 'transparent')}
                                >
                                    <div className="flex items-start gap-3">
                                        {thread.author?.avatar_url ? (
                                            <img
                                                src={thread.author.avatar_url}
                                                alt={authorName}
                                                width={28}
                                                height={28}
                                                className="w-7 h-7 rounded-full object-cover shrink-0 mt-0.5"
                                            />
                                        ) : (
                                            <div
                                                className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5"
                                                style={{ backgroundColor: 'rgba(255,255,255,0.5)', color: '#1b231d' }}
                                            >
                                                {initials}
                                            </div>
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-1.5">
                                                {thread.is_pinned && (
                                                    <Pin className="w-3 h-3 shrink-0" style={{ color: '#4338ca' }} />
                                                )}
                                                <span className="text-sm font-semibold truncate" style={{ color: '#1b231d' }}>
                                                    {thread.title}
                                                </span>
                                            </div>

                                            <div className="flex items-center gap-2 mt-1 text-[11px]" style={{ color: '#4a3870' }}>
                                                <span className="font-medium">{authorName}</span>
                                                <span>·</span>
                                                <span
                                                    className="px-1.5 py-0.5 rounded-full text-white text-[9px] font-bold uppercase"
                                                    style={{ backgroundColor: catColor }}
                                                >
                                                    {thread.category}
                                                </span>
                                                <span>·</span>
                                                <span>{timeAgo(thread.created_at)}</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 shrink-0" style={{ color: '#4a3870' }}>
                                            <div className="flex items-center gap-0.5" title="Upvotes">
                                                <ArrowUp className="w-3 h-3" />
                                                <span className="text-[11px] font-bold tabular-nums">{thread.upvotes}</span>
                                            </div>
                                            <div className="flex items-center gap-0.5" title="Replies">
                                                <MessageSquare className="w-3 h-3" />
                                                <span className="text-[11px] font-bold tabular-nums">{thread.reply_count}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}
