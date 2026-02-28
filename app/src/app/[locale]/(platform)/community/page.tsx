'use client';

import { useState, useEffect, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { Plus, Search, SlidersHorizontal } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ThreadList } from '@/components/community/thread-list';
import { NewThreadDialog } from '@/components/community/new-thread-dialog';
import {
  getThreads,
  createThread,
  voteThread,
  type Thread,
  type ThreadCategory,
  type SortOption,
  type CreateThreadInput,
} from '@/lib/supabase/forum';

const CATEGORIES: { value: ThreadCategory | 'all'; label: string }[] = [
  { value: 'all', label: 'All Categories' },
  { value: 'general', label: 'General' },
  { value: 'help', label: 'Help' },
  { value: 'show-and-tell', label: 'Show & Tell' },
  { value: 'ideas', label: 'Ideas' },
];

const SORT_OPTIONS: { value: SortOption; labelKey: string }[] = [
  { value: 'newest', labelKey: 'sort_newest' },
  { value: 'most-votes', labelKey: 'sort_most_votes' },
  { value: 'most-replies', labelKey: 'sort_most_replies' },
];

export default function CommunityPage() {
  const t = useTranslations('community');
  const { connected } = useWallet();

  const [threads, setThreads] = useState<Thread[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [category, setCategory] = useState<ThreadCategory | 'all'>('all');
  const [sort, setSort] = useState<SortOption>('newest');
  const [search, setSearch] = useState('');

  const fetchThreads = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getThreads({
        category: category === 'all' ? null : category,
        search,
        sort,
      });
      setThreads(data);
    } finally {
      setIsLoading(false);
    }
  }, [category, sort, search]);

  useEffect(() => {
    fetchThreads();
  }, [fetchThreads]);

  async function handleVote(threadId: string, direction: 'up' | 'down') {
    await voteThread(threadId, direction);
    await fetchThreads();
  }

  async function handleCreateThread(input: CreateThreadInput) {
    await createThread(input);
    await fetchThreads();
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Page header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-bold tracking-tight">{t('title')}</h1>
        <p className="text-muted-foreground">{t('description')}</p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        {/* Search */}
        <div className="relative max-w-sm flex-1">
          <Search className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('search_placeholder')}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2">
          {/* Category filter */}
          <Select
            value={category}
            onValueChange={(v) => setCategory(v as ThreadCategory | 'all')}
          >
            <SelectTrigger className="w-auto gap-2">
              <SlidersHorizontal className="size-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Sort */}
          <Select
            value={sort}
            onValueChange={(v) => setSort(v as SortOption)}
          >
            <SelectTrigger className="w-auto">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* New Thread button */}
          <NewThreadDialog onSubmit={handleCreateThread}>
            <Button disabled={!connected} size="sm">
              <Plus className="mr-1.5 size-4" />
              {t('new_thread')}
            </Button>
          </NewThreadDialog>
        </div>
      </div>

      {/* Thread list */}
      <ThreadList
        threads={threads}
        isLoading={isLoading}
        onVote={handleVote}
      />
    </div>
  );
}
