"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import { SuperteamLogo } from "@/components/ui/superteam-logo";

export function Footer({ locale }: { locale: string }) {
  const t = useTranslations("footer");
  const tn = useTranslations("newsletter");
  const pathname = usePathname();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");

  // Hide footer on lesson pages (IDE/challenge fills viewport)
  if (/\/courses\/[^/]+\/lessons\//.test(pathname)) return null;

  function handleSubscribe(e: React.FormEvent) {
    e.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setStatus("error");
      return;
    }
    setStatus("success");
    setEmail("");
    setTimeout(() => setStatus("idle"), 4000);
  }

  return (
    <footer
      role="contentinfo"
      aria-label={t("siteFooter")}
      style={{
        borderTop: "1px solid var(--c-border-subtle)",
        background: "var(--background)",
        fontFamily: "var(--font-mono)",
        fontSize: "10px",
        letterSpacing: "0.1em",
        color: "var(--c-text-muted)",
      }}
    >
      {/* Newsletter signup */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px",
          padding: "24px clamp(20px, 8vw, 120px) 16px",
          textAlign: "center",
        }}
      >
        <span
          style={{
            textTransform: "uppercase",
            fontSize: "10px",
            letterSpacing: "0.15em",
          }}
        >
          {tn("title")}
        </span>
        <span
          style={{
            fontSize: "10px",
            color: "var(--c-text-muted)",
            maxWidth: "400px",
          }}
        >
          {tn("subtitle")}
        </span>
        <form
          onSubmit={handleSubscribe}
          style={{
            display: "flex",
            gap: "6px",
            marginTop: "4px",
            width: "100%",
            maxWidth: "360px",
          }}
        >
          <input
            type="email"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              if (status === "error") setStatus("idle");
            }}
            placeholder={tn("placeholder")}
            aria-label={tn("placeholder")}
            style={{
              flex: 1,
              padding: "6px 10px",
              background: "transparent",
              border: "1px solid var(--c-border-subtle)",
              color: "var(--c-text)",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "0.05em",
              outline: "none",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "6px 14px",
              background: "var(--c-text-muted)",
              color: "var(--background)",
              border: "none",
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              fontWeight: 600,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              cursor: "pointer",
            }}
          >
            {tn("subscribe")}
          </button>
        </form>
        {status === "success" && (
          <span
            style={{ color: "var(--solana-green, #00FFA3)", fontSize: "10px" }}
          >
            {tn("success")}
          </span>
        )}
        {status === "error" && (
          <span style={{ color: "#EF4444", fontSize: "10px" }}>
            {tn("invalidEmail")}
          </span>
        )}
      </div>

      {/* Original footer row */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px clamp(20px, 8vw, 120px) 24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <span
            style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
          >
            <SuperteamLogo size={14} className="currentColor" />
            <em
              style={{
                fontStyle: "italic",
                fontFamily: "var(--font-brand)",
                fontSize: "12px",
                letterSpacing: 0,
              }}
            >
              {t("tagline")}
            </em>
          </span>
        </div>

        <nav
          aria-label={t("footerNavigation")}
          style={{ display: "flex", gap: "24px" }}
        >
          <Link
            href={`/${locale}/courses`}
            aria-label={`${t("courses")} — ${t("footerNavigation")}`}
            style={{
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            {t("courses")}
          </Link>
          <Link
            href={`/${locale}/dashboard`}
            aria-label={`${t("dashboard")} — ${t("footerNavigation")}`}
            style={{
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            {t("dashboard")}
          </Link>
          <Link
            href={`/${locale}/leaderboard`}
            aria-label={`${t("leaderboard")} — ${t("footerNavigation")}`}
            style={{
              textTransform: "uppercase",
              color: "var(--c-text-muted)",
              textDecoration: "none",
              transition: "color 0.2s",
            }}
          >
            {t("leaderboard")}
          </Link>
        </nav>

        <div style={{ textTransform: "uppercase" }}>{t("builtOn")}</div>
      </div>
    </footer>
  );
}
