import { ImageResponse } from "next/og";

/**
 * The default badge for an event with no uploaded artwork: the event name and
 * date on the brand gradient. Event NFTs point at it, so it has to be a real
 * image, not a CSS component.
 */

const SIZE = 512;
const PURPLE = "#9945FF";
const TEAL = "#14F195";
const INK = "#0b0b0f";

export function eventBadgeImage(event: {
  name: string;
  startsAt: string;
}): ImageResponse {
  const date = new Date(event.startsAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: `linear-gradient(135deg, ${PURPLE}, ${TEAL})`,
      }}
    >
      <div
        style={{
          width: 440,
          height: 440,
          borderRadius: 220,
          background: INK,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: 48,
          textAlign: "center",
          color: "#fff",
        }}
      >
        <div
          style={{
            fontSize: 22,
            letterSpacing: 6,
            color: TEAL,
            textTransform: "uppercase",
          }}
        >
          Attended
        </div>
        <div
          style={{
            marginTop: 18,
            fontSize: event.name.length > 32 ? 34 : 44,
            fontWeight: 800,
            lineHeight: 1.1,
          }}
        >
          {event.name}
        </div>
        <div style={{ marginTop: 22, fontSize: 24, color: "#c4c4cc" }}>
          {date}
        </div>
        <div
          style={{
            marginTop: 28,
            fontSize: 18,
            letterSpacing: 3,
            color: PURPLE,
          }}
        >
          SUPERTEAM ACADEMY
        </div>
      </div>
    </div>,
    {
      width: SIZE,
      height: SIZE,
      headers: { "Cache-Control": "public, max-age=300, s-maxage=3600" },
    }
  );
}
