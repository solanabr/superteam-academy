"use client";

import { createContext, useCallback, useContext, useState } from "react";
import { Zap, Trophy, TrendingUp } from "lucide-react";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/utils";

type NotificationType = "xp" | "achievement" | "levelup";

interface Notification {
  id: string;
  type: NotificationType;
  message: string;
  subMessage?: string;
}

interface XPNotificationContextValue {
  showXPGain: (amount: number) => void;
  showAchievement: (name: string, xpReward: number) => void;
  showLevelUp: (newLevel: number) => void;
}

const XPNotificationContext = createContext<XPNotificationContextValue | null>(
  null,
);

export function useXPNotification() {
  const ctx = useContext(XPNotificationContext);
  if (!ctx) {
    throw new Error(
      "useXPNotification must be used within XPNotificationProvider",
    );
  }
  return ctx;
}

export function XPNotificationProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const t = useTranslations("gamification");
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback(
    (notification: Omit<Notification, "id">) => {
      const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
      setNotifications((prev) => [...prev, { ...notification, id }]);

      // Auto-dismiss after 3 seconds
      setTimeout(() => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
      }, 3000);
    },
    [],
  );

  const showXPGain = useCallback(
    (amount: number) => {
      addNotification({
        type: "xp",
        message: t("xpEarned", { amount }),
      });
    },
    [addNotification, t],
  );

  const showAchievement = useCallback(
    (name: string, xpReward: number) => {
      addNotification({
        type: "achievement",
        message: t("achievementUnlocked"),
        subMessage: t("achievementRewardXP", { name, xp: xpReward }),
      });
    },
    [addNotification, t],
  );

  const showLevelUp = useCallback(
    (newLevel: number) => {
      addNotification({
        type: "levelup",
        message: t("levelUp"),
        subMessage: t("levelUpReached", { level: newLevel }),
      });
    },
    [addNotification, t],
  );

  return (
    <XPNotificationContext.Provider
      value={{ showXPGain, showAchievement, showLevelUp }}
    >
      {children}
      {/* Notification container */}
      <div className="pointer-events-none fixed right-4 top-20 z-[100] flex flex-col items-end gap-2">
        {notifications.map((notification) => (
          <NotificationToast
            key={notification.id}
            notification={notification}
          />
        ))}
      </div>
    </XPNotificationContext.Provider>
  );
}

function NotificationToast({ notification }: { notification: Notification }) {
  const config = {
    xp: {
      icon: Zap,
      bg: "bg-xp/10 border-xp/30",
      textColor: "text-xp",
    },
    achievement: {
      icon: Trophy,
      bg: "bg-achievement/10 border-achievement/30",
      textColor: "text-achievement",
    },
    levelup: {
      icon: TrendingUp,
      bg: "bg-level/10 border-level/30",
      textColor: "text-level",
    },
  };

  const c = config[notification.type];
  const Icon = c.icon;

  return (
    <div
      className={cn(
        "pointer-events-auto flex items-center gap-3 rounded-xl border px-4 py-3 shadow-lg backdrop-blur-sm animate-notification-in",
        c.bg,
      )}
    >
      <div
        className={cn(
          "flex h-8 w-8 items-center justify-center rounded-full",
          c.bg,
        )}
      >
        <Icon className={cn("h-4 w-4", c.textColor)} />
      </div>
      <div>
        <p className={cn("text-sm font-bold", c.textColor)}>
          {notification.message}
        </p>
        {notification.subMessage && (
          <p className="text-xs text-muted-foreground">
            {notification.subMessage}
          </p>
        )}
      </div>
    </div>
  );
}
