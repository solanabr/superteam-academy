'use client';

import { useCallback, useEffect, useState } from 'react';
import { WifiOff, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OfflineIndicatorProps {
  className?: string;
}

export function OfflineIndicator({ className }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Initialize from current state
    setIsOffline(!navigator.onLine);

    function handleOffline() {
      setIsOffline(true);
      setIsDismissed(false);
    }

    function handleOnline() {
      setIsOffline(false);
      setIsDismissed(false);
    }

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, []);

  const dismiss = useCallback(() => {
    setIsDismissed(true);
  }, []);

  if (!isOffline || isDismissed) return null;

  return (
    <div
      role="alert"
      className={cn(
        'fixed top-0 inset-x-0 z-50 flex items-center justify-between',
        'bg-amber-600 px-4 py-2.5 text-sm font-medium text-white shadow-lg',
        'animate-in slide-in-from-top duration-300',
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <WifiOff className="size-4 shrink-0" />
        <span>You are offline — some features may be limited</span>
      </div>
      <button
        type="button"
        onClick={dismiss}
        className="rounded-md p-1 transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50"
        aria-label="Dismiss offline notification"
      >
        <X className="size-4" />
      </button>
    </div>
  );
}
