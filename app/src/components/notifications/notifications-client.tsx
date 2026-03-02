"use client";

import { formatDistanceToNow } from "date-fns";
import { Bell, Zap, TrendingUp, Trophy, Megaphone, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useNotifications } from "@/lib/hooks/use-notifications";
import type { AppNotification, NotificationType } from "@/types";

type IconConfig = { icon: React.ElementType; className: string };

const TYPE_CONFIG: Record<NotificationType, IconConfig> = {
  xp_milestone: { icon: Zap, className: "text-yellow-500 bg-yellow-500/10" },
  level_up: { icon: TrendingUp, className: "text-blue-500 bg-blue-500/10" },
  achievement: { icon: Trophy, className: "text-amber-500 bg-amber-500/10" },
  course_announcement: { icon: Megaphone, className: "text-primary bg-primary/10" },
  reply: { icon: MessageSquare, className: "text-muted-foreground bg-muted" },
  mention: { icon: MessageSquare, className: "text-muted-foreground bg-muted" },
};

function NotificationRow({
  notification,
  onRead,
}: {
  notification: AppNotification;
  onRead: (id: string) => void;
}) {
  const cfg = TYPE_CONFIG[notification.type] ?? TYPE_CONFIG.reply;
  const Icon = cfg.icon;

  return (
    <button
      onClick={() => !notification.read && onRead(notification.id)}
      className={cn(
        "flex w-full items-start gap-4 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted/50",
        !notification.read && "border-l-4 border-l-primary bg-primary/5",
      )}
    >
      <span
        className={cn(
          "mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
          cfg.className,
        )}
      >
        <Icon className="h-4 w-4" />
      </span>

      <div className="min-w-0 flex-1">
        <div className="flex items-start justify-between gap-2">
          <p className={cn("text-sm font-medium", !notification.read && "text-foreground")}>
            {notification.title}
          </p>
          {!notification.read && (
            <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-primary" />
          )}
        </div>
        <p className="mt-0.5 text-sm text-muted-foreground">{notification.body}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {formatDistanceToNow(new Date(notification.createdAt), { addSuffix: true })}
        </p>
      </div>
    </button>
  );
}

export function NotificationsClient() {
  const { notifications, isLoading, markRead, markAllRead, unreadCount } = useNotifications();

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-muted-foreground">
              {unreadCount} unread
            </p>
          )}
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" size="sm" onClick={markAllRead}>
            Mark all as read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-20 w-full rounded-lg" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <Bell className="h-10 w-10 opacity-30" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm">You'll see XP milestones, achievements, and course updates here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationRow key={n.id} notification={n} onRead={markRead} />
          ))}
        </div>
      )}
    </div>
  );
}
