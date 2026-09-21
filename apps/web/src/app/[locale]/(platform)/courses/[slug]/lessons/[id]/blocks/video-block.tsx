"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { VideoBlockData } from "@superteam-lms/types";
import { VideoUnavailableCard } from "@/components/lessons/video-unavailable-card";
import { embedUrlFor, parseVideoRef } from "@/lib/video/youtube";
import { findSpotifyUrl } from "@/lib/video/spotify";
import type { BlockRenderProps } from "./types";

/** YouTube player error codes that mean "embedding is disabled for this video". */
const EMBED_DISABLED_CODES = new Set([101, 150]);
const YOUTUBE_ORIGIN = "https://www.youtube.com";

/**
 * Runtime companion to the server-side oembed probe (`lib/video/embeddability`).
 *
 * The server check runs at most once a day per video, so a video whose owner
 * flips playback off mid-window would still render a dead player. The embedded
 * player reports that itself: with `enablejsapi=1`, answering YouTube's widget
 * handshake makes it post `onError` events to us, and codes 101/150 are exactly
 * "the owner disallows embedding". We then swap in the same card the server
 * would have rendered. If no message ever arrives, nothing changes.
 */
function useEmbedDisabledAtRuntime(iframe: React.RefObject<HTMLIFrameElement>) {
  const [disabled, setDisabled] = useState(false);

  const startListening = useCallback(() => {
    iframe.current?.contentWindow?.postMessage(
      JSON.stringify({ event: "listening", id: 1, channel: "widget" }),
      YOUTUBE_ORIGIN
    );
  }, [iframe]);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      if (event.origin !== YOUTUBE_ORIGIN) return;
      if (typeof event.data !== "string") return;
      try {
        const msg = JSON.parse(event.data) as {
          event?: unknown;
          info?: unknown;
        };
        if (msg.event !== "onError") return;
        if (
          typeof msg.info === "number" &&
          EMBED_DISABLED_CODES.has(msg.info)
        ) {
          setDisabled(true);
        }
      } catch {
        // Not our JSON — YouTube also posts other shapes on this channel.
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  return { disabled, startListening };
}

export function VideoBlock({ block, ctx }: BlockRenderProps) {
  const b = block as VideoBlockData;
  const ref = parseVideoRef(b.url);
  const iframe = useRef<HTMLIFrameElement>(null);
  const { disabled, startListening } = useEmbedDisabledAtRuntime(iframe);

  if (!ref) return null;

  const serverVerdict = ctx.videoEmbeds?.[block.key];
  const showCard =
    ref.provider === "youtube" &&
    (serverVerdict?.embeddable === false || disabled);

  if (showCard) {
    return (
      <VideoUnavailableCard
        videoId={ref.id}
        videoTitle={serverVerdict?.title ?? null}
        lessonTitle={ctx.lesson.title}
        spotifyUrl={findSpotifyUrl(ctx.lesson.blocks)}
      />
    );
  }

  // `enablejsapi=1` only opens the message channel; the player is otherwise
  // unchanged (no controls or autoplay differences).
  const src =
    ref.provider === "youtube"
      ? `${embedUrlFor(ref)}?enablejsapi=1`
      : embedUrlFor(ref);

  return (
    <div className="mb-6 overflow-hidden rounded-lg border-[2.5px] border-border shadow-card">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          ref={iframe}
          src={src}
          onLoad={ref.provider === "youtube" ? startListening : undefined}
          title={ctx.lesson.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
