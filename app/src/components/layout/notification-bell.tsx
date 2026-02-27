'use client';

import { useEffect, useState } from 'react';
import { Bell, X, Check } from 'lucide-react';
import Link from 'next/link';

interface Notification {
  _id: string;
  type: 'achievement' | 'course' | 'message' | 'social' | 'xp' | 'reward' | 'system';
  title: string;
  message: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  createdAt: string;
}

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch notifications on mount and set up polling
  useEffect(() => {
    fetchNotifications();

    // Poll for new notifications every 30 seconds
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, []);

  // Subscribe to real-time notifications via Service Worker
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      return;
    }

    navigator.serviceWorker.ready.then((registration) => {
      registration.addEventListener('push', (event: any) => {
        // When new push notification arrives, refresh our list
        fetchNotifications();
      });
    });
  }, []);

  async function fetchNotifications() {
    try {
      const response = await fetch('/api/notifications');
      if (!response.ok) return;

      const data = await response.json();
      setNotifications(data.notifications || []);

      const unread = data.notifications?.filter((n: Notification) => !n.isRead).length || 0;
      setUnreadCount(unread);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    } finally {
      setIsLoading(false);
    }
  }

  async function markAsRead(notificationId: string) {
    try {
      await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: notificationId, isRead: true }),
      });

      setNotifications((prev) =>
        prev.map((n) => (n._id === notificationId ? { ...n, isRead: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  }

  async function markAllAsRead() {
    try {
      await fetch('/api/notifications/mark-all-read', { method: 'POST' });

      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  }

  function getNotificationIcon(type: Notification['type']) {
    const icons: Record<Notification['type'], string> = {
      achievement: '🏆',
      course: '📚',
      message: '💬',
      social: '👥',
      xp: '⭐',
      reward: '🎁',
      system: '⚙️',
    };
    return icons[type] || '📬';
  }

  function getRelativeTime(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`;
    return date.toLocaleDateString();
  }

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative rounded-lg p-2 transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        aria-label="Notifications"
      >
        <Bell className="h-6 w-6 text-gray-700 dark:text-gray-300" />

        {/* Unread Badge */}
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-xs font-bold text-white">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notification Dropdown */}
      {isOpen && (
        <div className="absolute top-12 right-0 z-50 max-h-96 w-96 rounded-lg border border-gray-200 bg-white shadow-xl dark:border-gray-700 dark:bg-gray-900">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 p-4 dark:border-gray-700">
            <h3 className="font-semibold text-gray-900 dark:text-white">Notifications</h3>
            <button
              onClick={() => setIsOpen(false)}
              className="rounded p-1 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <X className="h-4 w-4 text-gray-500" />
            </button>
          </div>

          {/* Notifications List */}
          <div className="max-h-80 overflow-y-auto">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="h-6 w-6 animate-spin rounded-full border-b-2 border-blue-500"></div>
              </div>
            ) : notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                <Bell className="mb-2 h-8 w-8 opacity-50" />
                <p className="text-sm">No notifications yet</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification._id}
                  className={`border-b border-gray-100 p-4 transition-colors hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-gray-800 ${
                    !notification.isRead
                      ? 'bg-blue-50 dark:bg-blue-900/20'
                      : 'bg-white dark:bg-gray-900'
                  }`}
                >
                  <div className="flex gap-3">
                    {/* Icon */}
                    <div className="flex-shrink-0 text-xl">
                      {getNotificationIcon(notification.type)}
                    </div>

                    {/* Content */}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {notification.title}
                      </p>
                      <p className="line-clamp-2 text-sm text-gray-600 dark:text-gray-400">
                        {notification.message}
                      </p>
                      <p className="mt-1 text-xs text-gray-500">
                        {getRelativeTime(notification.createdAt)}
                      </p>
                    </div>

                    {/* Mark as read button */}
                    {!notification.isRead && (
                      <button
                        onClick={() => markAsRead(notification._id)}
                        className="flex-shrink-0 rounded p-1 hover:bg-gray-200 dark:hover:bg-gray-700"
                        aria-label="Mark as read"
                      >
                        <Check className="h-4 w-4 text-blue-500" />
                      </button>
                    )}
                  </div>

                  {/* Action Link */}
                  {notification.actionUrl && (
                    <Link
                      href={notification.actionUrl}
                      onClick={() => markAsRead(notification._id)}
                      className="mt-2 block text-sm text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400"
                    >
                      {notification.actionLabel || 'View'} →
                    </Link>
                  )}
                </div>
              ))
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="flex justify-between border-t border-gray-200 p-3 dark:border-gray-700">
              <button
                onClick={markAllAsRead}
                className="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                Mark all as read
              </button>
              <Link
                href="/dashboard/notifications"
                className="text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                View all
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
