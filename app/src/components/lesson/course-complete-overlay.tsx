"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";
import { Award, Loader2 } from "lucide-react";

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

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
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
            background: "var(--v9-white)",
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
              style={{ width: 32, height: 32, color: "var(--v9-sol-green)" }}
            />
          </div>

          <h2
            style={{
              fontFamily: "var(--v9-serif)",
              fontSize: "24px",
              fontWeight: 700,
              color: "var(--v9-dark)",
              marginBottom: "8px",
            }}
          >
            {t("courseComplete", { defaultMessage: "Course Complete!" })}
          </h2>
          <p
            style={{
              fontFamily: "var(--v9-sans)",
              fontSize: "14px",
              color: "var(--v9-mid-grey)",
              marginBottom: "24px",
            }}
          >
            {t("courseCompleteDesc", {
              defaultMessage: "You've completed all lessons in this course.",
            })}
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
                    borderLeft: "3px solid var(--v9-sol-green)",
                    background: "rgba(20,241,149,0.05)",
                  }}
                >
                  <p
                    style={{
                      fontFamily: "var(--v9-mono)",
                      fontSize: "12px",
                      color: "var(--v9-sol-green)",
                    }}
                  >
                    Credential issued! +{finalizationResult.xpAwarded} XP
                  </p>
                </div>
                <button
                  onClick={() => router.push(`/${locale}/certificates`)}
                  className="v9-complete-btn v9-complete-btn-primary"
                  style={{ width: "100%" }}
                >
                  View Credential
                </button>
                <button
                  onClick={onDismiss}
                  className="v9-complete-btn v9-complete-btn-ghost"
                  style={{ width: "100%" }}
                >
                  Back
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
                    fontFamily: "var(--v9-mono)",
                    fontSize: "12px",
                    color: "#EF4444",
                  }}
                >
                  Could not finalize. Please try again.
                </p>
                <button
                  onClick={onFinalize}
                  className="v9-complete-btn v9-complete-btn-primary"
                  style={{ width: "100%" }}
                >
                  Finalize &amp; Claim Credential
                </button>
              </div>
            )
          ) : (
            <div
              style={{ display: "flex", flexDirection: "column", gap: "12px" }}
            >
              <button
                onClick={onFinalize}
                disabled={isFinalizing}
                className="v9-complete-btn v9-complete-btn-primary"
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                }}
              >
                {isFinalizing ? (
                  <>
                    <Loader2
                      style={{ width: 14, height: 14 }}
                      className="animate-spin"
                    />
                    Finalizing...
                  </>
                ) : (
                  <>
                    <Award style={{ width: 14, height: 14 }} />
                    Finalize &amp; Claim Credential
                  </>
                )}
              </button>
              <button
                onClick={onDismiss}
                className="v9-complete-btn v9-complete-btn-ghost"
                style={{ width: "100%" }}
              >
                Later
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
