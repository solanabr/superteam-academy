"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? "";
const COOKIE_NAME = "cf_clearance_sa";
const COOKIE_TTL_HOURS = 24;

function getCookie(name: string): string | null {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, hours: number) {
  const expires = new Date(Date.now() + hours * 3600_000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

export function TurnstileGate({ children }: { children: React.ReactNode }) {
  const [verified, setVerified] = useState<boolean | null>(null);
  const [error, setError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!SITE_KEY) {
      setVerified(true);
      return;
    }
    if (getCookie(COOKIE_NAME)) {
      setVerified(true);
      return;
    }
    setVerified(false);
  }, []);

  const renderWidget = useCallback(() => {
    if (renderedRef.current || !containerRef.current) return;
    renderedRef.current = true;

    const w = window as unknown as {
      turnstile?: {
        render: (
          el: HTMLElement,
          opts: Record<string, unknown>,
        ) => string;
      };
    };

    if (!w.turnstile) {
      setTimeout(renderWidget, 200);
      renderedRef.current = false;
      return;
    }

    w.turnstile.render(containerRef.current, {
      sitekey: SITE_KEY,
      theme: "dark",
      callback: (token: string) => {
        setCookie(COOKIE_NAME, token, COOKIE_TTL_HOURS);
        setVerified(true);
      },
      "error-callback": () => setError(true),
      "expired-callback": () => setError(true),
    });
  }, []);

  useEffect(() => {
    if (verified === false) renderWidget();
  }, [verified, renderWidget]);

  // Not yet determined — render nothing to avoid flash
  if (verified === null) return null;

  // Verified — render app
  if (verified) return <>{children}</>;

  // Show gate
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 24,
        background: "#0A0A0A",
      }}
    >
      <p
        style={{
          fontFamily: "monospace",
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: "#666",
        }}
      >
        Verifying you are human
      </p>
      <div ref={containerRef} />
      {error && (
        <p style={{ fontFamily: "monospace", fontSize: 11, color: "#EF4444" }}>
          Verification failed.{" "}
          <button
            onClick={() => {
              setError(false);
              renderedRef.current = false;
              renderWidget();
            }}
            style={{
              background: "none",
              border: "none",
              color: "#6693F7",
              cursor: "pointer",
              fontFamily: "monospace",
              fontSize: 11,
              textDecoration: "underline",
            }}
          >
            Retry
          </button>
        </p>
      )}
    </div>
  );
}
