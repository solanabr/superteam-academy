"use client";

import { type ReactNode, useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, ShieldCheck } from "lucide-react";

type GateState = "sealed" | "connecting" | "opening" | null;

interface WalletGateProps {
  children: ReactNode;
}

export function WalletGate({ children }: WalletGateProps) {
  const { connected, connecting } = useWallet();
  const { setVisible } = useWalletModal();
  const t = useTranslations("dashboard.walletGate");
  const [gate, setGate] = useState<GateState>("sealed");
  const [isMobile, setIsMobile] = useState(false);
  const autoConnectChecked = useRef(false);

  // Detect mobile
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
      // Wallet disconnected mid-session
      setGate("sealed");
    }
  }, [connected, connecting, gate]);

  // Unmount gate after opening animation
  useEffect(() => {
    if (gate !== "opening") return;
    const timer = setTimeout(() => setGate(null), 1400);
    return () => clearTimeout(timer);
  }, [gate]);

  // Gate is fully open — render children directly
  if (gate === null) {
    return <>{children}</>;
  }

  const isConnecting = gate === "connecting";
  const isOpening = gate === "opening";

  // Panel animation variants
  const panelTransition = {
    duration: 1.2,
    ease: [0.16, 1, 0.3, 1] as const,
  };

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
      {/* Hidden content for accessibility */}
      <div aria-hidden={gate !== null} style={{ display: "none" }}>
        {children}
      </div>

      <AnimatePresence>
        {gate !== null && (
          <div
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
            {/* Left / Top Panel */}
            <motion.div
              initial={false}
              animate={leftPanel[animState]}
              transition={panelTransition}
              style={{
                position: "absolute",
                background: "var(--overlay-bg)",
                ...(isMobile
                  ? { top: 0, left: 0, right: 0, height: "50%" }
                  : { top: 0, left: 0, bottom: 0, width: "50%" }),
              }}
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
              {/* Dashed line */}
              <div
                style={{
                  position: "absolute",
                  ...(isMobile
                    ? {
                        bottom: 0,
                        left: "10%",
                        right: "10%",
                        height: 0,
                        borderBottom: "1px dashed var(--overlay-divider)",
                      }
                    : {
                        top: "10%",
                        bottom: "10%",
                        right: 0,
                        width: 0,
                        borderRight: "1px dashed var(--overlay-divider)",
                      }),
                }}
              />
            </motion.div>

            {/* Right / Bottom Panel */}
            <motion.div
              initial={false}
              animate={rightPanel[animState]}
              transition={panelTransition}
              style={{
                position: "absolute",
                background: "var(--overlay-bg)",
                ...(isMobile
                  ? { bottom: 0, left: 0, right: 0, height: "50%" }
                  : { top: 0, right: 0, bottom: 0, width: "50%" }),
              }}
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
              {/* Dashed line */}
              <div
                style={{
                  position: "absolute",
                  ...(isMobile
                    ? {
                        top: 0,
                        left: "10%",
                        right: "10%",
                        height: 0,
                        borderTop: "1px dashed var(--overlay-divider)",
                      }
                    : {
                        top: "10%",
                        bottom: "10%",
                        left: 0,
                        width: 0,
                        borderLeft: "1px dashed var(--overlay-divider)",
                      }),
                }}
              />
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
                  fontFamily: "var(--v9-mono)",
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
                  fontFamily: "var(--v9-serif)",
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
                    color: "var(--v9-sol-green)",
                  }}
                >
                  {t("sealed")}
                </span>
              </h1>

              {/* Subtext */}
              <p
                style={{
                  fontFamily: "var(--v9-sans)",
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
                onClick={() => setVisible(true)}
                disabled={isConnecting}
                aria-busy={isConnecting}
                style={{
                  fontFamily: "var(--v9-mono)",
                  fontSize: "11px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  padding: "16px 48px",
                  background: isConnecting
                    ? "var(--overlay-divider)"
                    : "transparent",
                  color: isConnecting
                    ? "var(--overlay-text)"
                    : "var(--v9-sol-green)",
                  border: `1px solid ${isConnecting ? "var(--overlay-border)" : "var(--v9-sol-green)"}`,
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
                  fontFamily: "var(--v9-mono)",
                  fontSize: "9px",
                  letterSpacing: "2px",
                  color: "var(--c-text-faint)",
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
                  initial={{ scale: 3, rotate: -12, opacity: 0 }}
                  animate={{ scale: 1, rotate: 0, opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{
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
                      color: "var(--v9-sol-green)",
                      marginBottom: 16,
                    }}
                  />
                  <p
                    style={{
                      fontFamily: "var(--v9-mono)",
                      fontSize: "14px",
                      letterSpacing: "6px",
                      textTransform: "uppercase",
                      color: "var(--v9-sol-green)",
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
                      ? "var(--v9-sol-green)"
                      : "#EF4444",
                    boxShadow: isConnecting
                      ? "0 0 6px rgba(20,241,149,0.5)"
                      : "0 0 6px rgba(239,68,68,0.5)",
                  }}
                />
                <span
                  style={{
                    fontFamily: "var(--v9-mono)",
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
