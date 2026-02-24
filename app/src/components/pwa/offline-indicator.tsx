"use client";

import { useState, useEffect, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { WifiOff, Wifi } from "lucide-react";

type BannerState = "offline" | "back-online" | null;

export function OfflineIndicator() {
  const t = useTranslations("pwa");
  const [state, setState] = useState<BannerState>(null);
  const wasOffline = useRef(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Set initial state only if already offline
    if (!navigator.onLine) {
      setState("offline");
      wasOffline.current = true;
    }

    const handleOffline = () => {
      wasOffline.current = true;
      if (timerRef.current) clearTimeout(timerRef.current);
      setState("offline");
    };

    const handleOnline = () => {
      if (!wasOffline.current) return;
      wasOffline.current = false;
      setState("back-online");
      timerRef.current = setTimeout(() => {
        setState(null);
      }, 3000);
    };

    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);

    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const isOffline = state === "offline";
  const isBackOnline = state === "back-online";
  const prefersReducedMotion = useReducedMotion();

  return (
    <AnimatePresence>
      {state !== null && (
        <motion.div
          initial={prefersReducedMotion ? false : { y: -48, opacity: 0 }}
          animate={prefersReducedMotion ? { opacity: 1 } : { y: 0, opacity: 1 }}
          exit={prefersReducedMotion ? { opacity: 0 } : { y: -48, opacity: 0 }}
          transition={prefersReducedMotion ? { duration: 0 } : { duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          role="status"
          aria-live="polite"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 95,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            padding: "10px 24px",
            background: isOffline
              ? "rgba(239, 68, 68, 0.12)"
              : "rgba(20, 241, 149, 0.1)",
            borderBottom: isOffline
              ? "1px solid rgba(239, 68, 68, 0.25)"
              : "1px solid rgba(20, 241, 149, 0.2)",
            backdropFilter: "blur(12px)",
            WebkitBackdropFilter: "blur(12px)",
          }}
        >
          {/* Status dot */}
          <div
            style={{
              width: 6,
              height: 6,
              borderRadius: "1px",
              background: isOffline ? "#EF4444" : "var(--xp)",
              boxShadow: isOffline
                ? "0 0 6px rgba(239,68,68,0.5)"
                : "0 0 6px rgba(20,241,149,0.5)",
            }}
          />

          {/* Icon */}
          {isOffline ? (
            <WifiOff
              style={{ width: 14, height: 14, color: "#EF4444" }}
            />
          ) : (
            <Wifi
              style={{ width: 14, height: 14, color: "var(--xp)" }}
            />
          )}

          {/* Text */}
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: "10px",
              letterSpacing: "2px",
              textTransform: "uppercase",
              color: isOffline ? "#EF4444" : "var(--xp)",
            }}
          >
            {isOffline ? t("offlineBanner") : isBackOnline ? t("backOnline") : null}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
