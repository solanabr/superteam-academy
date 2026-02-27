"use client";

import { useTranslations } from "next-intl";
import { SuperteamLogo } from "@/components/ui/superteam-logo";
import { WifiOff } from "lucide-react";

export default function OfflinePage() {
  const t = useTranslations("offline");

  return (
    <div
      style={{
        minHeight: "calc(100vh - 80px)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "0 24px",
        textAlign: "center",
      }}
    >
      {/* Corner brackets */}
      <div
        style={{
          position: "relative",
          padding: "64px 48px",
          maxWidth: 480,
          width: "100%",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: 20,
            height: 20,
            borderTop: "1px solid var(--overlay-border)",
            borderLeft: "1px solid var(--overlay-border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 0,
            right: 0,
            width: 20,
            height: 20,
            borderTop: "1px solid var(--overlay-border)",
            borderRight: "1px solid var(--overlay-border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            width: 20,
            height: 20,
            borderBottom: "1px solid var(--overlay-border)",
            borderLeft: "1px solid var(--overlay-border)",
          }}
        />
        <div
          style={{
            position: "absolute",
            bottom: 0,
            right: 0,
            width: 20,
            height: 20,
            borderBottom: "1px solid var(--overlay-border)",
            borderRight: "1px solid var(--overlay-border)",
          }}
        />

        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 32,
          }}
        >
          <SuperteamLogo size={40} className="text-[var(--c-text-dim)]" />
        </div>

        {/* Offline icon */}
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            border: "1px solid var(--overlay-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 28px",
          }}
        >
          <WifiOff
            style={{
              width: 24,
              height: 24,
              color: "var(--c-text-dim)",
            }}
          />
        </div>

        {/* Overline label */}
        <p
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "9px",
            letterSpacing: "4px",
            textTransform: "uppercase",
            color: "var(--c-text-dim)",
            marginBottom: 16,
          }}
        >
          {t("label")}
        </p>

        {/* Heading */}
        <h1
          style={{
            fontFamily: "var(--font-brand)",
            fontSize: "clamp(32px, 5vw, 48px)",
            fontWeight: 900,
            fontStyle: "italic",
            color: "var(--foreground)",
            letterSpacing: "-1.5px",
            lineHeight: 1.1,
            margin: "0 0 16px",
          }}
        >
          {t("heading")}
        </h1>

        {/* Subtext */}
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize: "15px",
            color: "var(--c-text-dim)",
            lineHeight: 1.6,
            margin: "0 0 36px",
            maxWidth: 360,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          {t("subtext")}
        </p>

        {/* Retry button */}
        <button
          onClick={() => window.location.reload()}
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: "11px",
            letterSpacing: "3px",
            textTransform: "uppercase",
            padding: "14px 40px",
            background: "transparent",
            color: "var(--xp)",
            border: "1px solid var(--xp)",
            cursor: "pointer",
            transition: "all 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
          }}
        >
          {t("retry")}
        </button>

        {/* Status indicator */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 8,
            marginTop: 32,
          }}
        >
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "1px",
              background: "#EF4444",
              boxShadow: "0 0 6px rgba(239,68,68,0.5)",
            }}
          />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "9px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: "var(--c-text-dim)",
            }}
          >
            {t("status")}
          </span>
        </div>
      </div>
    </div>
  );
}
