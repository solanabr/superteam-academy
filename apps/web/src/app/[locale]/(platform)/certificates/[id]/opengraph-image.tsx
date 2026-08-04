import { ImageResponse } from "next/og";
import { createClient } from "@supabase/supabase-js";

/**
 * Dynamic OG/Twitter card for a certificate (owner ask, 04-08): sharing the
 * page URL anywhere (X, LinkedIn, chat) unfurls the certificate itself —
 * gradient frame, eyebrow, course title, recipient/completed/mint — instead
 * of a generic site card. X share intents cannot attach images; the card IS
 * the embedded image.
 *
 * Public data only: certificates are world-readable for public profiles (the
 * same RLS the page itself relies on), read here with the anon key.
 */

export const runtime = "edge";
export const alt = "Certificate of Completion — Superteam Academy";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const CREAM = "#fafaf7";
const INK = "#1c1917";
const MUTED = "#78716c";
const GREEN = "#0a7055";

export default async function Image(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;

  let courseTitle = "Certificate of Completion";
  let recipient = "";
  let minted = "";
  let mint = "";

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (url && anon) {
    try {
      const supabase = createClient(url, anon);
      const { data: cert } = await supabase
        .from("certificates")
        .select("course_title, user_id, mint_address, minted_at")
        .eq("id", id)
        .single();
      if (cert) {
        courseTitle = cert.course_title ?? courseTitle;
        mint = cert.mint_address
          ? `${cert.mint_address.slice(0, 6)}…${cert.mint_address.slice(-4)}`
          : "";
        minted = cert.minted_at
          ? new Date(cert.minted_at).toLocaleDateString("en-US", {
              year: "numeric",
              month: "short",
              day: "numeric",
            })
          : "";
        const { data: profile } = await supabase
          .from("public_profiles")
          .select("username")
          .eq("id", cert.user_id)
          .single();
        recipient = profile?.username ?? "";
      }
    } catch {
      // Fall through to the generic card — an unfurl must never 500.
    }
  }

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        background: CREAM,
        padding: 48,
      }}
    >
      {/* Solana-gradient frame — the certificate brand mark. */}
      <div
        style={{
          display: "flex",
          flex: 1,
          borderRadius: 28,
          padding: 4,
          background: "linear-gradient(135deg, #9945FF 0%, #14F195 100%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flex: 1,
            flexDirection: "column",
            borderRadius: 24,
            background: "#ffffff",
            padding: "56px 64px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 22,
                letterSpacing: 6,
                color: GREEN,
                textTransform: "uppercase",
                fontWeight: 700,
              }}
            >
              Certificate of Completion
            </span>
            <div
              style={{
                flex: 1,
                height: 2,
                background:
                  "linear-gradient(90deg, rgba(10,112,85,0.35), rgba(10,112,85,0))",
              }}
            />
            <span style={{ fontSize: 24, fontWeight: 800, color: GREEN }}>
              Superteam Academy
            </span>
          </div>

          <span
            style={{
              marginTop: 36,
              fontSize: 64,
              fontWeight: 800,
              color: INK,
              lineHeight: 1.1,
            }}
          >
            {courseTitle}
          </span>

          <div style={{ display: "flex", flex: 1 }} />

          <div style={{ display: "flex", gap: 72 }}>
            {recipient ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 18,
                    letterSpacing: 4,
                    color: MUTED,
                    textTransform: "uppercase",
                  }}
                >
                  Recipient
                </span>
                <span style={{ fontSize: 30, fontWeight: 700, color: INK }}>
                  {recipient}
                </span>
              </div>
            ) : null}
            {minted ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 18,
                    letterSpacing: 4,
                    color: MUTED,
                    textTransform: "uppercase",
                  }}
                >
                  Completed
                </span>
                <span style={{ fontSize: 30, fontWeight: 700, color: INK }}>
                  {minted}
                </span>
              </div>
            ) : null}
            {mint ? (
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span
                  style={{
                    fontSize: 18,
                    letterSpacing: 4,
                    color: MUTED,
                    textTransform: "uppercase",
                  }}
                >
                  Mint
                </span>
                <span style={{ fontSize: 30, fontWeight: 700, color: INK }}>
                  {mint}
                </span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>,
    { ...size }
  );
}
