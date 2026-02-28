'use client';

import { MessageSquare, Eye } from 'lucide-react';
import { Link } from '@/i18n/routing';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { VoteButtons } from '@/components/community/vote-buttons';
import { cn } from '@/lib/utils';
import type { Thread, ThreadCategory } from '@/lib/supabase/forum';

// ---------------------------------------------------------------------------
// Category styling
// ---------------------------------------------------------------------------

const CATEGORY_STYLES: Record<ThreadCategory, { label: string; className: string }> = {
  general: {
    label: 'General',
    className: 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400',
  },
  help: {
    label: 'Help',
    className: 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400',
  },
  'show-and-tell': {
    label: 'Show & Tell',
    className: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400',
  },
  ideas: {
    label: 'Ideas',
    className: 'bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-400',
  },
};

export { CATEGORY_STYLES };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function truncateWallet(wallet: string): string {
  if (wallet.length <= 8) return wallet;
  return `${wallet.slice(0, 4)}...${wallet.slice(-4)}`;
}

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000,
  );

  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  return `${months}mo ago`;
}

export { truncateWallet, timeAgo };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

interface ThreadCardProps {
  thread: Thread;
  onVote: (threadId: string, direction: 'up' | 'down') => void;
}

export function ThreadCard({ thread, onVote }: ThreadCardProps) {
  const categoryStyle = CATEGORY_STYLES[thread.category];

  return (
    <Card className="gap-0 py-0 transition-colors hover:border-primary/20 dark:hover:border-primary/30">
      <CardContent className="flex gap-4 p-4">
        {/* Vote column */}
        <VoteButtons
          votes={thread.votes}
          userVote={thread.userVote}
          onVote={(dir) => onVote(thread.id, dir)}
          className="shrink-0"
        />

        {/* Content column */}
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          {/* Category + tags row */}
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant="secondary"
              className={cn('border-0', categoryStyle.className)}
            >
              {categoryStyle.label}
            </Badge>
            {thread.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} variant="outline" className="text-xs font-normal">
                {tag}
              </Badge>
            ))}
          </div>

          {/* Title */}
          <Link
            href={`/community/${thread.id}`}
            className="line-clamp-1 text-base font-semibold leading-tight hover:text-primary"
          >
            {thread.title}
          </Link>

          {/* Body preview */}
          <p className="text-muted-foreground line-clamp-2 text-sm leading-relaxed">
            {thread.body}
          </p>

          {/* Meta row */}
          <div className="text-muted-foreground flex flex-wrap items-center gap-4 text-xs">
            <span className="font-mono">{truncateWallet(thread.author.wallet)}</span>
            <span className="text-xs">Lv.{thread.author.level}</span>
            <span className="flex items-center gap-1">
              <MessageSquare className="size-3.5" />
              {thread.replyCount}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="size-3.5" />
              {thread.viewCount}
            </span>
            <span>{timeAgo(thread.createdAt)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
