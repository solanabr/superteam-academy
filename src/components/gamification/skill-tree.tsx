'use client';

import { motion } from 'framer-motion';
import { Lock, Check } from 'lucide-react';
import { SkillNode } from '@/types';
import { TRACK_INFO } from '@/config/constants';
import { cn } from '@/lib/utils';

interface SkillTreeProps {
  skills: SkillNode[];
  className?: string;
}

export function SkillTree({ skills, className }: SkillTreeProps) {
  // Layout: simple grid with connection lines
  // Top row: Solana Basics
  // Second row: Rust, NFTs
  // Third row: Anchor
  // Fourth row: DeFi, Security

  const nodeMap = new Map(skills.map((s) => [s.id, s]));

  return (
    <div className={cn('relative', className)}>
      <div className="flex flex-col items-center gap-8 py-4">
        {/* Level 1: Solana Basics */}
        <SkillNodeCard skill={skills.find((s) => s.name === 'Solana Basics')!} />

        {/* Connection lines */}
        <div className="flex items-start gap-16 relative">
          {/* Left branch: Rust */}
          <div className="flex flex-col items-center gap-8">
            <SkillNodeCard skill={skills.find((s) => s.name === 'Rust')!} />

            {/* Anchor */}
            <SkillNodeCard skill={skills.find((s) => s.name === 'Anchor')!} />

            <div className="flex gap-12">
              <SkillNodeCard skill={skills.find((s) => s.name === 'DeFi')!} />
              <SkillNodeCard skill={skills.find((s) => s.name === 'Security')!} />
            </div>
          </div>

          {/* Right branch: NFTs */}
          <div className="flex flex-col items-center">
            <SkillNodeCard skill={skills.find((s) => s.name === 'NFTs')!} />
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillNodeCard({ skill }: { skill: SkillNode | undefined }) {
  if (!skill) return null;

  const info = TRACK_INFO[skill.track];
  const progress = skill.xpRequired > 0 ? Math.round((skill.xp / skill.xpRequired) * 100) : 0;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200 }}
      className={cn(
        'relative group cursor-pointer',
        !skill.isUnlocked && 'opacity-40'
      )}
    >
      {/* Glow effect for unlocked nodes */}
      {skill.isUnlocked && skill.level > 0 && (
        <div
          className="absolute inset-0 rounded-xl blur-lg opacity-20 group-hover:opacity-40 transition-opacity"
          style={{ backgroundColor: info.color }}
        />
      )}

      <div
        className={cn(
          'relative w-24 h-24 rounded-xl border-2 flex flex-col items-center justify-center gap-1 bg-background transition-all',
          skill.isUnlocked
            ? 'border-border/50 hover:border-opacity-100 hover:scale-105'
            : 'border-dashed border-border/30'
        )}
        style={
          skill.isUnlocked && skill.level > 0
            ? { borderColor: `${info.color}50` }
            : undefined
        }
      >
        {/* Icon */}
        <span className="text-2xl">
          {skill.isUnlocked ? info.icon : <Lock className="h-5 w-5 text-muted-foreground" />}
        </span>

        {/* Name */}
        <p className="text-[10px] font-medium text-center leading-tight px-1">
          {skill.name}
        </p>

        {/* Level pips */}
        {skill.isUnlocked && (
          <div className="flex gap-0.5 mt-0.5">
            {Array.from({ length: skill.maxLevel }).map((_, i) => (
              <div
                key={i}
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor:
                    i < skill.level ? info.color : 'hsl(var(--muted))',
                }}
              />
            ))}
          </div>
        )}

        {/* Progress ring (for in-progress skills) */}
        {skill.isUnlocked && progress > 0 && progress < 100 && (
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 100 100"
          >
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={`${info.color}20`}
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="46"
              fill="none"
              stroke={info.color}
              strokeWidth="2"
              strokeDasharray={`${progress * 2.89} ${289 - progress * 2.89}`}
              strokeDashoffset="72"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          </svg>
        )}
      </div>

      {/* Level badge */}
      {skill.isUnlocked && skill.level > 0 && (
        <div
          className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[9px] font-bold text-white"
          style={{ backgroundColor: info.color }}
        >
          {skill.level}
        </div>
      )}
    </motion.div>
  );
}
