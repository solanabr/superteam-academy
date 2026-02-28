'use client';

import { useCallback, useEffect, useState } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, Mail, Trophy, Flame, BookOpen } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';

const NOTIFICATIONS_KEY = 'superteam-notifications';

interface NotificationPreferences {
  emailNotifications: boolean;
  achievementAlerts: boolean;
  streakReminders: boolean;
  courseUpdates: boolean;
}

const defaultPreferences: NotificationPreferences = {
  emailNotifications: false,
  achievementAlerts: true,
  streakReminders: true,
  courseUpdates: true,
};

function loadPreferences(): NotificationPreferences {
  if (typeof window === 'undefined') return defaultPreferences;
  try {
    const raw = localStorage.getItem(NOTIFICATIONS_KEY);
    if (!raw) return defaultPreferences;
    const parsed = JSON.parse(raw);
    return { ...defaultPreferences, ...parsed };
  } catch {
    return defaultPreferences;
  }
}

function persistPreferences(prefs: NotificationPreferences): void {
  try {
    localStorage.setItem(NOTIFICATIONS_KEY, JSON.stringify(prefs));
  } catch {
    // localStorage quota exceeded or unavailable
  }
}

interface NotificationItem {
  key: keyof NotificationPreferences;
  label: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}

const notificationItems: NotificationItem[] = [
  {
    key: 'emailNotifications',
    label: 'Email Notifications',
    description: 'Receive updates and announcements via email',
    icon: Mail,
  },
  {
    key: 'achievementAlerts',
    label: 'Achievement Alerts',
    description: 'Get notified when you unlock new achievements',
    icon: Trophy,
  },
  {
    key: 'streakReminders',
    label: 'Streak Reminders',
    description: 'Daily reminders to maintain your learning streak',
    icon: Flame,
  },
  {
    key: 'courseUpdates',
    label: 'Course Updates',
    description: 'Notifications about new lessons and course changes',
    icon: BookOpen,
  },
];

export function NotificationSettings() {
  const t = useTranslations('settings');
  const [prefs, setPrefs] = useState<NotificationPreferences>(defaultPreferences);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setPrefs(loadPreferences());
  }, []);

  const handleToggle = useCallback(
    (key: keyof NotificationPreferences) => (checked: boolean) => {
      setPrefs((prev) => {
        const next = { ...prev, [key]: checked };
        persistPreferences(next);
        return next;
      });
    },
    [],
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="size-5" />
          {t('notifications')}
        </CardTitle>
        <CardDescription>
          Manage how and when you receive notifications.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {notificationItems.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.key}
                className="flex items-center justify-between gap-4 rounded-lg border p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-md bg-muted p-2">
                    <Icon className="size-4 text-muted-foreground" />
                  </div>
                  <div className="space-y-0.5">
                    <Label htmlFor={item.key} className="cursor-pointer">
                      {item.label}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
                <Switch
                  id={item.key}
                  checked={mounted ? prefs[item.key] : false}
                  onCheckedChange={handleToggle(item.key)}
                  aria-label={item.label}
                />
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
