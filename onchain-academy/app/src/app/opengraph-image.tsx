import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Superteam Academy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    <div
      style={{
        background:
          "linear-gradient(135deg, #000000 0%, #0A090F 50%, #000000 100%)",
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "sans-serif",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "16px",
          marginBottom: "24px",
        }}
      >
        <div
          style={{
            width: "64px",
            height: "64px",
            borderRadius: "8px",
            background: "linear-gradient(135deg, #9945FF, #00FFA3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "32px",
            fontWeight: "bold",
            color: "white",
          }}
        >
          SA
        </div>
      </div>
      <div
        style={{
          fontSize: "56px",
          fontWeight: "bold",
          color: "#FFFFFF",
          marginBottom: "16px",
          textAlign: "center",
        }}
      >
        Superteam Academy
      </div>
      <div
        style={{
          fontSize: "24px",
          color: "#ABABBA",
          textAlign: "center",
          maxWidth: "700px",
        }}
      >
        Master Solana Development
      </div>
      <div
        style={{
          marginTop: "32px",
          display: "flex",
          gap: "24px",
        }}
      >
        <div style={{ fontSize: "18px", color: "#00FFA3" }}>Earn XP</div>
        <div style={{ fontSize: "18px", color: "#ABABBA" }}>{"\u2022"}</div>
        <div style={{ fontSize: "18px", color: "#03E1FF" }}>
          On-Chain Credentials
        </div>
        <div style={{ fontSize: "18px", color: "#ABABBA" }}>{"\u2022"}</div>
        <div style={{ fontSize: "18px", color: "#DC1FFF" }}>
          Gamified Learning
        </div>
      </div>
    </div>,
    { ...size },
  );
}
