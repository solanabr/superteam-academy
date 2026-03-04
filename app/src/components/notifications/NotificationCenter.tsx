"use client";

import { useTranslations } from "next-intl";
import { Bell, Trophy, BookCheck, Flame, TrendingUp, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNotificationStore, type AppNotification, type NotificationType } from "@/stores/notification-store";
import { cn } from "@/lib/utils";

function typeIcon(type: NotificationType) {
  switch (type) {
    case "achievement_unlocked": return <Trophy className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
    case "course_completed": return <BookCheck className="h-4 w-4 text-green-500" aria-hidden="true" />;
    case "streak_milestone": return <Flame className="h-4 w-4 text-orange-500" aria-hidden="true" />;
    case "level_up": return <TrendingUp className="h-4 w-4 text-purple-500" aria-hidden="true" />;
    case "xp_earned": return <Zap className="h-4 w-4 text-primary" aria-hidden="true" />;
  }
}

function timeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

function NotificationItem({ notification, onRead }: { notification: AppNotification; onRead: (id: string) => void }) {
  return (
    <button
      type="button"
      onClick={() => onRead(notification.id)}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted/60",
        !notification.read && "bg-primary/5"
      )}
    >
      <div className="mt-0.5 shrink-0">{typeIcon(notification.type)}</div>
      <div className="min-w-0 flex-1">
        <p className={cn("text-sm font-medium leading-none", !notification.read && "text-foreground")}>
          {notification.title}
        </p>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground line-clamp-2">
          {notification.message}
        </p>
        <p className="mt-1 text-xs text-muted-foreground/60">{timeAgo(notification.timestamp)}</p>
      </div>
      {!notification.read && (
        <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-primary" aria-label="Unread" />
      )}
    </button>
  );
}

export function NotificationCenter() {
  const t = useTranslations("notifications");
  const notifications = useNotificationStore((s) => s.notifications);
  const markAllRead = useNotificationStore((s) => s.markAllRead);
  const markRead = useNotificationStore((s) => s.markRead);
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative"
          aria-label={t("title")}
        >
          <Bell className="h-5 w-5" aria-hidden="true" />
          {unreadCount > 0 && (
            <span
              className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground"
              aria-label={`${unreadCount} unread`}
            >
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-80 p-0"
        sideOffset={8}
      >
        <div className="flex items-center justify-between border-b border-border px-3 py-2.5">
          <p className="text-sm font-semibold">{t("title")}</p>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-auto py-0.5 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={markAllRead}
            >
              {t("markAllRead")}
            </Button>
          )}
        </div>

        <div className="max-h-[380px] overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-center">
              <Bell className="h-8 w-8 text-muted-foreground/30" aria-hidden="true" />
              <p className="text-sm text-muted-foreground">{t("empty")}</p>
            </div>
          ) : (
            <div className="space-y-0.5 p-1.5">
              {notifications.map((n) => (
                <NotificationItem key={n.id} notification={n} onRead={markRead} />
              ))}
            </div>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
