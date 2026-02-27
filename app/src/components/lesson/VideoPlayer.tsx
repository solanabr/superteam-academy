'use client';

import { cn } from '@/lib/utils';
import { useEffect, useState, useRef } from 'react';

interface VideoPlayerProps {
  url: string;
  className?: string;
  onEnded?: () => void;
}

export function VideoPlayer({ url, className, onEnded }: VideoPlayerProps) {
  const [videoId, setVideoId] = useState<string | null>(null);

  useEffect(() => {
    // Extract YouTube ID
    const getYouTubeId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const id = getYouTubeId(url);
    if (id) {
        setVideoId(id);
    } else {
        console.warn("Unsupported video URL or not a YouTube link:", url);
    }
  }, [url]);

  if (!videoId) {
    return (
        <div className={cn("relative aspect-video rounded-lg overflow-hidden bg-[#13131a] border border-[#2E2E36] flex items-center justify-center", className)}>
            <p className="text-gray-500 text-sm">Video cannot be loaded. Invalid URL.</p>
        </div>
    );
  }

  return (
    <div className={cn("relative aspect-video rounded-lg overflow-hidden bg-black border border-[#2E2E36]", className)}>
        <iframe
            width="100%"
            height="100%"
            src={`https://www.youtube.com/embed/${videoId}?enablejsapi=1`}
            title="YouTube video player"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="absolute top-0 left-0 w-full h-full"
        />
    </div>
  );
}
