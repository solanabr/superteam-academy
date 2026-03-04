"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { useAchievements } from "@/hooks/useAchievements";
import type { Achievement } from "@/data/achievements";
import { track } from "@/lib/analytics";

/**
 * AchievementToastManager
 *
 * Monitors earned achievements and pops a toast whenever a new one is
 * unlocked. Stores already-notified IDs in localStorage so toasts only
 * fire once per wallet session.
 */
export function AchievementToastManager() {
  const t = useTranslations("CredentialModal");
  const states = useAchievements();
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [visible, setVisible] = useState<Achievement | null>(null);
  const notifiedKey = "academy_notified_achievements";
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Detect newly-earned achievements
  useEffect(() => {
    if (typeof window === "undefined") return;
    const notified: string[] = JSON.parse(
      localStorage.getItem(notifiedKey) ?? "[]",
    );

    const newlyEarned = states
      .filter((s) => s.earned && !notified.includes(s.achievement.id))
      .map((s) => s.achievement);

    if (newlyEarned.length === 0) return;

    newlyEarned.forEach((a) => {
      track.achievementUnlock(a.id, a.title);
    });

    // Mark them as notified
    const updated = [...notified, ...newlyEarned.map((a) => a.id)];
    localStorage.setItem(notifiedKey, JSON.stringify(updated));

    setQueue((q) => [...q, ...newlyEarned]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [states.map((s) => `${s.achievement.id}:${s.earned}`).join(",")]);

  // Show next in queue
  useEffect(() => {
    if (!visible && queue.length > 0) {
      const [next, ...rest] = queue;
      setVisible(next ?? null);
      setQueue(rest);
    }
  }, [visible, queue]);

  // Auto-dismiss after 4 s
  useEffect(() => {
    if (!visible) return;
    timerRef.current = setTimeout(() => setVisible(null), 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: "fixed",
        bottom: "1.5rem",
        right: "1.5rem",
        zIndex: 9995,
        animation: "achievement-pop 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
        pointerEvents: "none",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "0.75rem",
          padding: "0.875rem 1.25rem",
          borderRadius: "16px",
          background: "linear-gradient(135deg, rgba(153,69,255,0.25), rgba(25,251,155,0.1))",
          border: "1px solid rgba(153,69,255,0.5)",
          backdropFilter: "blur(12px)",
          boxShadow: "0 8px 32px rgba(153,69,255,0.3), 0 2px 8px rgba(0,0,0,0.3)",
          minWidth: "260px",
          maxWidth: "320px",
        }}
      >
        <div
          style={{
            fontSize: "1.75rem",
            lineHeight: 1,
            flexShrink: 0,
          }}
        >
          {visible.emoji}
        </div>
        <div>
          <p
            style={{
              fontSize: "0.65rem",
              fontWeight: 700,
              textTransform: "uppercase",
              letterSpacing: "0.1em",
              color: "rgba(153,69,255,0.9)",
              marginBottom: "0.2rem",
            }}
          >
            {t("unlocked")}
          </p>
          <p
            style={{
              fontSize: "0.9rem",
              fontWeight: 700,
              color: "#fff",
              lineHeight: 1.2,
            }}
          >
            {visible.title}
          </p>
          <p
            style={{
              fontSize: "0.75rem",
              color: "rgba(255,255,255,0.6)",
              marginTop: "0.15rem",
            }}
          >
            {visible.description}
          </p>
        </div>
      </div>
    </div>
  );
}
