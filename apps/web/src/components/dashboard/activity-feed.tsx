'use client';

import { useTranslations } from 'next-intl';
import type { ActivityFeedItem } from '@/lib/mock-data';

interface ActivityFeedProps {
  items: ActivityFeedItem[];
}

function getIcon(type: ActivityFeedItem['type']): string {
  switch (type) {
    case 'lesson_completed': return '📖';
    case 'xp_earned': return '✨';
    case 'badge_earned': return '🏅';
    case 'course_enrolled': return '📚';
    case 'course_completed': return '🎓';
    case 'streak_milestone': return '🔥';
  }
}

function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return '<1h';
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d`;
  return date.toLocaleDateString();
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  const t = useTranslations('dashboard');

  return (
    <div className="rounded-xl border bg-card p-6">
      <h3 className="mb-4 text-lg font-semibold">{t('recentActivity')}</h3>
      <div className="space-y-3">
        {items.map((item) => (
          <div key={item.id} className="flex items-start gap-3">
            <span className="mt-0.5 text-lg">{getIcon(item.type)}</span>
            <div className="flex-1 min-w-0">
              <p className="text-sm">{item.description}</p>
              {item.xp && (
                <span className="text-xs font-medium text-emerald-500">+{item.xp} XP</span>
              )}
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {formatTime(item.timestamp)}
            </span>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground">{t('noActivity')}</p>
        )}
      </div>
    </div>
  );
}
