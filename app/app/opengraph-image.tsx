import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Superteam Academy — On-Chain Learning on Solana";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #09090b 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Gradient accent line */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4,
            background: "linear-gradient(90deg, #9945FF, #14F195, #00C2FF)",
          }}
        />

        {/* Logo mark */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            height: 80,
            borderRadius: 20,
            background: "linear-gradient(135deg, #9945FF, #00C2FF)",
            marginBottom: 32,
            fontSize: 40,
          }}
        >
          <span style={{ color: "white" }}>S</span>
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: 56,
            fontWeight: 800,
            color: "#fafafa",
            letterSpacing: -1,
            marginBottom: 16,
          }}
        >
          Superteam Academy
        </div>

        {/* Subtitle */}
        <div
          style={{
            fontSize: 24,
            color: "#a1a1aa",
            maxWidth: 600,
            textAlign: "center",
            lineHeight: 1.4,
          }}
        >
          On-Chain Learning on Solana
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 48,
            marginTop: 48,
          }}
        >
          {[
            { value: "100%", label: "On-Chain" },
            { value: "SPL", label: "XP Tokens" },
            { value: "NFT", label: "Credentials" },
          ].map((stat) => (
            <div
              key={stat.label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  fontSize: 28,
                  fontWeight: 700,
                  background: "linear-gradient(90deg, #9945FF, #14F195)",
                  backgroundClip: "text",
                  color: "transparent",
                }}
              >
                {stat.value}
              </span>
              <span style={{ fontSize: 14, color: "#71717a", marginTop: 4 }}>
                {stat.label}
              </span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}
