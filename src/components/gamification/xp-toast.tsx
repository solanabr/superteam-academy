'use client';

import { motion } from 'framer-motion';
import { Zap, Trophy, Flame, Award, Star } from 'lucide-react';
import toast from 'react-hot-toast';

interface XPToastData {
  xp: number;
  message?: string;
}

interface AchievementToastData {
  name: string;
  icon: string;
  rarity: string;
}

interface LevelUpToastData {
  newLevel: number;
  title: string;
}

interface StreakToastData {
  days: number;
}

export function showXPToast({ xp, message }: XPToastData) {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="flex items-center gap-3 bg-background border border-quest-gold/30 rounded-xl px-5 py-3 shadow-lg"
        style={{ boxShadow: '0 0 20px rgba(240, 185, 11, 0.15)' }}
      >
        <div className="w-10 h-10 rounded-lg bg-quest-gold/10 flex items-center justify-center">
          <Zap className="h-5 w-5 text-quest-gold" />
        </div>
        <div>
          <p className="font-bold text-quest-gold">+{xp} XP</p>
          <p className="text-xs text-muted-foreground">{message || 'Experience earned!'}</p>
        </div>
      </motion.div>
    ),
    { duration: 3000, position: 'bottom-right' }
  );
}

export function showAchievementToast({ name, icon, rarity }: AchievementToastData) {
  const rarityColors: Record<string, string> = {
    common: '#888',
    rare: '#00D1FF',
    epic: '#9945FF',
    legendary: '#F0B90B',
  };
  const color = rarityColors[rarity] || '#888';

  toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="flex items-center gap-3 bg-background border rounded-xl px-5 py-3 shadow-lg"
        style={{ borderColor: `${color}40`, boxShadow: `0 0 20px ${color}15` }}
      >
        <div
          className="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
          style={{ backgroundColor: `${color}10` }}
        >
          {icon}
        </div>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-bold text-sm">Achievement Unlocked!</p>
            <span
              className="text-[10px] font-medium px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: `${color}20`, color }}
            >
              {rarity}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{name}</p>
        </div>
      </motion.div>
    ),
    { duration: 4000, position: 'bottom-right' }
  );
}

export function showLevelUpToast({ newLevel, title }: LevelUpToastData) {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="flex items-center gap-3 bg-background border border-quest-purple/30 rounded-xl px-5 py-3 shadow-lg"
        style={{ boxShadow: '0 0 30px rgba(153, 69, 255, 0.2)' }}
      >
        <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#9945FF] to-[#14F195] flex items-center justify-center">
          <Star className="h-6 w-6 text-white" />
        </div>
        <div>
          <p className="font-bold text-sm bg-gradient-to-r from-[#9945FF] to-[#14F195] bg-clip-text text-transparent">
            Level Up!
          </p>
          <p className="text-xs text-muted-foreground">
            You are now Level {newLevel} — {title}
          </p>
        </div>
      </motion.div>
    ),
    { duration: 5000, position: 'bottom-right' }
  );
}

export function showStreakToast({ days }: StreakToastData) {
  toast.custom(
    (t) => (
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.9 }}
        className="flex items-center gap-3 bg-background border border-orange-500/30 rounded-xl px-5 py-3 shadow-lg"
        style={{ boxShadow: '0 0 20px rgba(255, 107, 53, 0.15)' }}
      >
        <div className="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
          <Flame className="h-5 w-5 text-orange-500" />
        </div>
        <div>
          <p className="font-bold text-orange-500">{days} Day Streak!</p>
          <p className="text-xs text-muted-foreground">Keep it up! +10 XP bonus</p>
        </div>
      </motion.div>
    ),
    { duration: 3000, position: 'bottom-right' }
  );
}
