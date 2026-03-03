/**
 * CommunityPageContent — main community forum shell.
 * Full-width banner matching challenges page, badge-chip category filter with
 * "New Thread" button inline, thread list, and pagination.
 * Uses skeleton loading, native brand tokens, Lucide icons, and i18n.
 */
'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { BANNER } from '@/lib/banner-constants';
import {
    Plus,
    X,
    MessageSquare,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react';

import { CategoryFilter, type Category } from './CategoryFilter';
import { ThreadCard, type ThreadData } from './ThreadCard';
import { NewThreadForm } from './NewThreadForm';
import { CommunitySkeleton } from './CommunitySkeleton';
import { CommunityEmptyState } from './CommunityEmptyState';
import { goeyToast } from 'goey-toast';

export function CommunityPageContent() {
    const t = useTranslations('community');
    const { data: session } = useSession();
    const [threads, setThreads] = useState<ThreadData[]>([]);
    const [category, setCategory] = useState<Category>('all');
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [hasMore, setHasMore] = useState(true);
    const [showForm, setShowForm] = useState(false);

    const fetchThreads = useCallback(async () => {
        setLoading(true);
        const params = new URLSearchParams({ page: String(page) });
        if (category !== 'all') params.set('category', category);

        try {
            const res = await fetch(`/api/community/threads?${params}`);
            if (res.ok) {
                const data = await res.json();
                setThreads(data.threads ?? []);
                setHasMore((data.threads ?? []).length === 20);
            } else if (res.status === 429) {
                goeyToast.warning(t('rateLimitTitle'), { description: t('rateLimitMessage') });
            }
        } catch {
            goeyToast.error(t('networkError'));
        }
        setLoading(false);
    }, [category, page, t]);

    useEffect(() => {
        fetchThreads();
    }, [fetchThreads]);

    const handleCategoryChange = (cat: Category) => {
        setCategory(cat);
        setPage(1);
    };

    const handleNewThread = async (data: { title: string; content: string; category: string }) => {
        try {
            const res = await fetch('/api/community/threads', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (res.ok) {
                setShowForm(false);
                setPage(1);
                fetchThreads();
                goeyToast.success(t('threadCreated'));
            } else if (res.status === 429) {
                goeyToast.warning(t('rateLimitTitle'), { description: t('rateLimitMessage') });
            } else {
                const err = await res.json().catch(() => null);
                goeyToast.error(err?.error || t('threadCreateFailed'));
            }
        } catch {
            goeyToast.error(t('networkError'));
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-4 sm:space-y-6">
            {/* ── Banner — full-width, matching /challenges ── */}
            <div className="relative w-full aspect-[21/9] sm:aspect-[3/1] md:aspect-[4/1] rounded-2xl overflow-hidden">
                <Image
                    src={BANNER.community.src}
                    alt="Community"
                    width={1400}
                    height={400}
                    sizes="100vw"
                    placeholder="blur"
                    blurDataURL={BANNER.community.blur}
                    className="absolute inset-0 w-full h-full object-cover object-center"
                    priority
                />
                {/* Gradient overlay — stronger for text readability over image text */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-6 md:p-8">
                    <div className="flex items-center gap-2 sm:gap-3 mb-0.5 sm:mb-2">
                        <div className="w-7 h-7 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-brand-green-emerald/90 flex items-center justify-center">
                            <MessageSquare className="w-3.5 h-3.5 sm:w-5 sm:h-5 text-white" />
                        </div>
                        <h1 className="font-display text-base sm:text-xl md:text-3xl font-bold text-white drop-shadow-lg">
                            {t('title')}
                        </h1>
                    </div>
                    <p className="font-supreme text-[11px] sm:text-xs md:text-sm text-white/90 max-w-xl drop-shadow-md">
                        {t('subtitle')}
                    </p>
                </div>
            </div>

            {/* ── Filter row — category chips + New Thread button ── */}
            <CategoryFilter
                active={category}
                onChange={handleCategoryChange}
                trailing={
                    session ? (
                        <button
                            onClick={() => setShowForm(!showForm)}
                            className={`inline-flex items-center gap-1.5 rounded-full text-xs sm:text-sm font-medium font-supreme whitespace-nowrap transition-all duration-150 px-3 py-1.5 sm:px-4 sm:py-2 border min-h-[36px] shrink-0 ${showForm
                                ? 'bg-muted text-muted-foreground border-border/60 hover:border-border'
                                : 'bg-accent text-accent-foreground border-transparent'
                                }`}
                        >
                            {showForm ? (
                                <>
                                    <X className="w-3.5 h-3.5" />
                                    {t('cancel')}
                                </>
                            ) : (
                                <>
                                    <Plus className="w-3.5 h-3.5" />
                                    {t('newThread')}
                                </>
                            )}
                        </button>
                    ) : undefined
                }
            />

            {/* New thread form */}
            {showForm && (
                <NewThreadForm
                    onSubmit={handleNewThread}
                    onCancel={() => setShowForm(false)}
                />
            )}

            {/* Thread list */}
            {loading ? (
                <CommunitySkeleton />
            ) : threads.length === 0 ? (
                <CommunityEmptyState
                    onNewThread={session ? () => setShowForm(true) : undefined}
                />
            ) : (
                <div className="space-y-3">
                    {threads.map((thread) => (
                        <ThreadCard key={thread.id} thread={thread} />
                    ))}
                </div>
            )}

            {/* Pagination */}
            {!loading && threads.length > 0 && (
                <div className="flex items-center justify-center gap-3 mt-8">
                    <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-supreme text-sm hover:bg-muted/80 disabled:opacity-30 transition-all min-h-[44px]"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        {t('previous')}
                    </button>
                    <span className="px-3 py-2 text-sm text-muted-foreground font-supreme tabular-nums">
                        {t('page', { page })}
                    </span>
                    <button
                        onClick={() => setPage((p) => p + 1)}
                        disabled={!hasMore}
                        className="inline-flex items-center gap-1 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground font-supreme text-sm hover:bg-muted/80 disabled:opacity-30 transition-all min-h-[44px]"
                    >
                        {t('next')}
                        <ChevronRight className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}
