"use client";

import { SpotifyLogo, YoutubeLogo } from "@phosphor-icons/react";
import { useState } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { youtubeThumbnailUrl, youtubeWatchUrl } from "@/lib/video/youtube";

interface VideoUnavailableCardProps {
  /** YouTube video id — the watch link and the poster frame both derive from it. */
  videoId: string;
  /** oembed title when YouTube gave us one; the lesson title is the fallback. */
  videoTitle: string | null;
  lessonTitle: string;
  /** The lesson's Spotify audio alternative, when it has one. */
  spotifyUrl: string | null;
}

/**
 * What a lesson renders instead of the player when the video owner has
 * disabled playback on other websites (owner decision 2026-09-21: most lesson
 * videos now come from channels we do not control).
 *
 * It occupies the player's 16:9 footprint so the page does not reflow, keeps
 * the real thumbnail as the poster (YouTube still serves `hqdefault.jpg` for a
 * restricted id), and gives the learner the two ways forward that DO work:
 * watch it on YouTube, or listen to the lesson's audio version.
 */
export function VideoUnavailableCard({
  videoId,
  videoTitle,
  lessonTitle,
  spotifyUrl,
}: VideoUnavailableCardProps) {
  const t = useTranslations("lesson.videoFallback");
  const [posterFailed, setPosterFailed] = useState(false);
  const title = videoTitle ?? lessonTitle;

  return (
    <section
      aria-label={t("regionLabel")}
      className="mb-6 overflow-hidden rounded-lg border-[2.5px] border-border bg-card shadow-card"
    >
      <div className="relative min-h-[11rem] w-full">
        {/* The 16:9 spacer: the same box the iframe fills, so swapping the
            player for this card shifts nothing above or below it. */}
        <div className="w-full pb-[56.25%]" aria-hidden="true" />

        {/* Poster frame. A plain <img> (not next/image): the host is YouTube's
            CDN and the card must survive the image being blocked too — an
            error falls through to the plate colour below. */}
        {!posterFailed && (
          /* eslint-disable-next-line @next/next/no-img-element --
             next/image would proxy this through our optimizer and swallow the
             error we rely on; the point of this element is that it may fail. */
          <img
            src={youtubeThumbnailUrl(videoId)}
            alt=""
            aria-hidden="true"
            onError={() => setPosterFailed(true)}
            className="absolute inset-0 h-full w-full object-cover"
          />
        )}

        {/* Scrim: fixed dark wash in both themes — it sits over a photo, not
            over the page ground, so it must not follow the theme. */}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[rgba(12,10,9,0.72)]"
        />

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-4 py-5 text-center">
          <YoutubeLogo
            size={36}
            weight="fill"
            aria-hidden="true"
            className="shrink-0 text-white/90"
          />
          <p className="line-clamp-2 max-w-[38ch] font-display text-sm font-extrabold text-white sm:text-base">
            {title}
          </p>
          <Button asChild variant="primary" size="sm">
            <a
              href={youtubeWatchUrl(videoId)}
              target="_blank"
              rel="noopener noreferrer"
            >
              {t("watchOnYoutube")}
            </a>
          </Button>
        </div>
      </div>

      <div className="flex flex-col items-center gap-3 border-t-[2.5px] border-border px-4 py-3 sm:flex-row sm:justify-between sm:text-left">
        <p className="text-center text-xs text-text-2 sm:text-left">
          {t("onlyOnYoutube")}
        </p>
        {spotifyUrl && (
          <Button asChild variant="secondary" size="sm" className="shrink-0">
            <a href={spotifyUrl} target="_blank" rel="noopener noreferrer">
              <SpotifyLogo size={16} weight="fill" aria-hidden="true" />
              {t("listenOnSpotify")}
            </a>
          </Button>
        )}
      </div>
    </section>
  );
}
