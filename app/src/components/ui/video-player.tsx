'use client';

import { useState, useCallback, useEffect } from 'react';
import Image from 'next/image';
import { Play, Pause, Maximize, Volume2, VolumeX, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export type VideoProvider = 'youtube' | 'vimeo' | 'facebook' | 'direct';

interface VideoPlayerProps {
  url: string;
  provider?: VideoProvider;
  title?: string;
  className?: string;
  autoPlay?: boolean;
  onEnded?: () => void;
  onProgress?: (progress: number) => void;
}

/**
 * Extract video ID from various video platform URLs
 */
function extractVideoId(url: string, provider: VideoProvider): string | null {
  try {
    const urlObj = new URL(url);

    switch (provider) {
      case 'youtube': {
        // Handle youtube.com/watch?v=ID, youtu.be/ID, youtube.com/embed/ID
        if (urlObj.hostname.includes('youtu.be')) {
          return urlObj.pathname.slice(1);
        }
        if (urlObj.hostname.includes('youtube.com')) {
          const videoId = urlObj.searchParams.get('v');
          if (videoId) return videoId;
          // Check for embed URLs
          const embedMatch = urlObj.pathname.match(/\/embed\/([^/?]+)/);
          if (embedMatch) return embedMatch[1];
        }
        return null;
      }
      case 'vimeo': {
        // Handle vimeo.com/ID, player.vimeo.com/video/ID
        const match = urlObj.pathname.match(/\/(?:video\/)?(\d+)/);
        return match ? match[1] : null;
      }
      case 'facebook': {
        // Facebook video URLs are complex, return the full URL for embedding
        return encodeURIComponent(url);
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

/**
 * Detect video provider from URL
 */
function detectProvider(url: string): VideoProvider {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.toLowerCase();

    if (hostname.includes('youtube.com') || hostname.includes('youtu.be')) {
      return 'youtube';
    }
    if (hostname.includes('vimeo.com')) {
      return 'vimeo';
    }
    if (hostname.includes('facebook.com') || hostname.includes('fb.watch')) {
      return 'facebook';
    }
    return 'direct';
  } catch {
    return 'direct';
  }
}

/**
 * Generate embed URL for video platforms
 */
function getEmbedUrl(url: string, provider: VideoProvider, autoPlay: boolean = false): string {
  const videoId = extractVideoId(url, provider);
  const autoPlayParam = autoPlay ? '1' : '0';

  switch (provider) {
    case 'youtube':
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}?autoplay=${autoPlayParam}&rel=0&modestbranding=1`;
      }
      break;
    case 'vimeo':
      if (videoId) {
        return `https://player.vimeo.com/video/${videoId}?autoplay=${autoPlayParam}&title=0&byline=0&portrait=0`;
      }
      break;
    case 'facebook':
      return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&autoplay=${autoPlay}`;
    case 'direct':
      return url;
  }

  return url;
}

export function VideoPlayer({
  url,
  provider: providedProvider,
  title = 'Video lesson',
  className,
  autoPlay = false,
  onEnded,
  onProgress,
}: VideoPlayerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMuted, setIsMuted] = useState(false);

  const provider = providedProvider || detectProvider(url);
  const embedUrl = getEmbedUrl(url, provider, autoPlay);

  const handleIframeLoad = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleIframeError = useCallback(() => {
    setIsLoading(false);
    setError('Failed to load video. Please check the URL.');
  }, []);

  if (error) {
    return (
      <div
        className={cn(
          'flex aspect-video items-center justify-center rounded-lg bg-zinc-900',
          className
        )}
      >
        <div className="text-center text-zinc-400">
          <p className="mb-2">{error}</p>
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-400 hover:underline"
          >
            Open video in new tab
          </a>
        </div>
      </div>
    );
  }

  // Direct video (MP4, WebM, etc.)
  if (provider === 'direct') {
    return (
      <div className={cn('relative overflow-hidden rounded-lg bg-black', className)}>
        <video
          src={url}
          controls
          autoPlay={autoPlay}
          className="aspect-video w-full"
          onEnded={onEnded}
          onTimeUpdate={(e) => {
            const video = e.currentTarget;
            if (onProgress && video.duration) {
              onProgress((video.currentTime / video.duration) * 100);
            }
          }}
          onLoadedData={() => setIsLoading(false)}
          onError={() => setError('Failed to load video')}
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
          Your browser does not support the video tag.
        </video>
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-zinc-900">
            <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
          </div>
        )}
      </div>
    );
  }

  // Embedded video (YouTube, Vimeo, Facebook)
  return (
    <div className={cn('relative overflow-hidden rounded-lg bg-black', className)}>
      {isLoading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-zinc-900">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-400" />
        </div>
      )}
      <iframe
        src={embedUrl}
        title={title}
        className="aspect-video w-full"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        onLoad={handleIframeLoad}
        onError={handleIframeError}
      />
    </div>
  );
}

/**
 * Video thumbnail component for course cards
 */
interface VideoThumbnailProps {
  url: string;
  provider?: VideoProvider;
  className?: string;
  onClick?: () => void;
}

export function VideoThumbnail({
  url,
  provider: providedProvider,
  className,
  onClick,
}: VideoThumbnailProps) {
  const provider = providedProvider || detectProvider(url);
  const videoId = extractVideoId(url, provider);

  let thumbnailUrl = '/images/video-placeholder.png';

  if (provider === 'youtube' && videoId) {
    thumbnailUrl = `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
  } else if (provider === 'vimeo' && videoId) {
    // Vimeo requires API call for thumbnail, use placeholder
    thumbnailUrl = '/images/video-placeholder.png';
  }

  const [currentThumbnail, setCurrentThumbnail] = useState(thumbnailUrl);

  useEffect(() => {
    setCurrentThumbnail(thumbnailUrl);
  }, [thumbnailUrl]);

  return (
    <div
      className={cn(
        'group relative cursor-pointer overflow-hidden rounded-lg bg-zinc-900',
        className
      )}
      onClick={onClick}
    >
      <Image
        src={currentThumbnail}
        alt="Video thumbnail"
        fill
        unoptimized
        sizes="100vw"
        className="aspect-video w-full object-cover transition-transform group-hover:scale-105"
        onError={() => {
          setCurrentThumbnail('/images/video-placeholder.png');
        }}
      />
      <div className="absolute inset-0 flex items-center justify-center bg-black/40 transition-colors group-hover:bg-black/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 transition-colors group-hover:bg-white">
          <Play className="ml-1 h-8 w-8 text-zinc-900" />
        </div>
      </div>
    </div>
  );
}

export default VideoPlayer;
