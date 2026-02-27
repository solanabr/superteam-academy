'use client';

import { useEffect, useState } from 'react';
import { AlertCircle, X } from 'lucide-react';
import { useServiceWorker } from '@/components/providers/service-worker-provider';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@/hooks/use-translation';

export function PWAUpdatePrompt() {
  const { updateAvailable, update } = useServiceWorker();
  const { t } = useTranslation();
  const [isHydrated, setIsHydrated] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  if (!isHydrated || !updateAvailable || isDismissed) return null;

  return (
    <div className="fixed right-4 bottom-4 left-4 z-50 flex items-center gap-3 rounded-lg bg-blue-600 px-4 py-3 text-white md:right-4 md:left-auto md:max-w-sm">
      <AlertCircle className="h-5 w-5 flex-shrink-0" />
      <div className="flex-1">
        <p className="text-sm font-medium">{t('pwa.updateAvailable')}</p>
        <p className="text-xs text-blue-100">{t('pwa.updateDescription')}</p>
      </div>
      <div className="flex gap-2">
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-white hover:bg-blue-700"
          onClick={() => update()}
        >
          {t('pwa.update')}
        </Button>
        <button
          onClick={() => setIsDismissed(true)}
          className="text-white hover:text-blue-100"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
