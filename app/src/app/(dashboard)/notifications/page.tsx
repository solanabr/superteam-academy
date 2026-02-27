'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks';
import { useTranslation } from '@/hooks';
import {
  Bell,
  Award,
  BookOpen,
  MessageSquare,
  Users,
  Zap,
  Gift,
  AlertCircle,
  CheckCircle,
  Clock,
  Trash2,
  Settings,
} from 'lucide-react';

type NotificationType =
  | 'achievement'
  | 'course'
  | 'message'
  | 'social'
  | 'xp'
  | 'reward'
  | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  icon?: React.ReactNode;
}

const getNotificationIcon = (type: NotificationType) => {
  const iconMap: Record<NotificationType, React.ReactNode> = {
    achievement: <Award className="h-5 w-5 text-yellow-600" />,
    course: <BookOpen className="h-5 w-5 text-blue-600" />,
    message: <MessageSquare className="h-5 w-5 text-purple-600" />,
    social: <Users className="h-5 w-5 text-green-600" />,
    xp: <Zap className="h-5 w-5 text-orange-600" />,
    reward: <Gift className="h-5 w-5 text-pink-600" />,
    system: <AlertCircle className="h-5 w-5 text-gray-600" />,
  };
  return iconMap[type];
};

const getNotificationBadgeColor = (type: NotificationType) => {
  const colorMap: Record<NotificationType, string> = {
    achievement: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    course: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    message: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    social: 'bg-green-500/10 text-green-600 border-green-500/20',
    xp: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    reward: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
    system: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  };
  return colorMap[type];
};

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user, isLoading } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [activeTab, setActiveTab] = useState('all');
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      setFetching(true);
      try {
        const type = activeTab === 'all' ? '' : activeTab;
        const unread = activeTab === 'unread' ? 'true' : '';
        const url = `/api/notifications?${type ? `type=${type}` : ''}${unread ? `&unread=${unread}` : ''}`;

        const response = await fetch(url);
        if (!response.ok) throw new Error('Failed to fetch notifications');

        const data = await response.json();
        setNotifications(data.notifications || []);
      } catch (error) {
        console.error('Error fetching notifications:', error);
      } finally {
        setFetching(false);
      }
    };

    fetchNotifications();
  }, [user, activeTab]);

  const filteredNotifications = notifications;

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const markAsRead = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'markRead' }),
      });
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: 'all', action: 'markRead' }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const deleteNotification = async (id: string) => {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId: id, action: 'delete' }),
      });
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };

  if (isLoading || fetching) {
    return (
      <div className="container py-8">
        <div className="animate-pulse space-y-4">
          <div className="bg-muted h-8 w-1/3 rounded" />
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-muted h-24 rounded" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container py-8">
        <Card>
          <CardHeader>
            <CardTitle>{t('notificationsPage.signInTitle')}</CardTitle>
            <CardDescription>
              {t('notificationsPage.signInDescription')}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="container space-y-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-3 text-3xl font-bold tracking-tight">
            {t('notificationsPage.title')}
            {unreadCount > 0 && (
              <Badge variant="destructive" className="text-sm">
                {unreadCount} {t('notificationsPage.new')}
              </Badge>
            )}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('notificationsPage.subtitle')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm" onClick={markAllAsRead}>
              <CheckCircle className="mr-2 h-4 w-4" />
              {t('admin.markAllRead')}
            </Button>
          )}
          <Button variant="outline" size="sm">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Notification Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('notificationsPage.totalNotifications')}
            </CardTitle>
            <Bell className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{notifications.length}</div>
            <p className="text-muted-foreground mt-1 text-xs">{t('notificationsPage.allTime')}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('notificationsPage.unread')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unreadCount}</div>
            <p className="text-muted-foreground mt-1 text-xs">
              {t('notificationsPage.needsAttention')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('notificationsPage.thisWeek')}</CardTitle>
            <Clock className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {notifications.filter((n) => n.timestamp.includes('ago')).length}
            </div>
            <p className="text-muted-foreground mt-1 text-xs">{t('dashboard.recentActivity')}</p>
          </CardContent>
        </Card>
      </div>

      {/* Notifications List */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="all">{t('courses.filters.all')}</TabsTrigger>
          <TabsTrigger value="unread">
            {t('notificationsPage.unread')} {unreadCount > 0 && `(${unreadCount})`}
          </TabsTrigger>
          <TabsTrigger value="achievement">{t('dashboard.achievements')}</TabsTrigger>
          <TabsTrigger value="course">{t('nav.courses')}</TabsTrigger>
          <TabsTrigger value="message">{t('notificationsPage.messages')}</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6 space-y-3">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Bell className="text-muted-foreground mx-auto mb-4 h-12 w-12" />
                <h3 className="mb-2 text-lg font-semibold">{t('notificationsPage.noNotifications')}</h3>
                <p className="text-muted-foreground">
                  {activeTab === 'unread'
                    ? t('notificationsPage.allCaughtUp')
                    : t('notificationsPage.noNotificationsInCategory')}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification) => (
              <Card
                key={notification.id}
                className={`transition-all hover:shadow-md ${
                  !notification.isRead ? 'border-l-primary bg-primary/5 border-l-4' : ''
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Icon */}
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${getNotificationBadgeColor(notification.type)}`}
                    >
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="space-y-1">
                          <h4 className="leading-none font-semibold">{notification.title}</h4>
                          <p className="text-muted-foreground text-sm">{notification.message}</p>
                        </div>
                        {!notification.isRead && (
                          <div className="bg-primary mt-1 h-2 w-2 shrink-0 rounded-full" />
                        )}
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <div className="text-muted-foreground flex items-center gap-4 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {notification.timestamp}
                          </span>
                          <Badge
                            variant="outline"
                            className={getNotificationBadgeColor(notification.type)}
                          >
                            {notification.type}
                          </Badge>
                        </div>

                        <div className="flex items-center gap-2">
                          {notification.actionUrl && (
                            <Button size="sm" variant="default" asChild>
                              <Link href={notification.actionUrl}>
                                {notification.actionLabel || t('common.view')}
                              </Link>
                            </Button>
                          )}
                          {!notification.isRead && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => markAsRead(notification.id)}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                          )}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => deleteNotification(notification.id)}
                          >
                            <Trash2 className="text-destructive h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      {/* Notification Settings Card */}
      <Card className="border-primary/50">
        <CardHeader>
          <CardTitle>{t('notificationsPage.preferencesTitle')}</CardTitle>
          <CardDescription>{t('notificationsPage.preferencesDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" asChild>
            <Link href="/settings">
              <Settings className="mr-2 h-4 w-4" />
              {t('notificationsPage.configureSettings')}
            </Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
