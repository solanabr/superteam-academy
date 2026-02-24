"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Download, X } from "lucide-react";
import { SuperteamLogo } from "@/components/ui/superteam-logo";

const DISMISS_KEY = "stacad:pwa-dismiss";
const COOLDOWN_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const t = useTranslations("pwa");
  const [show, setShow] = useState(false);
  const deferredPrompt = useRef<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    const dismissed = localStorage.getItem(DISMISS_KEY);
    if (dismissed) {
      const ts = parseInt(dismissed, 10);
      if (Date.now() - ts < COOLDOWN_MS) return;
    }

    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e as BeforeInstallPromptEvent;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = useCallback(async () => {
    const prompt = deferredPrompt.current;
    if (!prompt) return;

    await prompt.prompt();
    const { outcome } = await prompt.userChoice;

    if (outcome === "accepted") {
      setShow(false);
    }
    deferredPrompt.current = null;
  }, []);

  const handleDismiss = useCallback(() => {
    localStorage.setItem(DISMISS_KEY, String(Date.now()));
    setShow(false);
    deferredPrompt.current = null;
  }, []);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 100, opacity: 0 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          role="dialog"
          aria-label={t("installTitle")}
          style={{
            position: "fixed",
            bottom: 24,
            left: 24,
            right: 24,
            maxWidth: 420,
            marginLeft: "auto",
            marginRight: "auto",
            zIndex: 80,
          }}
        >
          <div
            style={{
              background: "var(--c-bg-card)",
              border: "1px solid var(--c-border-subtle)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.6)",
              padding: "20px 24px",
              position: "relative",
            }}
          >
            {/* Corner brackets */}
            <div
              style={{
                position: "absolute",
                top: -1,
                left: -1,
                width: 12,
                height: 12,
                borderTop: "1px solid var(--v9-sol-green)",
                borderLeft: "1px solid var(--v9-sol-green)",
              }}
            />
            <div
              style={{
                position: "absolute",
                top: -1,
                right: -1,
                width: 12,
                height: 12,
                borderTop: "1px solid var(--v9-sol-green)",
                borderRight: "1px solid var(--v9-sol-green)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -1,
                left: -1,
                width: 12,
                height: 12,
                borderBottom: "1px solid var(--v9-sol-green)",
                borderLeft: "1px solid var(--v9-sol-green)",
              }}
            />
            <div
              style={{
                position: "absolute",
                bottom: -1,
                right: -1,
                width: 12,
                height: 12,
                borderBottom: "1px solid var(--v9-sol-green)",
                borderRight: "1px solid var(--v9-sol-green)",
              }}
            />

            {/* Header row */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                marginBottom: 12,
              }}
            >
              <SuperteamLogo
                size={20}
                className="text-[var(--v9-sol-green)]"
              />
              <span
                style={{
                  fontFamily: "var(--v9-mono)",
                  fontSize: "10px",
                  letterSpacing: "3px",
                  textTransform: "uppercase",
                  color: "var(--c-text)",
                  flex: 1,
                }}
              >
                {t("installTitle")}
              </span>
              <button
                onClick={handleDismiss}
                aria-label="Dismiss"
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "var(--c-text-dim)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <X style={{ width: 14, height: 14 }} />
              </button>
            </div>

            {/* Description */}
            <p
              style={{
                fontFamily: "var(--v9-sans)",
                fontSize: "13px",
                color: "var(--c-text-2)",
                lineHeight: 1.5,
                margin: "0 0 16px",
              }}
            >
              {t("installText")}
            </p>

            {/* Actions */}
            <div
              style={{
                display: "flex",
                gap: 10,
              }}
            >
              <button
                onClick={handleInstall}
                style={{
                  fontFamily: "var(--v9-mono)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "10px 20px",
                  background: "transparent",
                  color: "var(--v9-sol-green)",
                  border: "1px solid var(--v9-sol-green)",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  transition: "all 0.3s var(--v9-ease)",
                }}
              >
                <Download style={{ width: 12, height: 12 }} />
                {t("install")}
              </button>
              <button
                onClick={handleDismiss}
                style={{
                  fontFamily: "var(--v9-mono)",
                  fontSize: "10px",
                  letterSpacing: "2px",
                  textTransform: "uppercase",
                  padding: "10px 20px",
                  background: "transparent",
                  color: "var(--c-text-dim)",
                  border: "1px solid var(--c-border-subtle)",
                  cursor: "pointer",
                  transition: "all 0.3s var(--v9-ease)",
                }}
              >
                {t("dismiss")}
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
