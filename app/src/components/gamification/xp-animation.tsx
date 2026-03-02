"use client";

import { useEffect } from "react";
import { Zap } from "lucide-react";
import { useUIStore } from "@/stores/ui-store";

export function XpAnimation() {
  const { xpAnimation, clearXpAnimation } = useUIStore();

  useEffect(() => {
    if (xpAnimation) {
      const timer = setTimeout(clearXpAnimation, 1500);
      return () => clearTimeout(timer);
    }
  }, [xpAnimation, clearXpAnimation]);

  if (!xpAnimation) return null;

  return (
    <div
      key={xpAnimation.id}
      className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] pointer-events-none animate-xp-gain"
    >
      <div className="flex items-center gap-2 bg-superteam-green/20 backdrop-blur-sm border border-superteam-green/40 rounded-full px-6 py-3">
        <Zap className="h-6 w-6 text-superteam-green" />
        <span className="text-2xl font-bold text-superteam-green">
          +{xpAnimation.amount} XP
        </span>
      </div>
    </div>
  );
}
