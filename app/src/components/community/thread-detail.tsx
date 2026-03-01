'use client';

import { useTranslations } from 'next-intl';
import { MessageSquare } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { LevelBadge } from '@/components/gamification/level-badge';
import { VoteButtons } from '@/components/community/vote-buttons';
import { CATEGORY_STYLES, truncateWallet, timeAgo } from '@/components/community/thread-card';
import { cn } from '@/lib/utils';
import type { Thread } from '@/lib/supabase/forum';

interface ThreadDetailProps {
  thread: Thread;
  onVoteThread: (direction: 'up' | 'down') => void;
  onVoteReply: (replyId: string, direction: 'up' | 'down') => void;
  onReplyClick: () => void;
}

export function ThreadDetail({
  thread,
  onVoteThread,
  onVoteReply,
  onReplyClick,
}: ThreadDetailProps) {
  const t = useTranslations('community');
  const categoryStyle = CATEGORY_STYLES[thread.category];

  return (
    <div className="flex flex-col gap-6">
      {/* Thread header */}
      <div className="flex gap-4">
        <VoteButtons
          votes={thread.votes}
          userVote={thread.userVote}
          onVote={onVoteThread}
          className="shrink-0 pt-1"
        />

        <div className="flex min-w-0 flex-1 flex-col gap-3">
          {/* Category + tags */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('border-0', categoryStyle.className)}
            >
              {categoryStyle.label}
            </Badge>
            {thread.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <h1 className="text-2xl font-bold tracking-tight">{thread.title}</h1>

          {/* Author header */}
          <div className="flex items-center gap-3">
            <LevelBadge
              level={thread.author.level}
              title={thread.author.levelTitle}
              size="sm"
            />
            <div className="flex flex-col">
              <span className="font-mono text-sm">
                {truncateWallet(thread.author.wallet)}
              </span>
              <span className="text-muted-foreground text-xs">
                {timeAgo(thread.createdAt)}
              </span>
            </div>
          </div>

          {/* Body */}
          <div className="prose prose-sm dark:prose-invert max-w-none whitespace-pre-wrap leading-relaxed">
            {thread.body}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={onReplyClick}>
              <MessageSquare className="mr-1.5 size-4" />
              {t('reply')}
            </Button>
          </div>
        </div>
      </div>

      <Separator />

      {/* Replies */}
      <div className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {t('replies_count', { count: thread.replies.length })}
        </h2>

        {thread.replies.length === 0 && (
          <p className="text-muted-foreground py-8 text-center text-sm">
            {t('no_replies')}
          </p>
        )}

        <div className="flex flex-col gap-4 pt-2">
          {thread.replies.map((reply) => (
            <div
              key={reply.id}
              className="flex gap-4 rounded-lg border bg-muted/30 p-4"
            >
              <VoteButtons
                votes={reply.votes}
                userVote={reply.userVote}
                onVote={(dir) => onVoteReply(reply.id, dir)}
                className="shrink-0"
              />

              <div className="flex min-w-0 flex-1 flex-col gap-2">
                {/* Reply author */}
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs">
                    {truncateWallet(reply.author.wallet)}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    Lv.{reply.author.level}
                  </span>
                  <span className="text-muted-foreground text-xs">
                    {timeAgo(reply.createdAt)}
                  </span>
                </div>

                {/* Reply body */}
                <div className="whitespace-pre-wrap text-sm leading-relaxed">
                  {reply.body}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
