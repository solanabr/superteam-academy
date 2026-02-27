'use client';

import { useEffect, useState } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useServiceWorker } from '@/components/providers/service-worker-provider';
import { useTranslation } from '@/hooks/use-translation';

export function OfflineIndicator() {
  const { isOffline } = useServiceWorker();
  const { t } = useTranslation();
  const [isVisible, setIsVisible] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    // Show indicator for a few seconds when status changes
    if (isOffline) {
      setIsVisible(true);
    } else {
      const timer = setTimeout(() => setIsVisible(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOffline]);

  if (!isHydrated || !isVisible) return null;

  return (
    <div
      className={`fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium transition-all ${
        isOffline ? 'bg-destructive/90 text-white' : 'bg-green-600/90 text-white'
      }`}
    >
      {isOffline ? (
        <>
          <WifiOff className="h-4 w-4 flex-shrink-0" />
          <span>{t('pwa.offline')}</span>
        </>
      ) : (
        <>
          <Wifi className="h-4 w-4 flex-shrink-0" />
          <span>{t('pwa.online')}</span>
        </>
      )}
    </div>
  );
}
