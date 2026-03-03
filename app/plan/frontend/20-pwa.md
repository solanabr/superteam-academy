# PWA Support

## Overview

Progressive Web App support for offline capability and installable experience.

## Features

- Offline course content
- Installable on desktop/mobile
- Push notifications
- Background sync
- App shortcuts

## Implementation

### 1. Manifest Configuration

```json
// public/manifest.json
{
  "name": "Superteam Academy",
  "short_name": "Academy",
  "description": "Learn Solana development with interactive courses",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0A0A0A",
  "theme_color": "#9945FF",
  "orientation": "portrait-primary",
  "icons": [
    {
      "src": "/icons/icon-72x72.png",
      "sizes": "72x72",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-96x96.png",
      "sizes": "96x96",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-128x128.png",
      "sizes": "128x128",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-144x144.png",
      "sizes": "144x144",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-152x152.png",
      "sizes": "152x152",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-192x192.png",
      "sizes": "192x192",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-384x384.png",
      "sizes": "384x384",
      "type": "image/png"
    },
    {
      "src": "/icons/icon-512x512.png",
      "sizes": "512x512",
      "type": "image/png"
    }
  ],
  "shortcuts": [
    {
      "name": "My Courses",
      "url": "/dashboard",
      "icons": [{ "src": "/icons/courses.png", "sizes": "96x96" }]
    },
    {
      "name": "Leaderboard",
      "url": "/leaderboard",
      "icons": [{ "src": "/icons/leaderboard.png", "sizes": "96x96" }]
    }
  ],
  "screenshots": [
    {
      "src": "/screenshots/dashboard.png",
      "sizes": "1280x720",
      "type": "image/png",
      "label": "Dashboard"
    }
  ]
}
```

### 2. Service Worker

```typescript
// public/sw.js
const CACHE_NAME = 'academy-v1';
const STATIC_ASSETS = [
  '/',
  '/dashboard',
  '/courses',
  '/offline',
  '/manifest.json',
];

const DYNAMIC_CACHE = 'academy-dynamic-v1';

// Install event
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME && key !== DYNAMIC_CACHE)
          .map((key) => caches.delete(key))
      );
    })
  );
  self.clients.claim();
});

// Fetch event - Network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Skip non-GET requests
  if (request.method !== 'GET') return;
  
  // Skip API requests (they need fresh data)
  if (url.pathname.startsWith('/api/')) {
    return;
  }
  
  // Skip external requests
  if (url.origin !== location.origin) {
    return;
  }
  
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Clone response for caching
        const responseClone = response.clone();
        
        caches.open(DYNAMIC_CACHE).then((cache) => {
          cache.put(request, responseClone);
        });
        
        return response;
      })
      .catch(() => {
        // Fallback to cache
        return caches.match(request).then((response) => {
          if (response) {
            return response;
          }
          
          // Return offline page for navigation requests
          if (request.mode === 'navigate') {
            return caches.match('/offline');
          }
          
          return new Response('Offline', { status: 503 });
        });
      })
  );
});

// Background sync
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-progress') {
    event.waitUntil(syncProgress());
  }
});

async function syncProgress() {
  // Sync locally stored progress to server
  const pendingProgress = await getPendingProgress();
  
  for (const progress of pendingProgress) {
    try {
      await fetch('/api/progress/sync', {
        method: 'POST',
        body: JSON.stringify(progress),
      });
      await removePendingProgress(progress.id);
    } catch (error) {
      console.error('Sync failed:', error);
    }
  }
}

// Push notifications
self.addEventListener('push', (event) => {
  const data = event.data?.json() ?? {};
  
  const options = {
    body: data.body || 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge.png',
    vibrate: [100, 50, 100],
    data: {
      url: data.url || '/',
    },
  };
  
  event.waitUntil(
    self.registration.showNotification(data.title || 'Superteam Academy', options)
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data.url)
  );
});
```

### 3. Next.js PWA Configuration

```typescript
// next.config.js
const withPWA = require('next-pwa')({
  dest: 'public',
  register: true,
  skipWaiting: true,
  disable: process.env.NODE_ENV === 'development',
});

module.exports = withPWA({
  // Other Next.js config
});
```

### 4. Offline Page

```typescript
// app/offline/page.tsx
export default function OfflinePage() {
  return (
    <div className="offline-page">
      <div className="offline-content">
        <span className="offline-icon">📡</span>
        <h1>You're Offline</h1>
        <p>
          It looks like you've lost your internet connection.
          Some features may not be available.
        </p>
        <button onClick={() => window.location.reload()}>
          Try Again
        </button>
        <div className="cached-content">
          <h3>Available Offline</h3>
          <ul>
            <li>Downloaded courses</li>
            <li>Saved progress</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
```

### 5. Offline Storage Hook

```typescript
// hooks/useOfflineStorage.ts
import { useState, useEffect } from 'react';

export function useOfflineStorage() {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingSync, setPendingSync] = useState(0);
  
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);
  
  const saveForSync = async (data: any) => {
    if ('serviceWorker' in navigator && 'SyncManager' in window) {
      // Store in IndexedDB
      await storePendingData(data);
      
      // Register for background sync
      const registration = await navigator.serviceWorker.ready;
      await registration.sync.register('sync-progress');
      
      setPendingSync((prev) => prev + 1);
    }
  };
  
  return {
    isOnline,
    pendingSync,
    saveForSync,
  };
}
```

### 6. Install Prompt Component

```typescript
// components/pwa/InstallPrompt.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowPrompt(true);
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);
  
  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === 'accepted') {
      setShowPrompt(false);
    }
    
    setDeferredPrompt(null);
  };
  
  if (!showPrompt) return null;
  
  return (
    <div className="install-prompt">
      <div className="prompt-content">
        <span className="icon">📱</span>
        <div className="text">
          <h4>Install App</h4>
          <p>Install Superteam Academy for a better experience</p>
        </div>
        <div className="actions">
          <Button variant="ghost" onClick={() => setShowPrompt(false)}>
            Not Now
          </Button>
          <Button onClick={handleInstall}>
            Install
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### 7. Cache Management

```typescript
// lib/pwa/cache.ts
const COURSE_CACHE = 'course-content-v1';

export async function cacheCourseContent(courseId: string) {
  const cache = await caches.open(COURSE_CACHE);
  
  // Fetch and cache all lesson content
  const lessons = await fetch(`/api/courses/${courseId}/lessons`);
  const lessonData = await lessons.json();
  
  for (const lesson of lessonData) {
    await cache.add(`/api/courses/${courseId}/lessons/${lesson.id}`);
  }
  
  // Cache course metadata
  await cache.add(`/api/courses/${courseId}`);
}

export async function getCachedCourse(courseId: string) {
  const cache = await caches.open(COURSE_CACHE);
  const response = await cache.match(`/api/courses/${courseId}`);
  
  if (response) {
    return response.json();
  }
  
  return null;
}

export async function getCachedLesson(courseId: string, lessonId: string) {
  const cache = await caches.open(COURSE_CACHE);
  const response = await cache.match(`/api/courses/${courseId}/lessons/${lessonId}`);
  
  if (response) {
    return response.json();
  }
  
  return null;
}

export async function clearCourseCache(courseId: string) {
  const cache = await caches.open(COURSE_CACHE);
  
  const keys = await cache.keys();
  for (const key of keys) {
    if (key.url.includes(`/courses/${courseId}`)) {
      await cache.delete(key);
    }
  }
}
```

## PWA Checklist

- [x] manifest.json with icons
- [x] Service worker for caching
- [x] Offline page
- [x] Install prompt
- [x] Background sync
- [x] Push notifications
- [x] App shortcuts
- [x] Theme color
- [x] Viewport meta tags
- [x] Apple touch icon
- [x] Maskable icons

## Meta Tags

```html
<!-- app/layout.tsx -->
<head>
  <meta name="theme-color" content="#9945FF" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
  <meta name="apple-mobile-web-app-title" content="Academy" />
  <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
  <link rel="manifest" href="/manifest.json" />
</head>
```
