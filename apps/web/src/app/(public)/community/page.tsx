'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { ThreadList } from '@/components/community/thread-list';
import { CreateThreadModal } from '@/components/community/create-thread-modal';
import { communityService } from '@/services/community.service';
import type { Thread, ThreadCategory } from '@/services/community.service';

const CATEGORIES: Array<{ key: string; value: ThreadCategory | undefined }> = [
  { key: 'all', value: undefined },
  { key: 'general', value: 'general' },
  { key: 'help', value: 'help' },
  { key: 'showAndTell', value: 'show-and-tell' },
  { key: 'courseDiscussion', value: 'course-discussion' },
];

export default function CommunityPage() {
  const t = useTranslations('community');
  const [threads, setThreads] = useState<Thread[]>([]);
  const [activeCategory, setActiveCategory] = useState<ThreadCategory | undefined>(undefined);

  const loadThreads = useCallback(async () => {
    const data = await communityService.getThreads(activeCategory);
    setThreads(data);
  }, [activeCategory]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  const handleCreateThread = async (data: { title: string; content: string; category: ThreadCategory }) => {
    await communityService.createThread({
      ...data,
      authorName: 'You',
      authorImage: null,
    });
    loadThreads();
  };

  return (
    <div className="container py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('title')}</h1>
          <p className="mt-1 text-muted-foreground">{t('subtitle')}</p>
        </div>
        <CreateThreadModal onSubmit={handleCreateThread} />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {CATEGORIES.map((cat) => (
          <Button
            key={cat.key}
            variant={activeCategory === cat.value ? 'default' : 'outline'}
            size="sm"
            onClick={() => setActiveCategory(cat.value)}
          >
            {t(`categories.${cat.key}`)}
          </Button>
        ))}
      </div>

      <div className="mt-6">
        <ThreadList threads={threads} />
      </div>
    </div>
  );
}
