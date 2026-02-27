'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
//   import { toast } from 'sonner'; 
import { ProgressService } from '@/services/progress';
import { SolanaService } from '@/services/solana';
import { useWallet } from '@solana/wallet-adapter-react';
import { usePathname, useRouter } from '@/i18n/routing';

interface GamificationState {
  xp: number; // Database XP
  onChainXP: number; // Real SPL Token XP
  solBalance: number; // Real SOL
  level: number;
  streak: number;
  addXP: (amount: number) => void;
  achievements: string[];
  completedLessons: string[];
  refreshUser: () => Promise<void>;
}

const GamificationContext = createContext<GamificationState | undefined>(undefined);

export function GamificationProvider({ children }: { children: React.ReactNode }) {
  const [xp, setXp] = useState(0); 
  const [onChainXP, setOnChainXP] = useState(0); 
  const [solBalance, setSolBalance] = useState(0);
  const [level, setLevel] = useState(1);
  const [streak, setStreak] = useState(0); 
  const [achievements, setAchievements] = useState<string[]>([]);
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const { connected, publicKey } = useWallet();
  
  const refreshUser = async () => {
    if (connected && publicKey) {
        // Parallel fetch: DB User + On-Chain Data (each independent)
        const [userResult, solResult, splResult] = await Promise.allSettled([
            ProgressService.login(publicKey.toString()),
            SolanaService.getBalance(publicKey.toString()),
            SolanaService.getXPBalance(publicKey.toString())
        ]);

        // DB user (may fail if no database configured)
        if (userResult.status === 'fulfilled' && userResult.value) {
            const user = userResult.value;
            setXp(user.xp);
            setLevel(user.level);
            setStreak(user.streak);
            setAchievements(user.achievements || []);
            setCompletedLessons(user.completedLessons || []);
        } else if (userResult.status === 'rejected') {
            console.warn("DB login failed (non-blocking):", userResult.reason);
        }

        // On-chain SOL balance
        if (solResult.status === 'fulfilled') {
            setSolBalance(solResult.value);
        }

        // On-chain XP token balance
        if (splResult.status === 'fulfilled') {
            setOnChainXP(splResult.value);
        }
    }
  };

  const pathname = usePathname();
  const router = useRouter();

  // Sync with backend on connect, clear on disconnect
  useEffect(() => {
      if (connected && publicKey) {
          refreshUser();
      } else {
          // Disconnected: Clear state
          setXp(0);
          setOnChainXP(0);
          setSolBalance(0);
          setLevel(1);
          setStreak(0);
          setAchievements([]);
          setCompletedLessons([]);
          
          // Redirect if on protected pages
          const protectedRoutes = ['/dashboard', '/settings', '/profile'];
          if (protectedRoutes.some(route => pathname.startsWith(route))) {
              router.push('/');
              // toast.info("Disconnected"); 
          }
      }
  }, [connected, publicKey, pathname, router]);

  const addXP = async (amount: number) => {
    // Optimistic update
    setXp(prev => prev + amount);
  };

  return (
    <GamificationContext.Provider value={{ xp, onChainXP, solBalance, level, streak, addXP, achievements, completedLessons, refreshUser }}>
      {children}
    </GamificationContext.Provider>
  );
}

export function useGamification() {
  const context = useContext(GamificationContext);
  if (context === undefined) {
    throw new Error('useGamification must be used within a GamificationProvider');
  }
  return context;
}
