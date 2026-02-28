"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";
import { useRequireAuth } from "@/lib/hooks/use-require-auth";
import { useEffect, useRef, useCallback } from "react";

export function CourseCompleteOverlay({
  show,
  locale,
  isFinalizing,
  finalizationResult,
  onFinalize,
  onDismiss,
}: {
  show: boolean;
  locale: string;
  isFinalizing: boolean;
  finalizationResult: { xpAwarded: number; credentialIssued: boolean } | null;
  onFinalize: () => void;
  onDismiss: () => void;
}) {
  const t = useTranslations("lesson");
  const router = useRouter();
  const { requireAuth } = useRequireAuth();
  const dialogRef = useRef<HTMLDivElement>(null);
  const previousFocus = useRef<HTMLElement | null>(null);

  // Ref to avoid stale closure when requireAuth runs deferred after auth
  const onFinalizeRef = useRef(onFinalize);
  onFinalizeRef.current = onFinalize;

  const trapFocus = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onDismiss();
      return;
    }
    if (e.key !== "Tab") return;
    const dialog = dialogRef.current;
    if (!dialog) return;
    const focusable = dialog.querySelectorAll<HTMLElement>(
      'button:not([disabled]), a[href], [tabindex]:not([tabindex="-1"])',
    );
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
  }, [onDismiss]);

  useEffect(() => {
    if (!show) return;
    previousFocus.current = document.activeElement as HTMLElement;
    const timer = setTimeout(() => {
      const first = dialogRef.current?.querySelector<HTMLElement>(
        'button:not([disabled]), a[href]',
      );
      first?.focus();
    }, 100);
    document.addEventListener("keydown", trapFocus);
    return () => {
      clearTimeout(timer);
      document.removeEventListener("keydown", trapFocus);
      previousFocus.current?.focus();
    };
  }, [show, trapFocus]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="course-complete-title"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(8px)" }}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          style={{
            margin: "16px",
            width: "100%",
            maxWidth: "400px",
            background: "var(--background)",
            padding: "48px 40px",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "64px",
              height: "64px",
              margin: "0 auto 16px",
              background: "rgba(20,241,149,0.1)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Award
              style={{ width: 32, height: 32, color: "var(--xp)" }}
            />
          </div>

          <h2
            id="course-complete-title"
            style={{
              fontFamily: "var(--font-brand)",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--foreground)",
              marginBottom: "8px",
            }}
          >
            {t("courseComplete")}
          </h2>
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize: "14px",
              color: "var(--c-text-muted)",
              marginBottom: "24px",
            }}
          >
            {t("courseCompleteDesc")}
          </p>

          {finalizationResult ? (
            finalizationResult.credentialIssued ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <div
                  style={{
                    padding: "16px",
                    borderLeft: "3px solid var(--xp)",
                    background: "rgba(20,241,149,0.05)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--font-mono)",
                      fontSize: "12px",
                      color: "var(--xp)",
                    }}
                  >
                    {t("credentialIssued", { xp: finalizationResult.xpAwarded })}
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/certificates`)}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "14px 36px",
                    border: "none",
                    cursor: "pointer",
                    background: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  {t("viewCredential")}
                </button>
                <button
                  onClick={onDismiss}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "14px 36px",
                    background: "none",
                    color: "var(--c-text-muted)",
                    border: "1px solid var(--c-border-subtle)",
                    cursor: "pointer",
                  }}
                >
                  {t("back")}
                </button>
              </div>
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <p
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: "12px",
                    color: "#EF4444",
                  }}
                >
                  {t("finalizeFailed")}
                </p>
                <button
                  onClick={onFinalize}
                  style={{
                    width: "100%",
                    fontFamily: "var(--font-mono)",
                    fontSize: "11px",
                    letterSpacing: "0.15em",
                    textTransform: "uppercase",
                    padding: "14px 36px",
                    border: "none",
                    cursor: "pointer",
                    background: "var(--foreground)",
                    color: "var(--background)",
                  }}
                >
                  {t("finalizeAndClaim")}
                </button>
              </div>
            )
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={() => requireAuth(() => onFinalizeRef.current())}
                disabled={isFinalizing}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "14px 36px",
                  border: "none",
                  cursor: "pointer",
                  background: "var(--foreground)",
                  color: "var(--background)",
                }}
              >
                {isFinalizing ? (
                  <>
                    <Loader2
                      style={{ width: 14, height: 14 }}
                      className="animate-spin"
                    />
                    {t("finalizing")}
                  </>
                ) : (
                  <>
                    <Award style={{ width: 14, height: 14 }} />
                    {t("finalizeAndClaim")}
                  </>
                )}
              </button>
              <button
                onClick={onDismiss}
                style={{
                  width: "100%",
                  fontFamily: "var(--font-mono)",
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  padding: "14px 36px",
                  background: "none",
                  color: "var(--c-text-muted)",
                  border: "1px solid var(--c-border-subtle)",
                  cursor: "pointer",
                }}
              >
                {t("later")}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
