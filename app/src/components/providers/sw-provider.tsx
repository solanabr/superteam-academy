'use client';

import { useEffect } from 'react';

/**
 * Registers the service worker after the page loads.
 * Only activates in production or when NEXT_PUBLIC_ENABLE_SW=true.
 *
 * Rendered as a leaf component (no children) to avoid unnecessary
 * re-renders propagating through the tree.
 */
export function ServiceWorkerProvider() {
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const isProduction = process.env.NODE_ENV === 'production';
    const isExplicitlyEnabled = process.env.NEXT_PUBLIC_ENABLE_SW === 'true';

    if (!isProduction && !isExplicitlyEnabled) return;

    // Register after the window finishes loading to avoid
    // competing with critical resource fetches
    const register = () => {
      navigator.serviceWorker
        .register('/sw.js', { scope: '/' })
        .catch((error) => {
          console.error('[SW] Registration failed:', error);
        });
    };

    if (document.readyState === 'complete') {
      register();
    } else {
      window.addEventListener('load', register, { once: true });
      return () => window.removeEventListener('load', register);
    }
  }, []);

  return null;
}
