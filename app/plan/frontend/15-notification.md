# Notification Service

## Overview

The Notification Service handles push notifications and in-app notifications for user engagement.

## Notification Types

| Type | Trigger | Priority |
|------|---------|----------|
| `lesson_complete` | Lesson completed | Low |
| `course_complete` | Course finalized | High |
| `achievement_unlock` | Achievement earned | High |
| `credential_issued` | Credential NFT minted | High |
| `streak_milestone` | Streak milestone reached | Medium |
| `level_up` | Level increased | Medium |
| `reply` | Reply to thread | Medium |
| `mention` | @mentioned in post | Medium |
| `system` | Platform announcements | Low |

## Implementation

### 1. Notification Store (Zustand)

```typescript
// stores/notificationStore.ts
import { create } from 'zustand';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  read: boolean;
  createdAt: number;
}

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  
  addNotification: (notification: Omit<Notification, 'id' | 'read' | 'createdAt'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  clearNotifications: () => void;
  removeNotification: (id: string) => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  
  addNotification: (notification) => {
    const id = `notif-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newNotification: Notification = {
      ...notification,
      id,
      read: false,
      createdAt: Date.now(),
    };
    
    set((state) => ({
      notifications: [newNotification, ...state.notifications].slice(0, 100),
      unreadCount: state.unreadCount + 1,
    }));
    
    // Show toast
    showToast(notification.title, notification.message);
  },
  
  markAsRead: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      if (notification && !notification.read) {
        return {
          notifications: state.notifications.map(n =>
            n.id === id ? { ...n, read: true } : n
          ),
          unreadCount: Math.max(0, state.unreadCount - 1),
        };
      }
      return state;
    });
  },
  
  markAllAsRead: () => {
    set((state) => ({
      notifications: state.notifications.map(n => ({ ...n, read: true })),
      unreadCount: 0,
    }));
  },
  
  clearNotifications: () => {
    set({ notifications: [], unreadCount: 0 });
  },
  
  removeNotification: (id) => {
    set((state) => {
      const notification = state.notifications.find(n => n.id === id);
      return {
        notifications: state.notifications.filter(n => n.id !== id),
        unreadCount: notification && !notification.read 
          ? Math.max(0, state.unreadCount - 1) 
          : state.unreadCount,
      };
    });
  },
}));
```

### 2. Toast Component

```typescript
// components/notification/Toast.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';

interface Toast {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
}

export function ToastContainer({ toasts }: { toasts: Toast[] }) {
  return (
    <div className="toast-container">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            className={`toast toast-${toast.type}`}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
          >
            <div className="toast-content">
              <span className="toast-title">{toast.title}</span>
              <span className="toast-message">{toast.message}</span>
            </div>
            <button className="toast-close">×</button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
```

### 3. Notification Bell Component

```typescript
// components/notification/NotificationBell.tsx
'use client';

import { useNotificationStore } from '@/stores/notificationStore';
import { NotificationDropdown } from './NotificationDropdown';

export function NotificationBell() {
  const { unreadCount, notifications } = useNotificationStore();
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <div className="notification-bell">
      <button 
        className="bell-button"
        onClick={() => setIsOpen(!isOpen)}
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span className="unread-badge">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>
      
      {isOpen && (
        <NotificationDropdown
          notifications={notifications}
          onClose={() => setIsOpen(false)}
        />
      )}
    </div>
  );
}
```

### 4. Notification Dropdown Component

```typescript
// components/notification/NotificationDropdown.tsx
import { useNotificationStore } from '@/stores/notificationStore';
import { formatRelativeTime } from '@/lib/utils';

export function NotificationDropdown({ notifications, onClose }: Props) {
  const { markAsRead, markAllAsRead } = useNotificationStore();
  
  return (
    <div className="notification-dropdown">
      <div className="dropdown-header">
        <h3>Notifications</h3>
        <button onClick={markAllAsRead}>Mark all read</button>
      </div>
      
      <div className="notification-list">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>No notifications yet</p>
          </div>
        ) : (
          notifications.map((notif) => (
            <div
              key={notif.id}
              className={`notification-item ${notif.read ? 'read' : 'unread'}`}
              onClick={() => {
                markAsRead(notif.id);
                handleNotificationClick(notif);
              }}
            >
              <div className="notification-icon">
                {getNotificationIcon(notif.type)}
              </div>
              <div className="notification-content">
                <span className="notification-title">{notif.title}</span>
                <span className="notification-message">{notif.message}</span>
                <span className="notification-time">
                  {formatRelativeTime(notif.createdAt)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
      
      <div className="dropdown-footer">
        <Link href="/notifications" onClick={onClose}>
          View all notifications
        </Link>
      </div>
    </div>
  );
}
```

### 5. Push Notification Hook

```typescript
// hooks/usePushNotifications.ts
export function usePushNotifications() {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  
  useEffect(() => {
    setIsSupported('Notification' in window && 'serviceWorker' in navigator);
    
    if ('Notification' in window) {
      setIsSubscribed(Notification.permission === 'granted');
    }
  }, []);
  
  const requestPermission = async () => {
    if (!isSupported) return false;
    
    const permission = await Notification.requestPermission();
    setIsSubscribed(permission === 'granted');
    return permission === 'granted';
  };
  
  const subscribe = async () => {
    if (!isSupported) return null;
    
    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: process.env.NEXT_PUBLIC_VAPID_KEY,
    });
    
    // Send subscription to server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      body: JSON.stringify(subscription),
    });
    
    return subscription;
  };
  
  return {
    isSupported,
    isSubscribed,
    requestPermission,
    subscribe,
  };
}
```

### 6. Notification Service

```typescript
// services/notification-service.ts
import { useNotificationStore } from '@/stores/notificationStore';

class NotificationService {
  private store = useNotificationStore;
  
  lessonCompleted(courseName: string, lessonName: string, xpEarned: number) {
    this.store.getState().addNotification({
      type: 'lesson_complete',
      title: 'Lesson Completed!',
      message: `You earned ${xpEarned} XP in "${lessonName}"`,
      data: { courseName, lessonName },
    });
  }
  
  courseCompleted(courseName: string, totalXp: number) {
    this.store.getState().addNotification({
      type: 'course_complete',
      title: 'Course Completed! 🎉',
      message: `Congratulations! You completed "${courseName}" and earned ${totalXp} XP`,
      data: { courseName },
    });
  }
  
  achievementUnlocked(name: string, xpReward: number) {
    this.store.getState().addNotification({
      type: 'achievement_unlock',
      title: 'Achievement Unlocked! 🏆',
      message: `You earned "${name}" (+${xpReward} XP)`,
      data: { achievementName: name },
    });
  }
  
  credentialIssued(trackName: string) {
    this.store.getState().addNotification({
      type: 'credential_issued',
      title: 'Credential Issued! 📜',
      message: `Your ${trackName} credential has been minted to your wallet`,
      data: { trackName },
    });
  }
  
  streakMilestone(days: number) {
    this.store.getState().addNotification({
      type: 'streak_milestone',
      title: `${days} Day Streak! 🔥`,
      message: `Amazing dedication! Keep up the great work!`,
      data: { days },
    });
  }
  
  levelUp(level: number, title: string) {
    this.store.getState().addNotification({
      type: 'level_up',
      title: `Level ${level} Reached! ⭐`,
      message: `You're now a ${title}!`,
      data: { level, title },
    });
  }
}

export const notificationService = new NotificationService();
```

### 7. Notification Settings Component

```typescript
// components/settings/NotificationSettings.tsx
export function NotificationSettings() {
  const { isSupported, isSubscribed, requestPermission, subscribe } = usePushNotifications();
  const [settings, setSettings] = useState({
    push: false,
    email: false,
    achievements: true,
    courses: true,
    community: true,
    streaks: true,
  });
  
  const handlePushToggle = async (enabled: boolean) => {
    if (enabled) {
      const granted = await requestPermission();
      if (granted) {
        await subscribe();
        setSettings({ ...settings, push: true });
      }
    } else {
      setSettings({ ...settings, push: false });
    }
  };
  
  return (
    <div className="notification-settings">
      <h3>Notification Preferences</h3>
      
      <div className="settings-group">
        <h4>Delivery Methods</h4>
        
        <Toggle
          label="Push Notifications"
          description="Receive notifications on your device"
          enabled={settings.push}
          onChange={handlePushToggle}
          disabled={!isSupported}
        />
        
        <Toggle
          label="Email Notifications"
          description="Receive daily digest emails"
          enabled={settings.email}
          onChange={(v) => setSettings({ ...settings, email: v })}
        />
      </div>
      
      <div className="settings-group">
        <h4>Notification Types</h4>
        
        <Toggle
          label="Achievements"
          description="When you unlock an achievement"
          enabled={settings.achievements}
          onChange={(v) => setSettings({ ...settings, achievements: v })}
        />
        
        <Toggle
          label="Course Progress"
          description="Course completions and credentials"
          enabled={settings.courses}
          onChange={(v) => setSettings({ ...settings, courses: v })}
        />
        
        <Toggle
          label="Community"
          description="Replies and mentions"
          enabled={settings.community}
          onChange={(v) => setSettings({ ...settings, community: v })}
        />
        
        <Toggle
          label="Streaks"
          description="Streak reminders and milestones"
          enabled={settings.streaks}
          onChange={(v) => setSettings({ ...settings, streaks: v })}
        />
      </div>
    </div>
  );
}
```
