'use client';

import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { MessageSquare, Eye, Pin } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { Thread } from '@/services/community.service';

const categoryColors: Record<string, string> = {
  general: 'bg-blue-500/10 text-blue-500',
  help: 'bg-orange-500/10 text-orange-500',
  'show-and-tell': 'bg-green-500/10 text-green-500',
  'course-discussion': 'bg-purple-500/10 text-purple-500',
};

const categoryKeys: Record<string, string> = {
  general: 'general',
  help: 'help',
  'show-and-tell': 'showAndTell',
  'course-discussion': 'courseDiscussion',
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const hours = Math.floor(diff / 3600000);
  if (hours < 1) return '< 1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

interface ThreadCardProps {
  thread: Thread;
}

export function ThreadCard({ thread }: ThreadCardProps) {
  const t = useTranslations('community');

  return (
    <Link
      href={`/community/${thread.id}`}
      className="group block rounded-xl border bg-card p-4 transition-colors hover:border-primary/50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            {thread.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
            <h3 className="truncate font-semibold group-hover:text-primary">
              {thread.title}
            </h3>
          </div>
          <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
            {thread.content}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <Badge variant="secondary" className={categoryColors[thread.category]}>
              {t(`categories.${categoryKeys[thread.category]}`)}
            </Badge>
            <span>{t('postedBy')} {thread.authorName}</span>
            <span>{timeAgo(thread.createdAt)} {t('ago')}</span>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <MessageSquare className="h-3.5 w-3.5" /> {thread.replyCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3.5 w-3.5" /> {thread.viewCount}
          </span>
        </div>
      </div>
    </Link>
  );
}
