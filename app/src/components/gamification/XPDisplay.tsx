'use client';

import { useGamification } from '@/context/GamificationContext';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap } from 'lucide-react';
import { useEffect, useState } from 'react';

export function XPDisplay() {
  const { xp, level } = useGamification();
  const [prevXp, setPrevXp] = useState(xp);
  const [diff, setDiff] = useState(0);

  useEffect(() => {
    if (xp > prevXp) {
      setDiff(xp - prevXp);
      const timer = setTimeout(() => setDiff(0), 2000);
      setPrevXp(xp);
      return () => clearTimeout(timer);
    }
  }, [xp, prevXp]);

  return (
    <div className="flex items-center gap-2 bg-[#1E1E24]/50 rounded-full px-3 py-1 border border-[#2E2E36]">
      <div className="relative">
        <Zap className="h-4 w-4 text-[#FFD700] fill-[#FFD700]" />
        <AnimatePresence>
            {diff > 0 && (
                <motion.div
                    initial={{ y: 0, opacity: 1, scale: 0.5 }}
                    animate={{ y: -20, opacity: 0, scale: 1.5 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 1 }}
                    className="absolute top-0 left-0 text-[#FFD700] font-bold text-xs pointer-events-none"
                >
                    +{diff}
                </motion.div>
            )}
        </AnimatePresence>
      </div>
      <span className="font-mono font-bold text-[#FFD700] text-sm">{xp} XP</span>
      <span className="text-xs text-gray-500 border-l border-[#2E2E36] pl-2 ml-1">Lvl {level}</span>
    </div>
  );
}
