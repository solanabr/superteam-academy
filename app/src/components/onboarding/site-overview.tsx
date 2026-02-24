"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

const CAVEAT = "var(--font-caveat), 'Caveat', cursive";

interface SiteSection {
  icon: string;
  titleKey: string;
  descriptionKey: string;
  handNoteKey: string;
  color: string;
  path: string;
}

const SECTIONS: SiteSection[] = [
  {
    icon: "M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253",
    titleKey: "coursesTitle",
    descriptionKey: "coursesDesc",
    handNoteKey: "coursesNote",
    color: "var(--v9-sol-green)",
    path: "/courses",
  },
  {
    icon: "M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z",
    titleKey: "dashboardTitle",
    descriptionKey: "dashboardDesc",
    handNoteKey: "dashboardNote",
    color: "#a855f7",
    path: "/dashboard",
  },
  {
    icon: "M16.5 18.75h-9m9 0a3 3 0 013 3h-15a3 3 0 013-3m9 0v-3.375c0-.621-.503-1.125-1.125-1.125h-.871M7.5 18.75v-3.375c0-.621.504-1.125 1.125-1.125h.872m5.007 0H9.497m5.007 0a7.454 7.454 0 01-.982-3.172M9.497 14.25a7.454 7.454 0 00.981-3.172M5.25 4.236c-.982.143-1.954.317-2.916.52A6.003 6.003 0 007.73 9.728M5.25 4.236V4.5c0 2.108.966 3.99 2.48 5.228M5.25 4.236V2.721C7.456 2.41 9.71 2.25 12 2.25c2.291 0 4.545.16 6.75.47v1.516M18.75 4.236c.982.143 1.954.317 2.916.52A6.003 6.003 0 0016.27 9.728M18.75 4.236V4.5c0 2.108-.966 3.99-2.48 5.228m0 0a6.023 6.023 0 01-2.77.67 6.023 6.023 0 01-2.77-.67",
    titleKey: "leaderboardTitle",
    descriptionKey: "leaderboardDesc",
    handNoteKey: "leaderboardNote",
    color: "#f59e0b",
    path: "/leaderboard",
  },
  {
    icon: "M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z",
    titleKey: "communityTitle",
    descriptionKey: "communityDesc",
    handNoteKey: "communityNote",
    color: "#06b6d4",
    path: "/community",
  },
];

function SectionIcon({ d, color }: { d: string; color: string }) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d={d} />
    </svg>
  );
}

function HandArrow({ color, delay }: { color: string; delay: number }) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);

  return (
    <svg
      width={28}
      height={18}
      viewBox="0 0 28 18"
      fill="none"
      style={{
        opacity: visible ? 0.6 : 0,
        transition: "opacity 0.6s ease",
        flexShrink: 0,
      }}
    >
      <path
        d="M2,9 C8,7 14,5 18,8 C22,11 24,9 26,7"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <polygon points="24,4 28,7 24,10" fill={color} />
    </svg>
  );
}

export function SiteOverview({ onFinish }: { onFinish: () => void }) {
  const t = useTranslations("onboarding");
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        textAlign: "center",
      }}
    >
      {/* Header */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4 }}
        style={{
          fontFamily: "var(--v9-mono)",
          fontSize: 9,
          letterSpacing: 4,
          textTransform: "uppercase" as const,
          color: "var(--c-text-dim)",
          marginBottom: 16,
        }}
      >
        {t("quickOrientation")}
      </motion.p>

      <motion.span
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1, duration: 0.5 }}
        style={{
          fontFamily: CAVEAT,
          fontSize: 26,
          color: "var(--v9-sol-green)",
          transform: "rotate(-2deg)",
          display: "block",
          marginBottom: 8,
        }}
      >
        {t("heresWhatYoullFind")}
      </motion.span>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 13,
          color: "var(--c-text-muted)",
          maxWidth: 400,
          lineHeight: 1.6,
          marginBottom: 28,
        }}
      >
        {t("orientationSubtitle")}
      </motion.p>

      {/* Section cards */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: 2,
          width: "100%",
          maxWidth: 480,
          marginBottom: 28,
        }}
      >
        {SECTIONS.map((section, i) => (
          <motion.div
            key={section.titleKey}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{
              delay: 0.3 + i * 0.12,
              duration: 0.5,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              padding: "14px 18px",
              background: "var(--overlay-divider)",
              border: `1px solid transparent`,
              textAlign: "left",
              transition: "border-color 0.3s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.borderColor = `${section.color}33`;
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.borderColor = "transparent";
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 36,
                height: 36,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: `1px solid ${section.color}33`,
                background: `${section.color}0A`,
                flexShrink: 0,
              }}
            >
              <SectionIcon d={section.icon} color={section.color} />
            </div>

            {/* Text */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 3,
                }}
              >
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 14,
                    fontWeight: 700,
                    color: "var(--foreground)",
                  }}
                >
                  {t(section.titleKey)}
                </span>
                <span
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontSize: 10,
                    color: "var(--c-text-dim)",
                    letterSpacing: 1,
                  }}
                >
                  {section.path}
                </span>
              </div>
              <p
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: 12,
                  color: "var(--c-text-muted)",
                  lineHeight: 1.5,
                  margin: 0,
                }}
              >
                {t(section.descriptionKey)}
              </p>
            </div>

            {/* Hand arrow + note */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 6,
                flexShrink: 0,
              }}
            >
              <HandArrow color={section.color} delay={600 + i * 150} />
              <motion.span
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8 + i * 0.15, duration: 0.4 }}
                style={{
                  fontFamily: CAVEAT,
                  fontSize: 15,
                  color: section.color,
                  whiteSpace: "nowrap",
                  transform: `rotate(${-2 + i}deg)`,
                  display: "inline-block",
                }}
              >
                {t(section.handNoteKey)}
              </motion.span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Wallet note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.0, duration: 0.4 }}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 28,
          padding: "10px 18px",
          border: "1px dashed var(--overlay-border)",
        }}
      >
        <svg
          width={16}
          height={16}
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--v9-sol-green)"
          strokeWidth={1.5}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 110-6h.008A2.252 2.252 0 0118 2.252V2.25M21 12v-1.5M21 12v1.5m-21-3h2.25A2.25 2.25 0 014.5 12v0a2.25 2.25 0 01-2.25 2.25H0M3.75 20.25h16.5m-16.5 0A2.25 2.25 0 011.5 18V6A2.25 2.25 0 013.75 3.75m0 16.5h0m16.5 0A2.25 2.25 0 0022.5 18V6a2.25 2.25 0 00-2.25-2.25m0 16.5h0" />
        </svg>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: 12,
            color: "var(--c-text-muted)",
          }}
        >
          {t("walletNote")}
        </span>
        <span
          style={{
            fontFamily: CAVEAT,
            fontSize: 15,
            color: "var(--v9-sol-green)",
            transform: "rotate(-2deg)",
            display: "inline-block",
          }}
        >
          {t("walletHandNote")}
        </span>
      </motion.div>

      {/* CTA */}
      <motion.button
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.2, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        onClick={onFinish}
        style={{
          fontFamily: "var(--v9-mono)",
          fontSize: 11,
          letterSpacing: 3,
          textTransform: "uppercase" as const,
          padding: "16px 48px",
          background: "transparent",
          color: "var(--v9-sol-green)",
          border: "1px solid var(--v9-sol-green)",
          cursor: "pointer",
          transition: "all 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
        onMouseEnter={(e) => {
          const el = e.currentTarget;
          el.style.background = "rgba(20, 241, 149, 0.08)";
          el.style.boxShadow = "0 0 24px rgba(20, 241, 149, 0.15)";
        }}
        onMouseLeave={(e) => {
          const el = e.currentTarget;
          el.style.background = "transparent";
          el.style.boxShadow = "none";
        }}
      >
        {t("startLearning")}
      </motion.button>
    </div>
  );
}
