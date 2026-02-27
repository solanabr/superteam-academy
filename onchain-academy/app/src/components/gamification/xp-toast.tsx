"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";

interface XPToastProps {
  amount: number;
  show: boolean;
}

export function XPToast({ amount, show }: XPToastProps) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 20, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="fixed bottom-6 right-6 z-[70] flex items-center gap-3 rounded-[2px] bg-[var(--c-bg-card)] border border-[#55E9AB]/30 px-5 py-3 shadow-lg shadow-[#55E9AB]/10"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-[2px] bg-[#00FFA3]/10">
            <Zap className="h-5 w-5 text-[#00FFA3] fill-[#00FFA3]" />
          </div>
          <div>
            <p className="text-sm font-medium text-[var(--c-text-2)]">
              XP Earned
            </p>
            <p className="text-lg font-bold font-mono text-[#00FFA3]">
              +{amount} XP
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
