'use client';

import { useState, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface VideoPlayerProps {
  videoUrl: string;
  onComplete: () => void;
}

export function VideoPlayer({ videoUrl, onComplete }: VideoPlayerProps) {
  const t = useTranslations('lessonView');
  const [isCompleted, setIsCompleted] = useState(false);

  const handleMarkComplete = useCallback(() => {
    setIsCompleted(true);
    onComplete();
  }, [onComplete]);

  return (
    <div className="flex flex-col gap-6">
      {/* Video embed */}
      <div className="relative aspect-video w-full overflow-hidden rounded-lg border border-border bg-black">
        <iframe
          src={videoUrl}
          title="Video lesson"
          className="absolute inset-0 h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
        />
      </div>

      {/* Mark complete */}
      <div className="flex items-center gap-3">
        {!isCompleted ? (
          <Button variant="solana" className="gap-2" onClick={handleMarkComplete}>
            <CheckCircle2 className="h-4 w-4" />
            {t('markComplete')}
          </Button>
        ) : (
          <Badge className="bg-green-500/10 text-green-500 border-green-500/20 px-4 py-2">
            <CheckCircle2 className="mr-1 h-4 w-4" />
            {t('completed')}
          </Badge>
        )}
      </div>
    </div>
  );
}
