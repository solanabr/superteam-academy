/**
 * ThreadDetailContent — full thread detail view with replies.
 * Features: upvote toggle with server-synced counts, ArrowDown on unlike hover,
 * delete via ConfirmModal, goeyToast for all event feedback (including 429 rate limit).
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { Link, useRouter } from '@/context/i18n/navigation';
import { ArrowLeft, ArrowUp, ArrowDown, Pin, Lock, Trash2 } from 'lucide-react';
import { goeyToast } from 'goey-toast';

import { ReplyCard, type ReplyData } from './ReplyCard';
import { ConfirmModal } from './ConfirmModal';

interface Author {
    id?: string;
    name: string | null;
    avatar_url: string | null;
}

interface ThreadDetail {
    id: string;
    title: string;
    content: string;
    category: string;
    upvotes: number;
    reply_count: number;
    is_pinned: boolean;
    is_locked: boolean;
    created_at: string;
    author_id: string;
    author: Author;
}

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
    return new Date(dateStr).toLocaleDateString();
}

/* ── Skeleton ── */
function ThreadDetailSkeleton() {
    return (
        <div className="max-w-7xl mx-auto space-y-4">
            <div className="h-4 w-32 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--muted)' }} />
            <div className="h-[200px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--muted)' }} />
            <div className="h-6 w-24 rounded-lg animate-pulse" style={{ backgroundColor: 'var(--muted)' }} />
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-[100px] rounded-2xl animate-pulse" style={{ backgroundColor: 'var(--muted)' }} />
            ))}
        </div>
    );
}

export function ThreadDetailContent({ threadId }: { threadId: string }) {
    const t = useTranslations('community');
    const router = useRouter();
    const { data: session } = useSession();
    const [thread, setThread] = useState<ThreadDetail | null>(null);
    const [replies, setReplies] = useState<ReplyData[]>([]);
    const [loading, setLoading] = useState(true);
    const [replyContent, setReplyContent] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [upvoted, setUpvoted] = useState(false);
    const [upvoteAnimating, setUpvoteAnimating] = useState(false);
    const [replyUpvotes, setReplyUpvotes] = useState<Record<string, boolean>>({});

    // Confirm modal state
    const [confirmModal, setConfirmModal] = useState<{
        open: boolean;
        title: string;
        message: string;
        onConfirm: () => void;
    }>({ open: false, title: '', message: '', onConfirm: () => { } });

    const closeModal = () => setConfirmModal((prev) => ({ ...prev, open: false }));

    /** Handle API errors — goeyToast with rate-limit or generic error */
    const handleApiError = useCallback(async (res: Response, fallbackMsg: string) => {
        if (res.status === 429) {
            goeyToast.warning(t('rateLimitTitle'), { description: t('rateLimitMessage') });
        } else {
            try {
                const data = await res.json();
                goeyToast.error(data?.error || fallbackMsg);
            } catch {
                goeyToast.error(fallbackMsg);
            }
        }
    }, [t]);

    const fetchThread = useCallback(async () => {
        try {
            const res = await fetch(`/api/community/threads/${threadId}`);
            if (res.ok) {
                const data = await res.json();
                setThread(data);
            }
        } catch { /* ignore */ }
    }, [threadId]);

    const fetchReplies = useCallback(async () => {
        try {
            const res = await fetch(`/api/community/threads/${threadId}/replies`);
            if (res.ok) {
                const data = await res.json();
                setReplies(Array.isArray(data) ? data : (data.replies || []));
            }
        } catch { /* ignore */ }
    }, [threadId]);

    // Initial load
    useEffect(() => {
        setLoading(true);
        Promise.all([fetchThread(), fetchReplies()]).finally(() => setLoading(false));
    }, [fetchThread, fetchReplies]);

    /* ── Reply submit (optimistic + toast) ── */
    const handleReply = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!replyContent.trim()) return;
        setSubmitting(true);
        const content = replyContent;

        const optimisticId = `optimistic-${Date.now()}`;
        const optimisticReply: ReplyData = {
            id: optimisticId,
            content,
            upvotes: 0,
            is_accepted: false,
            created_at: new Date().toISOString(),
            author_id: session?.user?.id || undefined,
            author: {
                id: session?.user?.id || undefined,
                name: session?.user?.name || null,
                avatar_url: session?.user?.image || null,
            },
        };

        setReplies((prev) => [...prev, optimisticReply]);
        setThread((prev) => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev);
        setReplyContent('');

        try {
            const res = await fetch(`/api/community/threads/${threadId}/replies`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content }),
            });
            if (res.ok) {
                const data = await res.json();
                if (data?.id) {
                    setReplies((prev) => prev.map((r) => (r.id === optimisticId ? data : r)));
                } else {
                    fetchReplies();
                }
                goeyToast.success(t('replyPosted'));
            } else {
                setReplies((prev) => prev.filter((r) => r.id !== optimisticId));
                setThread((prev) => prev ? { ...prev, reply_count: prev.reply_count - 1 } : prev);
                setReplyContent(content);
                await handleApiError(res, t('replyFailed'));
            }
        } catch {
            setReplies((prev) => prev.filter((r) => r.id !== optimisticId));
            setThread((prev) => prev ? { ...prev, reply_count: prev.reply_count - 1 } : prev);
            setReplyContent(content);
            goeyToast.error(t('networkError'));
        }
        setSubmitting(false);
    };

    /* ── Thread upvote toggle — server-synced + toast on 429 ── */
    const handleUpvote = async () => {
        if (!thread) return;
        const wasUpvoted = upvoted;
        const newUpvoted = !wasUpvoted;
        const delta = newUpvoted ? 1 : -1;

        setUpvoted(newUpvoted);
        setThread((prev) => prev ? { ...prev, upvotes: prev.upvotes + delta } : prev);

        if (newUpvoted) {
            setUpvoteAnimating(true);
            setTimeout(() => setUpvoteAnimating(false), 400);
        }

        try {
            const res = await fetch(`/api/community/threads/${threadId}/upvote`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setUpvoted(data.upvoted);
                if (data.upvotes !== undefined) {
                    setThread((prev) => prev ? { ...prev, upvotes: data.upvotes } : prev);
                }
            } else {
                setUpvoted(wasUpvoted);
                setThread((prev) => prev ? { ...prev, upvotes: prev.upvotes - delta } : prev);
                await handleApiError(res, t('upvoteFailed'));
            }
        } catch {
            setUpvoted(wasUpvoted);
            setThread((prev) => prev ? { ...prev, upvotes: prev.upvotes - delta } : prev);
            goeyToast.error(t('networkError'));
        }
    };

    /* ── Reply upvote toggle — server-synced + toast on 429 ── */
    const handleReplyUpvote = async (replyId: string) => {
        const wasUpvoted = !!replyUpvotes[replyId];
        const newUpvoted = !wasUpvoted;
        const delta = newUpvoted ? 1 : -1;

        setReplyUpvotes((prev) => ({ ...prev, [replyId]: newUpvoted }));
        setReplies((prev) =>
            prev.map((r) => (r.id === replyId ? { ...r, upvotes: r.upvotes + delta } : r))
        );

        try {
            const res = await fetch(`/api/community/replies/${replyId}/upvote`, { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setReplyUpvotes((prev) => ({ ...prev, [replyId]: data.upvoted }));
                if (data.upvotes !== undefined) {
                    setReplies((prev) =>
                        prev.map((r) => (r.id === replyId ? { ...r, upvotes: data.upvotes } : r))
                    );
                }
            } else {
                setReplyUpvotes((prev) => ({ ...prev, [replyId]: wasUpvoted }));
                setReplies((prev) =>
                    prev.map((r) => (r.id === replyId ? { ...r, upvotes: r.upvotes - delta } : r))
                );
                await handleApiError(res, t('upvoteFailed'));
            }
        } catch {
            setReplyUpvotes((prev) => ({ ...prev, [replyId]: wasUpvoted }));
            setReplies((prev) =>
                prev.map((r) => (r.id === replyId ? { ...r, upvotes: r.upvotes - delta } : r))
            );
            goeyToast.error(t('networkError'));
        }
    };

    /* ── Accept answer ── */
    const handleAcceptAnswer = async (replyId: string) => {
        setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, is_accepted: true } : r)));
        try {
            const res = await fetch(`/api/community/replies/${replyId}/accept`, { method: 'POST' });
            if (res.ok) {
                goeyToast.success(t('answerAccepted'));
            } else {
                setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, is_accepted: false } : r)));
                await handleApiError(res, t('acceptFailed'));
            }
        } catch {
            setReplies((prev) => prev.map((r) => (r.id === replyId ? { ...r, is_accepted: false } : r)));
            goeyToast.error(t('networkError'));
        }
    };

    /* ── Delete thread (via modal + toast) ── */
    const handleDeleteThread = () => {
        setConfirmModal({
            open: true,
            title: t('deleteThread'),
            message: t('confirmDeleteThread'),
            onConfirm: async () => {
                closeModal();
                try {
                    const res = await fetch(`/api/community/threads/${threadId}`, { method: 'DELETE' });
                    if (res.ok) {
                        goeyToast.success(t('threadDeleted'));
                        setTimeout(() => router.push('/community'), 800);
                    } else {
                        await handleApiError(res, t('deleteFailed'));
                    }
                } catch {
                    goeyToast.error(t('networkError'));
                }
            },
        });
    };

    /* ── Delete reply (via modal + toast, optimistic) ── */
    const handleDeleteReply = (replyId: string) => {
        setConfirmModal({
            open: true,
            title: t('deleteReply'),
            message: t('confirmDeleteReply'),
            onConfirm: async () => {
                closeModal();
                const removedReply = replies.find((r) => r.id === replyId);
                setReplies((prev) => prev.filter((r) => r.id !== replyId));
                setThread((prev) => prev ? { ...prev, reply_count: prev.reply_count - 1 } : prev);

                try {
                    const res = await fetch(`/api/community/replies/${replyId}`, { method: 'DELETE' });
                    if (res.ok) {
                        goeyToast.success(t('replyDeleted'));
                    } else {
                        if (removedReply) {
                            setReplies((prev) => [...prev, removedReply]);
                            setThread((prev) => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev);
                        }
                        await handleApiError(res, t('deleteFailed'));
                    }
                } catch {
                    if (removedReply) {
                        setReplies((prev) => [...prev, removedReply]);
                        setThread((prev) => prev ? { ...prev, reply_count: prev.reply_count + 1 } : prev);
                    }
                    goeyToast.error(t('networkError'));
                }
            },
        });
    };

    if (loading) return <ThreadDetailSkeleton />;

    if (!thread) {
        return (
            <div className="max-w-7xl mx-auto text-center py-20">
                <p className="text-lg text-muted-foreground font-supreme mb-4">Thread not found</p>
                <Link href="/community" className="text-sm font-supreme font-medium text-primary hover:underline">
                    {t('backToForum')}
                </Link>
            </div>
        );
    }

    const catColor = CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.general;
    const userId = session?.user?.id;
    const isThreadAuthor = userId === thread.author_id || userId === thread.author?.id;

    return (
        <div className="max-w-7xl mx-auto">
            {/* Confirm modal */}
            <ConfirmModal
                open={confirmModal.open}
                title={confirmModal.title}
                message={confirmModal.message}
                confirmLabel={t('deleteThread').split(' ')[0]}
                cancelLabel={t('cancel')}
                onConfirm={confirmModal.onConfirm}
                onCancel={closeModal}
            />

            {/* Breadcrumb */}
            <Link
                href="/community"
                className="inline-flex items-center gap-1.5 text-sm font-supreme text-muted-foreground hover:text-foreground transition-colors mb-6"
            >
                <ArrowLeft className="w-4 h-4" />
                {t('backToForum')}
            </Link>

            {/* Thread card */}
            <div className="p-6 rounded-2xl bg-card border border-border">
                {/* Badges */}
                <div className="flex items-center gap-2 mb-3">
                    {thread.is_pinned && (
                        <span className="flex items-center gap-1 text-xs text-primary font-medium font-supreme">
                            <Pin className="w-3 h-3" />
                            {t('pinned')}
                        </span>
                    )}
                    {thread.is_locked && (
                        <span className="flex items-center gap-1 text-xs font-medium font-supreme" style={{ color: 'var(--community-cat-help, #ffd23f)' }}>
                            <Lock className="w-3 h-3" />
                            {t('locked')}
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

                <h1 className="text-xl font-bold text-foreground font-display mb-4 leading-snug">
                    {thread.title}
                </h1>

                <div className="text-foreground font-supreme text-sm leading-relaxed whitespace-pre-wrap mb-6">
                    {thread.content}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-supreme">
                        {thread.author.avatar_url ? (
                            <img src={thread.author.avatar_url} alt="" className="w-5 h-5 rounded-full" />
                        ) : (
                            <div
                                className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                                style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                            >
                                {(thread.author.name || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span className="font-medium">{thread.author.name || t('anonymous')}</span>
                        <span className="opacity-40">·</span>
                        <span>{timeAgo(thread.created_at)}</span>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Upvote toggle — ArrowDown on hover when already liked */}
                        <button
                            onClick={handleUpvote}
                            title={upvoted ? t('unlike') : t('like')}
                            className="group relative flex items-center gap-1.5 rounded-full text-sm font-supreme font-medium transition-all duration-200 min-h-[40px] overflow-hidden"
                            style={{
                                padding: '8px 16px',
                                background: upvoted
                                    ? 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, var(--primary)))'
                                    : 'var(--muted)',
                                color: upvoted ? 'var(--accent-foreground)' : 'var(--muted-foreground)',
                            }}
                        >
                            {upvoted ? (
                                <>
                                    <ArrowUp className="w-4 h-4 group-hover:hidden" style={{
                                        animation: upvoteAnimating ? 'upvote-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
                                    }} />
                                    <ArrowDown className="w-4 h-4 hidden group-hover:block" />
                                </>
                            ) : (
                                <ArrowUp className="w-4 h-4 transition-transform duration-300 group-hover:-translate-y-0.5" style={{
                                    animation: upvoteAnimating ? 'upvote-bounce 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)' : undefined,
                                }} />
                            )}
                            <span className="tabular-nums">{thread.upvotes}</span>
                            {upvoteAnimating && (
                                <span
                                    className="absolute inset-0 pointer-events-none"
                                    style={{
                                        background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.2) 50%, transparent 100%)',
                                        animation: 'upvote-shine 0.6s ease-out forwards',
                                    }}
                                />
                            )}
                        </button>

                        {/* Delete thread */}
                        {isThreadAuthor && (
                            <button
                                onClick={handleDeleteThread}
                                title={t('deleteThread')}
                                className="flex items-center gap-1 px-3 py-2 rounded-full text-xs font-supreme text-muted-foreground hover:text-red-500 transition-colors min-h-[40px]"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Replies — visually connected ── */}
            <div className="mt-2 mb-8">
                <h2 className="text-base font-semibold text-foreground font-supreme mb-4 pl-6">
                    {t('replies', { count: replies.length })}
                </h2>

                <div className="space-y-3">
                    {replies.map((reply) => (
                        <ReplyCard
                            key={reply.id}
                            reply={reply}
                            isThreadAuthor={isThreadAuthor}
                            isReplyAuthor={userId === (reply.author_id || reply.author?.id)}
                            isUpvoted={!!replyUpvotes[reply.id]}
                            onUpvote={handleReplyUpvote}
                            onAccept={handleAcceptAnswer}
                            onDelete={handleDeleteReply}
                        />
                    ))}
                </div>
            </div>

            {/* Reply form */}
            {session && !thread.is_locked ? (
                <form onSubmit={handleReply} className="p-5 rounded-2xl bg-card border border-border">
                    <textarea
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder={t('writeReply')}
                        rows={4}
                        maxLength={10000}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border text-foreground placeholder-muted-foreground font-supreme text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none mb-3 min-h-[44px]"
                    />
                    <button
                        type="submit"
                        disabled={submitting || !replyContent.trim()}
                        className="cta-primary px-6 py-2.5 text-sm font-supreme font-semibold disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px]"
                    >
                        {submitting ? t('posting') : t('postReply')}
                    </button>
                </form>
            ) : thread.is_locked ? (
                <div className="text-center py-4 text-sm text-muted-foreground font-supreme flex items-center justify-center gap-2">
                    <Lock className="w-4 h-4" />
                    {t('threadLocked')}
                </div>
            ) : (
                <div className="text-center py-4">
                    <Link href="/login" className="text-sm font-supreme font-medium text-primary hover:underline">
                        {t('signInToReply')}
                    </Link>
                </div>
            )}
        </div>
    );
}
