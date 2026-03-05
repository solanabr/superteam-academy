"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Hls from "hls.js";

interface BackgroundVideoProps {
  src: string;
  poster: string;
  className?: string;
}

export function BackgroundVideo({
  src,
  poster,
  className = "",
}: BackgroundVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [posterError, setPosterError] = useState(false);
  const [videoError, setVideoError] = useState(false);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let hls: Hls | null = null;

    const onPlaying = () => setIsPlaying(true);
    const onError = () => setVideoError(true);
    video.addEventListener("playing", onPlaying);
    video.addEventListener("error", onError);

    if (video.canPlayType("application/vnd.apple.mpegurl")) {
      // Safari — native HLS
      video.src = src;
      video.play().catch(() => setVideoError(true));
    } else if (Hls.isSupported()) {
      hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false,
        maxBufferLength: 30,
        maxMaxBufferLength: 60,
      });
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) setVideoError(true);
      });
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        video.play().catch(() => setVideoError(true));
      });
    } else {
      setVideoError(true);
    }

    return () => {
      video.removeEventListener("playing", onPlaying);
      video.removeEventListener("error", onError);
      if (hls) {
        hls.destroy();
      }
    };
  }, [src]);

  const showFallback = videoError && posterError;

  return (
    <div className={`absolute inset-0 overflow-hidden ${className}`}>
      {/* Animated gradient fallback — shown when video + poster both fail */}
      {showFallback && (
        <div
          className="absolute inset-0 animate-pulse"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(153,69,255,0.15), transparent 60%), radial-gradient(ellipse 60% 50% at 30% 70%, rgba(20,241,149,0.08), transparent 50%), #0a0a0f",
          }}
        />
      )}

      {/* Poster image — fades out once video starts, hidden on error */}
      {!posterError && (
        <Image
          src={poster}
          alt=""
          fill
          sizes="100vw"
          unoptimized
          aria-hidden="true"
          onError={() => setPosterError(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isPlaying ? "opacity-0" : "opacity-100"
          }`}
        />
      )}

      {!videoError && (
        <video
          ref={videoRef}
          autoPlay
          loop
          muted
          playsInline
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            isPlaying ? "opacity-100" : "opacity-0"
          }`}
        />
      )}

      {/* Dark overlay for text readability */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Bottom gradient fade into page background */}
      <div
        className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
        style={{
          background:
            "linear-gradient(to bottom, transparent, var(--bg-canvas))",
        }}
      />
    </div>
  );
}
