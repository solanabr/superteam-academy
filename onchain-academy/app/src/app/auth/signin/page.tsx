"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

const PROVIDER_META: Record<string, { label: string; icon: React.ReactNode; bg: string; text: string }> = {
  google: {
    label: "Continue with Google",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24">
        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"/>
        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A11.96 11.96 0 0 0 0 12c0 1.94.46 3.77 1.28 5.39l3.56-2.77.01-.53z"/>
        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
      </svg>
    ),
    bg: "#fff",
    text: "#1f1f1f",
  },
  github: {
    label: "Continue with GitHub",
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
      </svg>
    ),
    bg: "#24292f",
    text: "#fff",
  },
};

function SignInContent() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");
  const callbackUrl = searchParams.get("callbackUrl") ?? "/en/dashboard";
  const [configured, setConfigured] = useState<{ google: boolean; github: boolean } | null>(null);

  useEffect(() => {
    fetch("/api/auth/configured-providers")
      .then((r) => r.json())
      .then(setConfigured)
      .catch(() => setConfigured({ google: false, github: false }));
  }, []);

  const errorMessages: Record<string, string> = {
    OAuthSignin: "Could not start the sign-in flow. Please try again.",
    OAuthCallback: "Authentication failed. Please try again.",
    OAuthAccountNotLinked: "This email is already linked to another account.",
    Callback: "Authentication error. Please try again.",
    Default: "An unexpected error occurred.",
    Configuration: "OAuth provider is not configured. Contact the administrator.",
    AccessDenied: "Access denied. You may not have permission.",
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#0F0E0D",
        fontFamily: "'DM Sans', system-ui, sans-serif",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: 400,
          padding: "48px 40px",
          background: "#1A1918",
          border: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              letterSpacing: "0.2em",
              color: "#FF5C28",
              fontWeight: 700,
              marginBottom: 8,
            }}
          >
            SUPERTEAM ACADEMY
          </div>
          <h1
            style={{
              fontFamily: "'Instrument Serif', serif",
              fontSize: 28,
              fontWeight: 400,
              color: "#F6F5F2",
              margin: 0,
            }}
          >
            Sign In
          </h1>
          <p
            style={{
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              color: "#8A8784",
              marginTop: 8,
            }}
          >
            Connect your account to track progress
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div
            style={{
              padding: "12px 16px",
              marginBottom: 24,
              background: "rgba(239,68,68,0.08)",
              borderLeft: "3px solid #EF4444",
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "#EF4444",
              lineHeight: 1.5,
            }}
          >
            {errorMessages[error] ?? errorMessages.Default}
          </div>
        )}

        {/* OAuth buttons */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 32 }}>
          {configured === null ? (
            <div
              style={{
                textAlign: "center",
                padding: 20,
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                color: "#8A8784",
              }}
            >
              Loading...
            </div>
          ) : (
            <>
              {(["google", "github"] as const).map((providerId) => {
                if (!configured[providerId]) return null;
                const meta = PROVIDER_META[providerId];
                return (
                  <button
                    key={providerId}
                    onClick={() => signIn(providerId, { callbackUrl })}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 12,
                      width: "100%",
                      padding: "12px 20px",
                      background: meta.bg,
                      color: meta.text,
                      border: "1px solid rgba(255,255,255,0.1)",
                      fontSize: 14,
                      fontWeight: 500,
                      fontFamily: "'DM Sans', sans-serif",
                      cursor: "pointer",
                      transition: "opacity 0.2s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                    onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
                  >
                    {meta.icon}
                    {meta.label}
                  </button>
                );
              })}
              {!configured.google && !configured.github && (
                <div
                  style={{
                    textAlign: "center",
                    padding: "20px",
                    fontFamily: "var(--font-mono)",
                    fontSize: 11,
                    color: "#8A8784",
                    lineHeight: 1.6,
                  }}
                >
                  No OAuth providers configured.<br />
                  Connect your Solana wallet instead.
                </div>
              )}
            </>
          )}
        </div>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 16,
            marginBottom: 24,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 9,
              letterSpacing: "0.15em",
              color: "#8A8784",
              textTransform: "uppercase" as const,
            }}
          >
            or
          </span>
          <div style={{ flex: 1, height: 1, background: "rgba(255,255,255,0.06)" }} />
        </div>

        {/* Wallet connect CTA */}
        <a
          href="/en/dashboard"
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            width: "100%",
            padding: "12px 20px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#F6F5F2",
            fontSize: 14,
            fontWeight: 500,
            fontFamily: "'DM Sans', sans-serif",
            cursor: "pointer",
            textDecoration: "none",
            transition: "border-color 0.2s",
          }}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/>
            <path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/>
            <path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>
          </svg>
          Connect Solana Wallet
        </a>

        {/* Back link */}
        <div style={{ textAlign: "center", marginTop: 24 }}>
          <a
            href="/en"
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              letterSpacing: "0.1em",
              color: "#8A8784",
              textDecoration: "none",
            }}
          >
            Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense
      fallback={
        <div style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#0F0E0D",
        }}>
          <div style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "#8A8784",
          }}>
            Loading...
          </div>
        </div>
      }
    >
      <SignInContent />
    </Suspense>
  );
}
