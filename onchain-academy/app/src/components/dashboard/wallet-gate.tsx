"use client";

import { type ReactNode, useState, useEffect, useRef, useCallback } from "react";
import { useWallet } from "@/lib/wallet/context";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

type GateState = "sealed" | "connecting" | "opening" | null;

interface WalletGateProps {
  children: ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
  const { connected, connecting } = useWallet();
  const t = useTranslations("dashboard.walletGate");
  const [gate, setGate] = useState<GateState>("sealed");
  const [isMobile, setIsMobile] = useState(false);
  const autoConnectChecked = useRef(false);
  const prefersReducedMotion = useReducedMotion();
  const gateRef = useRef<HTMLDivElement>(null);

  // Focus trap for the gate dialog
  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key !== "Tab") return;
    const dialog = gateRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
    if (focusable.length === 0) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      }
    } else {
      if (document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }
  }, []);

  useEffect(() => {
    if (gate === null || gate === "opening") return;
    const timer = setTimeout(() => {
      const btn = gateRef.current?.querySelector<HTMLElement>("button");
      btn?.focus();
    }, 200);
    document.addEventListener("keydown", trapFocus);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", trapFocus);
    };
  }, [gate, trapFocus]);

  // Detect mobile — only used for framer-motion animation direction,
  // NOT for panel positioning (that's CSS-driven to prevent CLS)
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 768px)");
    setIsMobile(mq.matches);
    const handler = (e: MediaQueryListEvent) => setIsMobile(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  // Wait for autoConnect to resolve on mount
  useEffect(() => {
    if (autoConnectChecked.current) return;
    const timer = setTimeout(() => {
      autoConnectChecked.current = true;
      if (connected) {
        setGate(null);
      }
    }, 150);
    return () => clearTimeout(timer);
  }, [connected]);

  // Handle early connection (autoConnect resolves before timeout)
  useEffect(() => {
    if (connected && !autoConnectChecked.current) {
      autoConnectChecked.current = true;
      setGate(null);
    }
  }, [connected]);

  // State transitions after autoConnect check
  useEffect(() => {
    if (!autoConnectChecked.current) return;

    if (connecting && gate === "sealed") {
      setGate("connecting");
    } else if (connected && (gate === "sealed" || gate === "connecting")) {
      setGate("opening");
    } else if (!connected && gate === null) {
      setGate("sealed");
    }
  }, [connected, connecting, gate]);

  // Unmount gate after opening animation
  useEffect(() => {
    if (gate !== "opening") return;
    const timer = setTimeout(() => setGate(null), 1400);
    return () => clearTimeout(timer);
  }, [gate]);

  const isConnecting = gate === "connecting";
  const isOpening = gate === "opening";

  // Panel animation variants — isMobile only affects animation DIRECTION
  // (the opening slide), not initial positioning (which is pure CSS)
  const panelTransition = prefersReducedMotion
    ? { duration: 0 }
    : { duration: 1.2, ease: [0.16, 1, 0.3, 1] as const };

  const leftPanel = {
    sealed: isMobile ? { y: 0 } : { x: 0 },
    opening: isMobile ? { y: "-100%" } : { x: "-100%" },
  };
  const rightPanel = {
    sealed: isMobile ? { y: 0 } : { x: 0 },
    opening: isMobile ? { y: "100%" } : { x: "100%" },
  };

  const animState = isOpening ? "opening" : "sealed";

  return (
    <>
      {children}

      <AnimatePresence>
        {gate !== null && (
          <div
            ref={gateRef}
            role="dialog"
            aria-modal="true"
            aria-label={t("label")}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 100,
              overflow: "hidden",
            }}
          >
            {/* Left / Top Panel — positioned via CSS class (globals.css) */}
            <motion.div
              className="gate-panel-left"
              initial={false}
              animate={leftPanel[animState]}
              transition={panelTransition}
            >
              {/* Corner brackets */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  left: 24,
                  width: 20,
                  height: 20,
                  borderTop: "1px solid var(--overlay-border)",
                  borderLeft: "1px solid var(--overlay-border)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: 24,
                  width: 20,
                  height: 20,
                  borderBottom: "1px solid var(--overlay-border)",
                  borderLeft: "1px solid var(--overlay-border)",
                }}
              />
              {/* Dashed line — positioned via CSS class */}
              <div className="gate-dashed-left" />
            </motion.div>

            {/* Right / Bottom Panel — positioned via CSS class (globals.css) */}
            <motion.div
              className="gate-panel-right"
              initial={false}
              animate={rightPanel[animState]}
              transition={panelTransition}
            >
              {/* Corner brackets */}
              <div
                style={{
                  position: "absolute",
                  top: 24,
                  right: 24,
                  width: 20,
                  height: 20,
                  borderTop: "1px solid var(--overlay-border)",
                  borderRight: "1px solid var(--overlay-border)",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  right: 24,
                  width: 20,
                  height: 20,
                  borderBottom: "1px solid var(--overlay-border)",
                  borderRight: "1px solid var(--overlay-border)",
                }}
              />
              {/* Dashed line — positioned via CSS class */}
              <div className="gate-dashed-right" />
            </motion.div>

            {/* Scan line */}
            {!isOpening && (
              <div
                style={{
                  position: "absolute",
                  left: 0,
                  right: 0,
                  height: "1px",
                  background:
                    "linear-gradient(90deg, transparent, rgba(20,241,149,0.3), transparent)",
                  animation: "wallet-gate-scan 4s linear infinite",
                  pointerEvents: "none",
                  zIndex: 2,
                }}
              />
            )}

            {/* Center Content */}
            <motion.div
              animate={{ opacity: isOpening ? 0 : 1 }}
              transition={{ duration: 0.3 }}
              style={{
                position: "absolute",
                inset: 0,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                zIndex: 3,
                pointerEvents: isOpening ? "none" : "auto",
                padding: "0 24px",
              }}
            >
              {/* Lock icon */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: "50%",
                  border: "1px solid var(--overlay-border)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  marginBottom: 28,
                  animation: isConnecting
                    ? "wallet-gate-lock-spin 1.5s linear infinite"
                    : "wallet-gate-pulse 3s ease-in-out infinite",
                }}
              >
                <Lock
                  style={{
                    width: 28,
                    height: 28,
                    color: "var(--overlay-text)",
                  }}
                />
              </div>

              {/* Label */}
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
                  fontSize: "clamp(36px, 6vw, 64px)",
                  fontWeight: 900,
                  color: "var(--foreground)",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                  margin: 0,
                  textAlign: "center",
                }}
              >
                {t("heading")}
                {" / "}
                <span
                  style={{
                    fontWeight: 300,
                    fontStyle: "italic",
                    color: "var(--xp)",
                  }}
                >
                  {t("sealed")}
                </span>
              </h1>

              {/* Subtext */}
              <p
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize: "15px",
                  color: "var(--c-text-dim)",
                  maxWidth: 420,
                  textAlign: "center",
                  lineHeight: 1.6,
                  margin: "20px 0 32px",
                }}
              >
                {t("subtext")}
              </p>

              {/* Connect button */}
              <button
                onClick={() => window.dispatchEvent(new Event("open-wallet-gateway"))}
                disabled={isConnecting}
                aria-busy={isConnecting}
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  padding: "16px 48px",
                  background: isConnecting
                    ? "var(--overlay-divider)"
                    : "transparent",
                  color: isConnecting
                    ? "var(--overlay-text)"
                    : "var(--xp)",
                  border: `1px solid ${isConnecting ? "var(--overlay-border)" : "var(--xp)"}`,
                  cursor: isConnecting ? "not-allowed" : "pointer",
                  transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
                  animation: isConnecting
                    ? "none"
                    : "wallet-gate-pulse 3s ease-in-out infinite",
                }}
              >
                {isConnecting ? t("verifying") : t("connectWallet")}
              </button>

              {/* Wallet hints */}
              <p
                style={{
                  fontFamily: "var(--font-mono)",
                  fontSize: "9px",
                  letterSpacing: "2px",
                  color: "var(--c-text-dim)",
                  marginTop: 16,
                }}
              >
                {t("walletHints")}
              </p>
            </motion.div>

            {/* WALLET VERIFIED stamp */}
            <AnimatePresence>
              {isOpening && (
                <motion.div
                  initial={prefersReducedMotion ? false : { scale: 3, rotate: -12, opacity: 0 }}
                  animate={prefersReducedMotion ? { opacity: 1 } : { scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={prefersReducedMotion ? { duration: 0 } : {
                    type: "spring",
                    stiffness: 300,
                    damping: 20,
                  }}
                  aria-live="assertive"
                  style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 4,
                    pointerEvents: "none",
                  }}
                >
                  <ShieldCheck
                    style={{
                      width: 48,
                      height: 48,
                      color: "var(--xp)",
                      marginBottom: 16,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "14px",
                      letterSpacing: "6px",
                      textTransform: "uppercase",
                      color: "var(--xp)",
                      fontWeight: 700,
                    }}
                  >
                    {t("walletVerified")}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom status bar */}
            {!isOpening && (
              <div
                style={{
                  position: "absolute",
                  bottom: 24,
                  left: 0,
                  right: 0,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 8,
                  zIndex: 3,
                }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "1px",
                    background: isConnecting
                      ? "var(--xp)"
                      : "#EF4444",
                    boxShadow: isConnecting
                      ? "0 0 6px rgba(20,241,149,0.5)"
                      : "0 0 6px rgba(239,68,68,0.5)",
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
                  {isConnecting ? t("connecting") : t("noWallet")}
                </span>
              </div>
            )}
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
