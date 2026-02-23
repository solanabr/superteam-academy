"use client";

import { motion, AnimatePresence } from "motion/react";
import { useTranslations } from "next-intl";
import { useEffect } from "react";
import { fireSolanaConfetti } from "@/components/ui/confetti";
import { formatXp } from "@/lib/format";

interface CompletionModalProps {
  open: boolean;
  onClose: () => void;
  courseId: string;
  totalXp: number;
  bonusXp: number;
}

export function CompletionModal({
  open,
  onClose,
  courseId,
  totalXp,
  bonusXp,
}: CompletionModalProps) {
  const t = useTranslations("enrollment");

  useEffect(() => {
    if (open) {
      fireSolanaConfetti();
      const timer = setTimeout(fireSolanaConfetti, 800);
      return () => clearTimeout(timer);
    }
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          role="dialog"
          aria-modal="true"
          aria-labelledby="completion-modal-title"
        >
          <motion.div
            className="relative w-full max-w-sm overflow-hidden rounded-2xl border border-edge bg-surface p-px"
            initial={{ scale: 0.85, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 10 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient border animation */}
            <div className="absolute inset-0 rounded-2xl bg-[conic-gradient(from_0deg,#9945FF,#14F195,#00C2FF,#9945FF)] opacity-30 animate-[spin_3s_linear_infinite]" />

            <div className="relative rounded-2xl bg-surface p-8 text-center">
              <div className="relative mx-auto mb-5 w-fit">
                <div className="absolute inset-0 rounded-full bg-solana-green/20 blur-2xl" />
                <motion.div
                  className="relative text-6xl"
                  animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
                  transition={{ duration: 0.6, delay: 0.3 }}
                >
                  🎉
                </motion.div>
              </div>

              <motion.h2
                id="completion-modal-title"
                className="mb-1 text-2xl font-black text-content"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
              >
                {t("finalized")}
              </motion.h2>

              <motion.p
                className="mb-5 font-mono text-sm text-solana-green"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {courseId}
              </motion.p>

              <motion.div
                className="mb-6 flex justify-center gap-3"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
              >
                <div className="rounded-xl bg-solana-purple/10 border border-solana-purple/20 px-4 py-3">
                  <p className="font-mono text-xl font-black text-solana-purple">
                    {formatXp(totalXp)}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-content-muted">XP</p>
                </div>
                {bonusXp > 0 && (
                  <div className="rounded-xl bg-solana-cyan/10 border border-solana-cyan/20 px-4 py-3">
                    <p className="font-mono text-xl font-black text-solana-cyan">
                      +{formatXp(bonusXp)}
                    </p>
                    <p className="text-[10px] uppercase tracking-wider text-content-muted">Bonus</p>
                  </div>
                )}
              </motion.div>

              <motion.button
                onClick={onClose}
                className="w-full rounded-xl bg-solana-gradient py-3.5 text-sm font-bold text-white transition-opacity hover:opacity-90"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.45 }}
              >
                {t("credentialEarned")}
              </motion.button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
