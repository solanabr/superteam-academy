import { ImageResponse } from "next/og";
import { NextRequest } from "next/server";

export const runtime = "edge";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const title = searchParams.get("title") || "Superteam Academy";
  const description =
    searchParams.get("description") ||
    "Learn Solana development, earn XP tokens, and collect credential NFTs";
  const type = searchParams.get("type") || "default";

  return new ImageResponse(
    (
      <div
        style={{
          height: "100%",
          width: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#080808",
          background: "linear-gradient(135deg, #080808 0%, #1a0a2e 50%, #080808 100%)",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            maxWidth: 800,
            padding: "40px",
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: 16,
              background: "linear-gradient(135deg, #9945FF, #14F195)",
              marginBottom: 32,
              display: "flex",
            }}
          />

          {/* Title */}
          <div
            style={{
              fontSize: type === "course" ? 48 : 56,
              fontWeight: 800,
              color: "white",
              textAlign: "center",
              lineHeight: 1.1,
              marginBottom: 16,
              display: "flex",
            }}
          >
            {title}
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: 24,
              color: "#a3a3a3",
              textAlign: "center",
              lineHeight: 1.4,
              display: "flex",
            }}
          >
            {description}
          </div>

          {/* Brand */}
          <div
            style={{
              marginTop: 40,
              fontSize: 20,
              background: "linear-gradient(90deg, #9945FF, #14F195)",
              backgroundClip: "text",
              color: "transparent",
              fontWeight: 700,
              display: "flex",
            }}
          >
            Superteam Academy
          </div>
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  );
}
