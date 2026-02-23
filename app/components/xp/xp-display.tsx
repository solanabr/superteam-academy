"use client";

import { motion, useMotionValue, useTransform, animate } from "motion/react";
import { useEffect } from "react";
import { formatXp } from "@/lib/format";
import { getLevel } from "@/lib/level";
import { useTranslations } from "next-intl";

export function XpDisplay({ xp }: { xp: number }) {
  const t = useTranslations("profile");
  const motionXp = useMotionValue(0);
  const displayed = useTransform(motionXp, (v) => formatXp(Math.round(v)));
  const level = getLevel(xp);

  useEffect(() => {
    const controls = animate(motionXp, xp, {
      duration: 1.5,
      ease: "easeOut",
    });
    return controls.stop;
  }, [xp, motionXp]);

  return (
    <div className="flex items-center gap-5">
      <div className="flex-1">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-content-muted">
          {t("xpBalance")}
        </p>
        <motion.p className="font-mono text-5xl font-black tabular-nums tracking-tight text-content">
          {displayed}
        </motion.p>
      </div>
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-solana-gradient opacity-20 blur-lg" />
        <div className="relative flex h-16 w-16 items-center justify-center rounded-full border border-edge bg-surface">
          <div className="absolute inset-0.5 rounded-full bg-solana-gradient opacity-10" />
          <div className="relative text-center">
            <p className="font-mono text-2xl font-black text-content">{level}</p>
            <p className="text-[8px] font-semibold uppercase tracking-wider text-content-muted">
              {t("level")}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
