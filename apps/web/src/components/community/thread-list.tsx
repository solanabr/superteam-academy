'use client';

import { useTranslations } from 'next-intl';
import { ThreadCard } from './thread-card';
import type { Thread } from '@/services/community.service';

interface ThreadListProps {
  threads: Thread[];
}

export function ThreadList({ threads }: ThreadListProps) {
  const t = useTranslations('community');

  if (threads.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center text-muted-foreground">
        {t('noThreads')}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {threads.map((thread) => (
        <ThreadCard key={thread.id} thread={thread} />
      ))}
    </div>
  );
}
