import { ImageResponse } from "next/og";

export const size = {
  width: 1200,
  height: 630
};

export const contentType = "image/png";

export default function OpenGraphImage(): ImageResponse {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: 64,
          background: "linear-gradient(135deg, #121826, #3b0764)",
          color: "white"
        }}
      >
        <div style={{ fontSize: 32, opacity: 0.9 }}>Superteam Brazil</div>
        <div style={{ marginTop: 16, fontSize: 72, fontWeight: 700 }}>Superteam Academy</div>
        <div style={{ marginTop: 16, fontSize: 32, opacity: 0.9 }}>
          Solana developer learning platform
        </div>
      </div>
    ),
    { ...size }
  );
}
