'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useWallet } from '@solana/wallet-adapter-react';
import { ArrowLeft } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { ThreadDetail } from '@/components/community/thread-detail';
import { ReplyForm } from '@/components/community/reply-form';
import {
  getThread,
  createReply,
  voteThread,
  voteReply,
  type Thread,
} from '@/lib/supabase/forum';

export default function ThreadPage() {
  const t = useTranslations('community');
  const { threadId } = useParams<{ threadId: string }>();
  const { publicKey } = useWallet();
  const replyFormRef = useRef<HTMLDivElement>(null);

  const [thread, setThread] = useState<Thread | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  const fetchThread = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await getThread(threadId);
      if (!data) {
        setNotFound(true);
      } else {
        setThread(data);
      }
    } finally {
      setIsLoading(false);
    }
  }, [threadId]);

  useEffect(() => {
    fetchThread();
  }, [fetchThread]);

  async function handleVoteThread(direction: 'up' | 'down') {
    await voteThread(threadId, direction);
    await fetchThread();
  }

  async function handleVoteReply(replyId: string, direction: 'up' | 'down') {
    await voteReply(replyId, direction);
    await fetchThread();
  }

  async function handleSubmitReply(body: string) {
    if (!publicKey) return;
    await createReply(threadId, {
      body,
      authorWallet: publicKey.toBase58(),
    });
    await fetchThread();
  }

  function scrollToReplyForm() {
    replyFormRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  if (isLoading) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-6 w-3/4" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  if (notFound || !thread) {
    return (
      <div className="mx-auto flex w-full max-w-4xl flex-col items-center gap-4 py-16">
        <h2 className="text-xl font-semibold">{t('thread_not_found')}</h2>
        <p className="text-muted-foreground text-sm">{t('thread_not_found_desc')}</p>
        <Button variant="outline" asChild>
          <Link href="/community">
            <ArrowLeft className="mr-1.5 size-4" />
            {t('back_to_forum')}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-6">
      {/* Back navigation */}
      <Button variant="ghost" size="sm" className="w-fit" asChild>
        <Link href="/community">
          <ArrowLeft className="mr-1.5 size-4" />
          {t('back_to_forum')}
        </Link>
      </Button>

      {/* Thread detail */}
      <ThreadDetail
        thread={thread}
        onVoteThread={handleVoteThread}
        onVoteReply={handleVoteReply}
        onReplyClick={scrollToReplyForm}
      />

      <Separator />

      {/* Reply form */}
      <div ref={replyFormRef}>
        <h3 className="mb-3 text-lg font-semibold">{t('leave_reply')}</h3>
        <ReplyForm onSubmit={handleSubmitReply} />
      </div>
    </div>
  );
}
