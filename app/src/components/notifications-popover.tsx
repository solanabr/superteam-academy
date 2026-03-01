"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/hooks/useUser";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { Bell, Trophy, Zap, BookOpen } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";

type XPEvent = {
    id: string;
    amount: number;
    source: string;
    description: string;
    createdAt: string;
};

export function NotificationsPopover() {
  const { userDb } = useUser();
  const [notifications, setNotifications] = useState<XPEvent[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
      if (userDb?.walletAddress) {
          fetch(`/api/user/history?wallet=${userDb.walletAddress}`)
            .then(res => res.json())
            .then((data: XPEvent[]) => {
                const displayData = data.filter(n => n.source !== "sync");
                setNotifications(displayData);
                
                // ЛОГИКА "ПРОЧИТАННОГО":
                // 1. Берем дату последнего просмотренного из localStorage (ключ уникален для юзера)
                const storageKey = `last_seen_notification_${userDb.walletAddress}`;
                const lastSeenDate = localStorage.getItem(storageKey);

                if (!lastSeenDate) {
                    // Если никогда не открывал, показываем, что есть новые (до 5 шт)
                    setUnreadCount(Math.min(displayData.length, 5));
                } else {
                    // Если открывал, считаем только те, что НОВЕЕ чем lastSeenDate
                    const seenDateObj = new Date(lastSeenDate);
                    const newUnread = displayData.filter(n => new Date(n.createdAt) > seenDateObj).length;
                    setUnreadCount(newUnread);
                }
            });
      }
  }, [userDb]);

    const handleOpenChange = (open: boolean) => {
      if (open) {
          // Когда открываем:
          // 1. Сбрасываем бейджик
          setUnreadCount(0);
          
          // 2. Сохраняем дату САМОГО НОВОГО уведомления в localStorage
          if (notifications.length > 0 && userDb?.walletAddress) {
              const newestDate = notifications[0].createdAt;
              const storageKey = `last_seen_notification_${userDb.walletAddress}`;
              localStorage.setItem(storageKey, newestDate);
          }
      }
    };

  const getIcon = (source: string) => {
      switch(source) {
          case 'achievement': return <Trophy className="h-4 w-4 text-yellow-500" />;
          case 'lesson': return <BookOpen className="h-4 w-4 text-blue-500" />;
          case 'bonus': return <Zap className="h-4 w-4 text-purple-500" />;
          default: return <Bell className="h-4 w-4 text-muted-foreground" />;
      }
  };

  return (
    <Popover onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Open notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-background" />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-4 border-b font-semibold flex justify-between items-center">
            Notifications
            <span className="text-xs text-muted-foreground font-normal bg-muted px-2 py-0.5 rounded-full">
                Recent
            </span>
        </div>
        <ScrollArea className="h-72">
            {notifications.length > 0 ? notifications.map((n) => (
                <div key={n.id} className="p-4 border-b last:border-0 hover:bg-muted/50 transition-colors flex gap-4 items-start">
                    <div className="h-8 w-8 rounded-full bg-background border flex items-center justify-center shrink-0">
                        {getIcon(n.source)}
                    </div>
                    <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">
                            {n.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
                        </p>
                    </div>
                    <div className="text-sm font-bold text-green-500 shrink-0">
                        +{n.amount} XP
                    </div>
                </div>
            )) : (
                <div className="p-8 text-center text-muted-foreground text-sm">
                    No recent activity.
                </div>
            )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}