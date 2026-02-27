'use client';

import { useEffect, useState, createContext, useContext, ReactNode } from 'react';

interface ServiceWorkerContextValue {
  isSupported: boolean;
  isInstalled: boolean;
  isOffline: boolean;
  registration: ServiceWorkerRegistration | null;
  updateAvailable: boolean;
  update: () => Promise<void>;
  clearCache: () => Promise<void>;
}

const ServiceWorkerContext = createContext<ServiceWorkerContextValue>({
  isSupported: false,
  isInstalled: false,
  isOffline: false,
  registration: null,
  updateAvailable: false,
  update: async () => {},
  clearCache: async () => {},
});

export function useServiceWorker() {
  return useContext(ServiceWorkerContext);
}

interface ServiceWorkerProviderProps {
  children: ReactNode;
}

export function ServiceWorkerProvider({ children }: ServiceWorkerProviderProps) {
  const [isSupported, setIsSupported] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Check if service workers are supported
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      setIsSupported(true);

      if (process.env.NODE_ENV === 'production') {
        registerServiceWorker();
      } else {
        void disableServiceWorkerInDevelopment();
      }
    }

    // Track online/offline status
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    if (typeof window !== 'undefined') {
      setIsOffline(!navigator.onLine);
      window.addEventListener('online', handleOnline);
      window.addEventListener('offline', handleOffline);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
      };
    }
  }, []);

  async function disableServiceWorkerInDevelopment() {
    try {
      const registrations = await navigator.serviceWorker.getRegistrations();
      await Promise.all(registrations.map((reg) => reg.unregister()));

      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(
          cacheNames
            .filter((name) => name.startsWith('CapySolBuild-'))
            .map((name) => caches.delete(name))
        );
      }

      setRegistration(null);
      setIsInstalled(false);
      setUpdateAvailable(false);
      console.log('[PWA] Service worker disabled in development');
    } catch (error) {
      console.error('[PWA] Failed to disable service worker in development:', error);
    }
  }

  async function registerServiceWorker() {
    try {
      const reg = await navigator.serviceWorker.register('/sw.js', {
        scope: '/',
        updateViaCache: 'none',
      });

      setRegistration(reg);
      setIsInstalled(true);

      console.log('[PWA] Service worker registered:', reg.scope);

      // Check for updates
      reg.addEventListener('updatefound', () => {
        const newWorker = reg.installing;
        if (newWorker) {
          newWorker.addEventListener('statechange', () => {
            if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
              // New version available
              setUpdateAvailable(true);
              console.log('[PWA] New version available');
            }
          });
        }
      });

      // Handle controller change (new SW activated)
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('[PWA] Controller changed, reloading...');
        // Optionally reload the page when a new service worker takes over
        // window.location.reload();
      });

      // Check for waiting service worker on page load
      if (reg.waiting) {
        setUpdateAvailable(true);
      }
    } catch (error) {
      console.error('[PWA] Service worker registration failed:', error);
    }
  }

  async function update() {
    if (!registration?.waiting) return;

    // Tell waiting service worker to skip waiting
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });
    setUpdateAvailable(false);

    // Reload the page
    window.location.reload();
  }

  async function clearCache() {
    if (registration?.active) {
      registration.active.postMessage({ type: 'CLEAR_CACHE' });
    }

    // Also clear caches from the window context
    if ('caches' in window) {
      const cacheNames = await caches.keys();
      await Promise.all(
        cacheNames
          .filter((name) => name.startsWith('CapySolBuild-'))
          .map((name) => caches.delete(name))
      );
      console.log('[PWA] Cache cleared');
    }
  }

  return (
    <ServiceWorkerContext.Provider
      value={{
        isSupported,
        isInstalled,
        isOffline,
        registration,
        updateAvailable,
        update,
        clearCache,
      }}
    >
      {children}
    </ServiceWorkerContext.Provider>
  );
}
