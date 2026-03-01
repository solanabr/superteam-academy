'use client';

import { useTranslations } from 'next-intl';
import { MessageSquareOff } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ThreadCard } from '@/components/community/thread-card';
import type { Thread } from '@/lib/supabase/forum';

// ---------------------------------------------------------------------------
// Loading skeleton
// ---------------------------------------------------------------------------

function ThreadSkeleton() {
  return (
    <div className="flex gap-4 rounded-lg border p-4">
      <div className="flex flex-col items-center gap-1">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-4 w-6" />
        <Skeleton className="size-8 rounded-md" />
      </div>
      <div className="flex flex-1 flex-col gap-2">
        <div className="flex gap-2">
          <Skeleton className="h-5 w-16 rounded-full" />
          <Skeleton className="h-5 w-12 rounded-full" />
        </div>
        <Skeleton className="h-5 w-3/4" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-1/2" />
        <div className="flex gap-4">
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-3 w-12" />
          <Skeleton className="h-3 w-12" />
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Empty state
// ---------------------------------------------------------------------------

function EmptyState() {
  const t = useTranslations('community');

  return (
    <div className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-16">
      <MessageSquareOff className="text-muted-foreground size-12" />
      <h3 className="text-lg font-semibold">{t('empty_title')}</h3>
      <p className="text-muted-foreground max-w-sm text-center text-sm">
        {t('empty_description')}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Thread list
// ---------------------------------------------------------------------------

interface ThreadListProps {
  threads: Thread[];
  isLoading: boolean;
  onVote: (threadId: string, direction: 'up' | 'down') => void;
}

export function ThreadList({ threads, isLoading, onVote }: ThreadListProps) {
  if (isLoading) {
    return (
      <div className="flex flex-col gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <ThreadSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (threads.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-3">
      {threads.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} onVote={onVote} />
      ))}
    </div>
  );
}
