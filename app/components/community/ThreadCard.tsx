/**
 * ThreadCard — single thread row for the community list.
 * Uses native card design tokens (bg-card, rounded-2xl) and brand category colors.
 * Hit targets ≥ 44px (UX principle #11).
 */

import { Pin, ArrowUp, MessageSquare } from 'lucide-react';
import { Link } from '@/context/i18n/navigation';
import { useTranslations } from 'next-intl';

const CATEGORY_COLORS: Record<string, string> = {
    general: 'var(--community-cat-general, #008c4c)',
    help: 'var(--community-cat-help, #ffd23f)',
    showcase: 'var(--community-cat-showcase, #a78bfa)',
    feedback: 'var(--community-cat-feedback, #f97316)',
};

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
}

export interface ThreadData {
    id: string;
    title: string;
    category: string;
    reply_count: number;
    upvotes: number;
    is_pinned: boolean;
    created_at: string;
    author: { name: string | null; avatar_url: string | null };
}

export function ThreadCard({ thread }: { thread: ThreadData }) {
    const t = useTranslations('community');
    const catColor = CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.general;

    return (
        <Link
            href={`/community/${thread.id}`}
            className={`block p-4 rounded-2xl border transition-all hover:shadow-sm min-h-[72px] ${thread.is_pinned
                    ? 'bg-primary/5 border-primary/20'
                    : 'bg-card border-border hover:border-border/80'
                }`}
        >
            <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                    {/* Category badge + pinned indicator */}
                    <div className="flex items-center gap-2 mb-1.5">
                        {thread.is_pinned && (
                            <span className="flex items-center gap-1 text-xs text-primary font-medium font-supreme">
                                <Pin className="w-3 h-3" />
                                {t('pinned')}
                            </span>
                        )}
                        <span
                            className="text-[11px] font-medium font-supreme px-2 py-0.5 rounded-full"
                            style={{
                                backgroundColor: `color-mix(in srgb, ${catColor} 15%, transparent)`,
                                color: catColor,
                            }}
                        >
                            {thread.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-foreground font-medium font-supreme truncate leading-snug">
                        {thread.title}
                    </h3>

                    {/* Author + time */}
                    <div className="flex items-center gap-2 mt-1.5 text-xs text-muted-foreground font-supreme">
                        {thread.author.avatar_url ? (
                            <img
                                src={thread.author.avatar_url}
                                alt=""
                                className="w-4 h-4 rounded-full"
                            />
                        ) : (
                            <div
                                className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold"
                                style={{
                                    backgroundColor: 'var(--muted)',
                                    color: 'var(--muted-foreground)',
                                }}
                            >
                                {(thread.author.name || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span>{thread.author.name || t('anonymous')}</span>
                        <span className="opacity-40">·</span>
                        <span>{timeAgo(thread.created_at)}</span>
                    </div>
                </div>

                {/* Stats */}
                <div className="flex items-center gap-3 text-xs text-muted-foreground shrink-0 pt-1 font-supreme">
                    <span className="flex items-center gap-1" title="Upvotes">
                        <ArrowUp className="w-3.5 h-3.5" />
                        {thread.upvotes}
                    </span>
                    <span className="flex items-center gap-1" title="Replies">
                        <MessageSquare className="w-3.5 h-3.5" />
                        {thread.reply_count}
                    </span>
                </div>
            </div>
        </Link>
    );
}
