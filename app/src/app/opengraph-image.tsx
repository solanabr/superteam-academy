import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Superteam Academy - Learn Solana Development";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function OGImage() {
  return new ImageResponse(
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        width: "100%",
        height: "100%",
        background:
          "linear-gradient(135deg, #0a1f14 0%, #1e3a28 40%, #0d2818 100%)",
        fontFamily: "system-ui, sans-serif",
      }}
    >
      {/* Decorative top bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 4,
          background: "linear-gradient(90deg, #e8cc4a, #4a8c5c, #e8cc4a)",
        }}
      />

      {/* Logo area */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 32,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 64,
            height: 64,
            borderRadius: 16,
            background: "linear-gradient(135deg, #4a8c5c, #2d6a4f)",
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
            <path d="M6 12v5c3 3 9 3 12 0v-5" />
          </svg>
        </div>
        <span
          style={{
            fontSize: 28,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -0.5,
          }}
        >
          Superteam Academy
        </span>
      </div>

      {/* Main heading */}
      <h1
        style={{
          fontSize: 56,
          fontWeight: 800,
          color: "#ffffff",
          textAlign: "center",
          lineHeight: 1.1,
          margin: 0,
          maxWidth: 800,
          letterSpacing: -1,
        }}
      >
        Learn Solana Development
      </h1>

      {/* Subtitle */}
      <p
        style={{
          fontSize: 22,
          color: "#a3b8a8",
          textAlign: "center",
          marginTop: 16,
          maxWidth: 600,
          lineHeight: 1.4,
        }}
      >
        Interactive courses, on-chain credentials, and gamified progression
      </p>

      {/* Feature tags */}
      <div
        style={{
          display: "flex",
          gap: 12,
          marginTop: 40,
        }}
      >
        {[
          "Interactive Coding",
          "On-Chain Credentials",
          "Gamified XP",
          "3 Languages",
        ].map((tag) => (
          <div
            key={tag}
            style={{
              display: "flex",
              alignItems: "center",
              padding: "8px 20px",
              borderRadius: 24,
              background: "rgba(74, 140, 92, 0.2)",
              border: "1px solid rgba(74, 140, 92, 0.3)",
              fontSize: 16,
              fontWeight: 600,
              color: "#7cc68e",
            }}
          >
            {tag}
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div
        style={{
          position: "absolute",
          bottom: 32,
          display: "flex",
          alignItems: "center",
          gap: 8,
          fontSize: 16,
          color: "#6b8a74",
        }}
      >
        <span>Built by Superteam Brazil</span>
        <span style={{ color: "#e8cc4a" }}>•</span>
        <span>Open Source</span>
        <span style={{ color: "#e8cc4a" }}>•</span>
        <span>Powered by Solana</span>
      </div>
    </div>,
    { ...size },
  );
}
