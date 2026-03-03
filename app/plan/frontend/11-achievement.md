# Achievement Service (Frontend)

**Status**: Frontend implementation. Integrates with deployed devnet program.

## Devnet Program

| | Address |
|---|---|
| **Program ID** | `ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf` |

---

## Overview

The Achievement Service displays and tracks user achievements. Achievements are backed by on-chain AchievementReceipt PDAs and Metaplex Core NFTs.

## Achievement Categories

| Category | Examples |
|----------|----------|
| Progress | First Steps, Course Completer, Speed Runner |
| Streaks | Week Warrior, Monthly Master, Consistency King |
| Skills | Rust Rookie, Anchor Expert, Full Stack Solana |
| Community | Helper, First Comment, Top Contributor |
| Special | Early Adopter, Bug Hunter, Perfect Score |

## Implementation

### 1. Achievement Hook

```typescript
// hooks/useAchievements.ts
import { useQuery } from '@tanstack/react-query';
import { useWallet } from '@solana/wallet-adapter-react';
import { deriveAchievementTypePda, deriveAchievementReceiptPda } from '@/lib/pda';
import { PROGRAM_ID } from '@/lib/constants';

const ACHIEVEMENT_DEFINITIONS = [
  { id: 'first-steps', name: 'First Steps', description: 'Complete your first lesson', category: 'progress', icon: '🚀' },
  { id: 'course-completer', name: 'Course Completer', description: 'Complete your first course', category: 'progress', icon: '🎓' },
  { id: 'week-warrior', name: 'Week Warrior', description: 'Maintain a 7-day streak', category: 'streak', icon: '🔥' },
  { id: 'monthly-master', name: 'Monthly Master', description: 'Maintain a 30-day streak', category: 'streak', icon: '👑' },
  { id: 'rust-rookie', name: 'Rust Rookie', description: 'Complete 5 Rust lessons', category: 'skill', icon: '🦀' },
  { id: 'anchor-expert', name: 'Anchor Expert', description: 'Complete the Anchor track', category: 'skill', icon: '⚓' },
  { id: 'early-adopter', name: 'Early Adopter', description: 'Join during beta', category: 'special', icon: '⭐' },
];

export function useAchievements() {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  
  return useQuery({
    queryKey: ['achievements', publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return [];
      
      const achievements = [];
      
      for (const def of ACHIEVEMENT_DEFINITIONS) {
        const receiptPda = deriveAchievementReceiptPda(def.id, publicKey, PROGRAM_ID);
        const receipt = await program.account.achievementReceipt.fetchNullable(receiptPda);
        
        achievements.push({
          ...def,
          unlocked: !!receipt,
          unlockedAt: receipt?.awardedAt?.toNumber() || null,
          asset: receipt?.asset?.toBase58() || null,
        });
      }
      
      return achievements;
    },
    enabled: !!publicKey,
  });
}

export function useAchievement(achievementId: string) {
  const { publicKey } = useWallet();
  const { program } = useProgram();
  
  return useQuery({
    queryKey: ['achievement', achievementId, publicKey?.toBase58()],
    queryFn: async () => {
      if (!publicKey) return null;
      
      const typePda = deriveAchievementTypePda(achievementId, PROGRAM_ID);
      const receiptPda = deriveAchievementReceiptPda(achievementId, publicKey, PROGRAM_ID);
      
      const [type, receipt] = await Promise.all([
        program.account.achievementType.fetch(typePda),
        program.account.achievementReceipt.fetchNullable(receiptPda),
      ]);
      
      return {
        id: achievementId,
        name: type.name,
        description: type.metadataUri, // Or fetch from URI
        xpReward: type.xpReward.toNumber(),
        maxSupply: type.maxSupply,
        currentSupply: type.currentSupply.toNumber(),
        isActive: type.isActive,
        unlocked: !!receipt,
        unlockedAt: receipt?.awardedAt?.toNumber() || null,
        asset: receipt?.asset?.toBase58() || null,
      };
    },
    enabled: !!publicKey && !!achievementId,
  });
}
```

### 2. Achievement Badge Component

```typescript
// components/achievement/AchievementBadge.tsx
interface AchievementBadgeProps {
  achievement: Achievement;
  size?: 'sm' | 'md' | 'lg';
  showDetails?: boolean;
}

export function AchievementBadge({ achievement, size = 'md', showDetails = false }: AchievementBadgeProps) {
  const sizeClasses = {
    sm: 'w-12 h-12',
    md: 'w-16 h-16',
    lg: 'w-24 h-24',
  };
  
  return (
    <div className={`achievement-badge ${achievement.unlocked ? 'unlocked' : 'locked'}`}>
      <div className={`badge-icon ${sizeClasses[size]}`}>
        <span className="icon">{achievement.icon}</span>
        {!achievement.unlocked && (
          <div className="lock-overlay">
            <LockIcon />
          </div>
        )}
      </div>
      
      {showDetails && (
        <div className="badge-details">
          <span className="name">{achievement.name}</span>
          <span className="description">{achievement.description}</span>
          {achievement.unlocked && (
            <span className="unlocked-date">
              Unlocked {formatDate(achievement.unlockedAt)}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
```

### 3. Achievement Grid Component

```typescript
// components/achievement/AchievementGrid.tsx
'use client';

import { useAchievements } from '@/hooks/useAchievements';
import { AchievementBadge } from './AchievementBadge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

export function AchievementGrid() {
  const { data: achievements, isLoading } = useAchievements();
  
  const categories = ['all', 'progress', 'streak', 'skill', 'community', 'special'];
  
  const filterByCategory = (category: string) => {
    if (category === 'all') return achievements;
    return achievements?.filter(a => a.category === category);
  };
  
  if (isLoading) {
    return <AchievementGridSkeleton />;
  }
  
  const unlocked = achievements?.filter(a => a.unlocked).length || 0;
  const total = achievements?.length || 0;
  
  return (
    <div className="achievement-section">
      <div className="section-header">
        <h2>Achievements</h2>
        <span className="progress">{unlocked}/{total} Unlocked</span>
      </div>
      
      <Tabs defaultValue="all">
        <TabsList>
          {categories.map(cat => (
            <TabsTrigger key={cat} value={cat}>
              {cat.charAt(0).toUpperCase() + cat.slice(1)}
            </TabsTrigger>
          ))}
        </TabsList>
        
        {categories.map(cat => (
          <TabsContent key={cat} value={cat}>
            <div className="achievement-grid">
              {filterByCategory(cat)?.map(achievement => (
                <AchievementBadge
                  key={achievement.id}
                  achievement={achievement}
                  showDetails
                />
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}
```

### 4. Achievement Unlock Animation

```typescript
// components/achievement/AchievementUnlock.tsx
'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';

interface AchievementUnlockProps {
  achievement: Achievement;
  show: boolean;
  onClose: () => void;
}

export function AchievementUnlock({ achievement, show, onClose }: AchievementUnlockProps) {
  useEffect(() => {
    if (show) {
      const timer = setTimeout(onClose, 5000);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);
  
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="achievement-unlock-overlay"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="achievement-unlock-card"
            initial={{ scale: 0, rotate: -10 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0 }}
            transition={{ type: 'spring', damping: 15 }}
          >
            <div className="confetti-container">
              {/* Confetti particles */}
            </div>
            
            <div className="unlock-header">
              <span>Achievement Unlocked!</span>
            </div>
            
            <div className="unlock-icon">
              <span>{achievement.icon}</span>
            </div>
            
            <div className="unlock-details">
              <h3>{achievement.name}</h3>
              <p>{achievement.description}</p>
            </div>
            
            <div className="unlock-reward">
              <span>+{achievement.xpReward} XP</span>
            </div>
            
            <button onClick={onClose}>Awesome!</button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
```

## Predefined Achievements

```typescript
// lib/achievements.ts
export const ACHIEVEMENTS = {
  // Progress
  'first-steps': { name: 'First Steps', xp: 50, icon: '🚀' },
  'course-completer': { name: 'Course Completer', xp: 100, icon: '🎓' },
  'five-courses': { name: 'Knowledge Seeker', xp: 500, icon: '📚' },
  'ten-courses': { name: 'Scholar', xp: 1000, icon: '🧠' },
  
  // Streaks
  'week-warrior': { name: 'Week Warrior', xp: 100, icon: '🔥' },
  'monthly-master': { name: 'Monthly Master', xp: 500, icon: '👑' },
  'consistency-king': { name: 'Consistency King', xp: 2000, icon: '💎' },
  
  // Skills
  'rust-rookie': { name: 'Rust Rookie', xp: 100, icon: '🦀' },
  'anchor-novice': { name: 'Anchor Novice', xp: 100, icon: '⚓' },
  'anchor-expert': { name: 'Anchor Expert', xp: 500, icon: '🏆' },
  'full-stack-solana': { name: 'Full Stack Solana', xp: 1000, icon: '🌟' },
  
  // Community
  'helper': { name: 'Helper', xp: 50, icon: '🤝' },
  'first-comment': { name: 'First Comment', xp: 25, icon: '💬' },
  'top-contributor': { name: 'Top Contributor', xp: 200, icon: '🎖️' },
  
  // Special
  'early-adopter': { name: 'Early Adopter', xp: 500, icon: '⭐' },
  'bug-hunter': { name: 'Bug Hunter', xp: 100, icon: '🐛' },
  'perfect-score': { name: 'Perfect Score', xp: 200, icon: '💯' },
};
```
