"use client"

import { useEffect, useRef } from "react"

const BUNNY_LIBRARY_ID = process.env.NEXT_PUBLIC_BUNNY_LIBRARY_ID || "568825"

export function BunnyVideoPlayer({
  videoId,
  onFinishedVideo,
}: {
  videoId: string
  onFinishedVideo?: () => void
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null)

  useEffect(() => {
    if (!onFinishedVideo) return

    const handleMessage = (event: MessageEvent) => {
      // Bunny.net sends postMessage events for video state changes
      if (event.origin !== "https://iframe.mediadelivery.net") return

      try {
        const data = typeof event.data === "string" ? JSON.parse(event.data) : event.data
        
        // Check if video has ended
        if (data.event === "ended" || data.type === "ended") {
          onFinishedVideo()
        }
      } catch (error) {
        console.error("Error parsing Bunny.net message:", error)
      }
    }

    window.addEventListener("message", handleMessage)
    return () => window.removeEventListener("message", handleMessage)
  }, [onFinishedVideo])

  return (
    <div style={{ position: "relative", paddingTop: "56.25%" }}>
      <iframe
        ref={iframeRef}
        src={`https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${videoId}?autoplay=false&loop=false&muted=false&preload=true&responsive=true`}
        loading="lazy"
        style={{
          border: 0,
          position: "absolute",
          top: 0,
          height: "100%",
          width: "100%",
        }}
        allow="accelerometer;gyroscope;autoplay;encrypted-media;picture-in-picture;"
        allowFullScreen
      />
    </div>
  )
}