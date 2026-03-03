/**
 * ReplyCard — single reply visually connected to the thread.
 * Shows accepted-answer highlight, toggle upvote, delete button, and author info.
 */
'use client';

import { ArrowUp, ArrowDown, Check, Trash2 } from 'lucide-react';
import { useTranslations } from 'next-intl';

function timeAgo(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    return new Date(dateStr).toLocaleDateString();
}

export interface ReplyData {
    id: string;
    content: string;
    upvotes: number;
    is_accepted: boolean;
    created_at: string;
    author_id?: string;
    author: { id?: string; name: string | null; avatar_url: string | null };
}

interface ReplyCardProps {
    reply: ReplyData;
    isThreadAuthor: boolean;
    isReplyAuthor: boolean;
    isUpvoted: boolean;
    onUpvote: (replyId: string) => void;
    onAccept: (replyId: string) => void;
    onDelete: (replyId: string) => void;
}

export function ReplyCard({
    reply,
    isThreadAuthor,
    isReplyAuthor,
    isUpvoted,
    onUpvote,
    onAccept,
    onDelete,
}: ReplyCardProps) {
    const t = useTranslations('community');

    return (
        <div className="relative pl-6">
            {/* Vertical connector line */}
            <div
                className="absolute left-3 top-0 bottom-0 w-px"
                style={{ backgroundColor: 'var(--border)' }}
            />
            {/* Horizontal tick */}
            <div
                className="absolute left-3 top-5 w-3 h-px"
                style={{ backgroundColor: 'var(--border)' }}
            />

            <div
                className={`p-4 rounded-2xl border transition-all ${reply.is_accepted
                    ? 'bg-accent/5 border-accent/20'
                    : 'bg-card border-border'
                    }`}
            >
                {/* Accepted badge */}
                {reply.is_accepted && (
                    <div
                        className="flex items-center gap-1.5 text-xs font-medium font-supreme mb-2"
                        style={{ color: 'var(--accent)' }}
                    >
                        <Check className="w-3.5 h-3.5" />
                        {t('acceptedAnswer')}
                    </div>
                )}

                {/* Content */}
                <div className="text-foreground font-supreme text-sm leading-relaxed whitespace-pre-wrap mb-3">
                    {reply.content}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-between">
                    {/* Author + time */}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-supreme">
                        {reply.author.avatar_url ? (
                            <img
                                src={reply.author.avatar_url}
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
                                {(reply.author.name || '?')[0].toUpperCase()}
                            </div>
                        )}
                        <span>{reply.author.name || t('anonymous')}</span>
                        <span className="opacity-40">·</span>
                        <span>{timeAgo(reply.created_at)}</span>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                        {/* Upvote toggle */}
                        <button
                            onClick={() => onUpvote(reply.id)}
                            title={isUpvoted ? t('unlike') : t('like')}
                            className="group relative flex items-center gap-1 rounded-full text-xs font-supreme font-medium transition-all duration-200 overflow-hidden min-h-[32px]"
                            style={{
                                padding: '6px 12px',
                                background: isUpvoted
                                    ? 'linear-gradient(135deg, var(--accent), color-mix(in srgb, var(--accent) 70%, var(--primary)))'
                                    : 'var(--muted)',
                                color: isUpvoted
                                    ? 'var(--accent-foreground)'
                                    : 'var(--muted-foreground)',
                            }}
                        >
                            {isUpvoted ? (
                                <>
                                    <ArrowUp className="w-3 h-3 group-hover:hidden" />
                                    <ArrowDown className="w-3 h-3 hidden group-hover:block" />
                                </>
                            ) : (
                                <ArrowUp className="w-3 h-3 transition-transform duration-300 group-hover:-translate-y-0.5" />
                            )}
                            <span className="tabular-nums">{reply.upvotes}</span>
                        </button>

                        {/* Accept answer */}
                        {isThreadAuthor && !reply.is_accepted && (
                            <button
                                onClick={() => onAccept(reply.id)}
                                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-supreme transition-all min-h-[32px]"
                                style={{
                                    backgroundColor:
                                        'color-mix(in srgb, var(--accent) 10%, transparent)',
                                    color: 'var(--accent)',
                                }}
                            >
                                <Check className="w-3 h-3" />
                                {t('acceptAnswer')}
                            </button>
                        )}

                        {/* Delete */}
                        {isReplyAuthor && (
                            <button
                                onClick={() => onDelete(reply.id)}
                                className="flex items-center gap-1 px-2 py-1.5 rounded-lg text-xs font-supreme text-muted-foreground hover:text-red-500 transition-colors min-h-[32px]"
                                title={t('deleteReply')}
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
