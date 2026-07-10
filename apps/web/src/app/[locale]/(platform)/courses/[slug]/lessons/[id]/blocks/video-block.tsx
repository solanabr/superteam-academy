"use client";

import type { VideoBlockData } from "@/lib/sanity/types";
import type { BlockRenderProps } from "./types";

function getEmbedUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (u.hostname === "www.youtube.com" || u.hostname === "youtube.com") {
      const v = u.searchParams.get("v");
      return v ? `https://www.youtube.com/embed/${v}` : null;
    }
    if (u.hostname === "youtu.be") {
      const id = u.pathname.slice(1);
      return id ? `https://www.youtube.com/embed/${id}` : null;
    }
    if (u.hostname === "www.vimeo.com" || u.hostname === "vimeo.com") {
      const id = u.pathname.slice(1);
      return id ? `https://player.vimeo.com/video/${id}` : null;
    }
    return null;
  } catch {
    return null;
  }
}

export function VideoBlock({ block }: BlockRenderProps) {
  const b = block as VideoBlockData;
  const embedUrl = getEmbedUrl(b.url);
  if (!embedUrl) return null;
  return (
    <div className="mb-6 overflow-hidden rounded-lg border-[2.5px] border-border shadow-card">
      <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
        <iframe
          src={embedUrl}
          title="Lesson video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </div>
  );
}
