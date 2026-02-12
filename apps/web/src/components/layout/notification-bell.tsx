'use client';

import { useState, useEffect, useRef } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Bell, Check, CheckCheck } from 'lucide-react';
import { mockNotifications, type MockNotification } from '@/lib/mock-data';

export function NotificationBell() {
  const t = useTranslations('notifications');
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<MockNotification[]>(mockNotifications.filter((n) => n.userId === 'u-1'));
  const ref = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function markAsRead(id: string) {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }

  function markAllAsRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  function formatTime(timestamp: string): string {
    const diff = Date.now() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / 3600000);
    if (hours < 1) return t('justNow');
    if (hours < 24) return t('hoursAgo', { count: hours });
    const days = Math.floor(hours / 24);
    return t('daysAgo', { count: days });
  }

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" size="icon" onClick={() => setOpen(!open)} className="relative">
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] font-bold text-destructive-foreground">
            {unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-lg border bg-popover shadow-lg sm:w-96">
          <div className="flex items-center justify-between p-4">
            <h3 className="font-semibold">{t('title')}</h3>
            {unreadCount > 0 && (
              <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={markAllAsRead}>
                <CheckCheck className="h-3 w-3" />
                {t('markAllRead')}
              </Button>
            )}
          </div>
          <Separator />
          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="p-4 text-center text-sm text-muted-foreground">{t('noNotifications')}</p>
            ) : (
              notifications.map((notif) => (
                <div key={notif.id} className={`flex gap-3 p-3 transition-colors hover:bg-accent/50 ${!notif.read ? 'bg-primary/5' : ''}`}>
                  <span className="mt-0.5 text-lg">{notif.icon}</span>
                  <div className="flex-1 min-w-0">
                    {notif.actionUrl ? (
                      <Link href={notif.actionUrl} onClick={() => { markAsRead(notif.id); setOpen(false); }}>
                        <p className="text-sm font-medium hover:underline">{notif.title}</p>
                      </Link>
                    ) : (
                      <p className="text-sm font-medium">{notif.title}</p>
                    )}
                    <p className="text-xs text-muted-foreground truncate">{notif.message}</p>
                    <p className="text-xs text-muted-foreground mt-1">{formatTime(notif.timestamp)}</p>
                  </div>
                  {!notif.read && (
                    <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => markAsRead(notif.id)}>
                      <Check className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
