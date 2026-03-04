"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/routing";
import { Button } from "@/components/ui/button";
import { CheckCircle2, ChevronRight, Flame, Zap } from "lucide-react";
import { getLevel, getLevelProgress } from "@/lib/utils";
import confetti from "canvas-confetti";

export interface LessonCompleteOverlayProps {
  open: boolean;
  onClose: () => void;
  xpEarned: number;
  streakDays: number;
  isFirstToday: boolean;
  nextLessonSlug?: string;
  courseSlug: string;
  lessonTitle: string;
}

// Confetti particle definitions: [x%, y%, color, scale, rotation, tx, ty]
const PARTICLES = [
  { id: 0, color: "#9945FF", delay: 0, tx: -120, ty: -180, rot: 45 },
  { id: 1, color: "#14F195", delay: 40, tx: 80, ty: -200, rot: -30 },
  { id: 2, color: "#9945FF", delay: 80, tx: 160, ty: -140, rot: 120 },
  { id: 3, color: "#14F195", delay: 120, tx: 200, ty: -60, rot: -90 },
  { id: 4, color: "#9945FF", delay: 160, tx: 160, ty: 80, rot: 200 },
  { id: 5, color: "#14F195", delay: 0, tx: -160, ty: 80, rot: -150 },
  { id: 6, color: "#9945FF", delay: 60, tx: -200, ty: -60, rot: 75 },
  { id: 7, color: "#14F195", delay: 100, tx: -80, ty: -220, rot: -45 },
  { id: 8, color: "#9945FF", delay: 140, tx: 40, ty: 160, rot: 30 },
  { id: 9, color: "#14F195", delay: 20, tx: -40, ty: 180, rot: -60 },
  { id: 10, color: "#9945FF", delay: 180, tx: 120, ty: 140, rot: 90 },
  { id: 11, color: "#14F195", delay: 220, tx: -120, ty: 120, rot: -120 },
  { id: 12, color: "#9945FF", delay: 50, tx: 240, ty: 20, rot: 160 },
  { id: 13, color: "#14F195", delay: 90, tx: -240, ty: 20, rot: -170 },
  { id: 14, color: "#9945FF", delay: 130, tx: 100, ty: -160, rot: -20 },
  { id: 15, color: "#14F195", delay: 170, tx: -100, ty: -160, rot: 140 },
];

function useCountUp(target: number, enabled: boolean, duration = 1200) {
  const [count, setCount] = useState(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (!enabled) return;
    const start = performance.now();
    const animate = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(eased * target));
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [target, enabled, duration]);

  // When animation is disabled, return 0 (no setState in effect needed)
  return enabled ? count : 0;
}

export function LessonCompleteOverlay({
  open,
  onClose,
  xpEarned,
  streakDays,
  isFirstToday,
  nextLessonSlug,
  courseSlug,
  lessonTitle,
}: LessonCompleteOverlayProps) {
  const t = useTranslations("lessonComplete");
  const [visible, setVisible] = useState(false);
  const [animating, setAnimating] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Delay visibility slightly so CSS transitions play on mount.
  // Both setVisible and setAnimating are deferred via setTimeout to avoid
  // synchronous setState-in-effect (react-hooks/set-state-in-effect).
  useEffect(() => {
    if (open) {
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#9945FF", "#14F195", "#FFE000"]
      });

      const showId = setTimeout(() => setVisible(true), 0);
      const animId = setTimeout(() => setAnimating(true), 30);
      return () => {
        clearTimeout(showId);
        clearTimeout(animId);
      };
    } else {
      const hideAnimId = setTimeout(() => setAnimating(false), 0);
      const hideId = setTimeout(() => setVisible(false), 300);
      return () => {
        clearTimeout(hideAnimId);
        clearTimeout(hideId);
      };
    }
  }, [open]);

  // Dismiss on Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  const displayXp = useCountUp(xpEarned, animating, 1200);
  const bonusXp = isFirstToday ? 25 : 0;
  const totalXp = xpEarned + bonusXp;
  const displayTotal = useCountUp(totalXp, animating, 1500);

  // Derive XP level progress for the bar
  // We show progress after earning this XP (post-earn state)
  const levelProgress = getLevelProgress(displayTotal > 0 ? displayTotal : 0);
  const currentLevel = getLevel(totalXp);

  if (!visible) return null;

  return (
    <div
      ref={overlayRef}
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="lesson-complete-backdrop"
      style={{
        opacity: animating ? 1 : 0,
        transition: "opacity 0.25s ease",
      }}
      onClick={(e) => {
        if (e.target === overlayRef.current) onClose();
      }}
    >
      {/* Confetti particles */}
      <div className="lesson-complete-particles" aria-hidden="true">
        {PARTICLES.map((p) => (
          <div
            key={p.id}
            className="lesson-complete-particle"
            style={
              {
                backgroundColor: p.color,
                animationDelay: `${p.delay}ms`,
                "--tx": `${p.tx}px`,
                "--ty": `${p.ty}px`,
                "--rot": `${p.rot}deg`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>

      {/* Card */}
      <div
        className="lesson-complete-card"
        style={{
          transform: animating ? "scale(1) translateY(0)" : "scale(0.85) translateY(24px)",
          opacity: animating ? 1 : 0,
          transition: "transform 0.35s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.3s ease",
        }}
      >
        {/* Checkmark */}
        <div className="lesson-complete-check-wrapper" aria-hidden="true">
          <div
            className="lesson-complete-check-ring"
            style={{
              transform: animating ? "scale(1)" : "scale(0)",
              transition: "transform 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.1s",
            }}
          >
            <CheckCircle2 className="lesson-complete-check-icon" />
          </div>
        </div>

        {/* Heading */}
        <h2 className="lesson-complete-title gradient-text">{t("title")}</h2>
        <p className="lesson-complete-subtitle">{lessonTitle}</p>

        {/* XP Display */}
        <div className="lesson-complete-xp-block">
          <div className="lesson-complete-xp-main">
            <Zap className="lesson-complete-xp-icon" aria-hidden="true" />
            <span className="lesson-complete-xp-number">+{displayXp}</span>
            <span className="lesson-complete-xp-label">{t("xpEarned")}</span>
          </div>

          {isFirstToday && (
            <div
              className="lesson-complete-bonus-badge"
              style={{
                transform: animating ? "scale(1)" : "scale(0)",
                transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) 0.5s",
              }}
            >
              <span>+25 XP</span>
              <span>{t("firstOfDay")}</span>
            </div>
          )}
        </div>

        {/* Streak */}
        {streakDays > 0 && (
          <div
            className="lesson-complete-streak"
            style={{
              opacity: animating ? 1 : 0,
              transform: animating ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.4s ease 0.6s, transform 0.4s ease 0.6s",
            }}
          >
            <Flame className="lesson-complete-flame" aria-hidden="true" />
            <span>
              {t("streakDays", { days: streakDays })}
            </span>
          </div>
        )}

        {/* XP Progress bar */}
        <div
          className="lesson-complete-progress-wrapper"
          aria-label={`Level ${currentLevel} progress`}
          style={{
            opacity: animating ? 1 : 0,
            transition: "opacity 0.4s ease 0.7s",
          }}
        >
          <div className="lesson-complete-progress-label">
            <span>Lv. {currentLevel}</span>
            <span>{levelProgress}%</span>
          </div>
          <div className="lesson-complete-progress-track" role="progressbar" aria-valuenow={levelProgress} aria-valuemin={0} aria-valuemax={100}>
            <div
              className="lesson-complete-progress-fill progress-shimmer"
              style={{ width: animating ? `${levelProgress}%` : "0%", transition: "width 1.2s cubic-bezier(0.4, 0, 0.2, 1) 0.8s" }}
            />
          </div>
          <div className="lesson-complete-progress-label">
            <span />
            <span>Lv. {currentLevel + 1}</span>
          </div>
        </div>

        {/* Action buttons */}
        <div
          className="lesson-complete-actions"
          style={{
            opacity: animating ? 1 : 0,
            transform: animating ? "translateY(0)" : "translateY(12px)",
            transition: "opacity 0.4s ease 0.8s, transform 0.4s ease 0.8s",
          }}
        >
          <Link href={`/courses/${courseSlug}`} onClick={onClose}>
            <Button variant="outline" className="lesson-complete-btn-secondary">
              {t("backToCourse")}
            </Button>
          </Link>

          {nextLessonSlug ? (
            <Link href={`/courses/${courseSlug}/lessons/${nextLessonSlug}`} onClick={onClose}>
              <Button className="lesson-complete-btn-primary">
                {t("nextLesson")}
                <ChevronRight className="h-4 w-4" aria-hidden="true" />
              </Button>
            </Link>
          ) : (
            <Link href={`/courses/${courseSlug}`} onClick={onClose}>
              <Button className="lesson-complete-btn-primary">
                {t("courseComplete")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
