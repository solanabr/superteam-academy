'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { ArrowLeft, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { communityService } from '@/services/community.service';
import type { Thread, Reply } from '@/services/community.service';

interface ThreadDetailProps {
  threadId: string;
}

export function ThreadDetail({ threadId }: ThreadDetailProps) {
  const t = useTranslations('community');
  const [thread, setThread] = useState<Thread | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyContent, setReplyContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [threadData, repliesData] = await Promise.all([
        communityService.getThread(threadId),
        communityService.getReplies(threadId),
      ]);
      setThread(threadData);
      setReplies(repliesData);
      setLoading(false);
    };
    load();
  }, [threadId]);

  const handleReply = async () => {
    if (!replyContent.trim()) return;
    const reply = await communityService.createReply({
      threadId,
      content: replyContent.trim(),
      authorName: 'You',
      authorImage: null,
    });
    setReplies((prev) => [...prev, reply]);
    setReplyContent('');
  };

  if (loading) {
    return <div className="py-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!thread) {
    return <div className="py-8 text-center text-muted-foreground">Thread not found</div>;
  }

  return (
    <div className="space-y-6">
      <Link href="/community" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="h-4 w-4" />
        {t('backToThreads')}
      </Link>

      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-2">
          <Badge variant="secondary">{thread.category}</Badge>
          <span className="text-xs text-muted-foreground">
            {t('postedBy')} {thread.authorName}
          </span>
        </div>
        <h1 className="mt-3 text-2xl font-bold">{thread.title}</h1>
        <p className="mt-3 whitespace-pre-wrap text-muted-foreground">{thread.content}</p>
      </div>

      <div className="space-y-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <MessageSquare className="h-4 w-4" />
          {replies.length} {t('replies')}
        </h2>

        {replies.map((reply) => (
          <div key={reply.id} className="rounded-lg border bg-card p-4">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">{reply.authorName[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium">{reply.authorName}</span>
              <span className="text-xs text-muted-foreground">
                {new Date(reply.createdAt).toLocaleDateString()}
              </span>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">{reply.content}</p>
          </div>
        ))}

        <div className="space-y-2">
          <Textarea
            value={replyContent}
            onChange={(e) => setReplyContent(e.target.value)}
            placeholder={t('replyPlaceholder')}
            rows={3}
          />
          <Button onClick={handleReply} disabled={!replyContent.trim()} size="sm">
            {t('postReply')}
          </Button>
        </div>
      </div>
    </div>
  );
}
