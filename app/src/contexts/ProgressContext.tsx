"use client";

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useWallet } from '@solana/wallet-adapter-react';

interface LessonProgress {
  lessonId: string;
  courseSlug: string;
  completed: boolean;
  completedAt?: string;
  xpEarned: number;
  attempts: number;
  lastAttemptAt: string;
}

interface UserProgress {
  walletAddress: string;
  totalXP: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityAt: string | null;
  completedLessons: LessonProgress[];
  completedCourses: string[];
  achievements: string[];
}

interface ProgressContextValue {
  progress: UserProgress | null;
  isLoading: boolean;
  error: string | null;
  completeLesson: (lessonId: string, courseSlug: string, xpEarned: number) => Promise<boolean>;
  isLessonCompleted: (lessonId: string, courseSlug: string) => boolean;
  refreshProgress: () => Promise<void>;
}

const defaultProgress: UserProgress = {
  walletAddress: '',
  totalXP: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastActivityAt: null,
  completedLessons: [],
  completedCourses: [],
  achievements: []
};

const ProgressContext = createContext<ProgressContextValue | undefined>(undefined);

const STORAGE_KEY = 'superteam_academy_progress';

export function ProgressProvider({ children }: { children: React.ReactNode }) {
  const { publicKey, connected } = useWallet();
  const [progress, setProgress] = useState<UserProgress | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load progress from localStorage or API
  const refreshProgress = useCallback(async () => {
    const walletAddress = publicKey?.toBase58();

    // If no wallet connected, try localStorage
    if (!walletAddress) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProgress(JSON.parse(stored));
        } else {
          setProgress({ ...defaultProgress, walletAddress: 'local' });
        }
      } catch {
        setProgress({ ...defaultProgress, walletAddress: 'local' });
      }
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/progress?wallet=${walletAddress}`);
      if (response.ok) {
        const data = await response.json();
        setProgress(data);
        // Also save to localStorage as backup
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      } else {
        throw new Error('Failed to fetch progress');
      }
    } catch (err) {
      console.error('Error fetching progress:', err);
      // Fallback to localStorage
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          setProgress(JSON.parse(stored));
        } else {
          setProgress({ ...defaultProgress, walletAddress });
        }
      } catch {
        setProgress({ ...defaultProgress, walletAddress });
      }
      setError('Failed to sync progress with server');
    } finally {
      setIsLoading(false);
    }
  }, [publicKey]);

  // Load progress on mount and wallet change
  useEffect(() => {
    refreshProgress();
  }, [refreshProgress, connected]);

  // Complete a lesson
  const completeLesson = useCallback(async (
    lessonId: string,
    courseSlug: string,
    xpEarned: number
  ): Promise<boolean> => {
    const walletAddress = publicKey?.toBase58() || 'local';

    // Optimistic update
    const now = new Date().toISOString();
    const newLessonProgress: LessonProgress = {
      lessonId,
      courseSlug,
      completed: true,
      completedAt: now,
      xpEarned,
      attempts: 1,
      lastAttemptAt: now
    };

    setProgress(prev => {
      if (!prev) return prev;

      // Check if already completed
      const existing = prev.completedLessons.find(
        l => l.lessonId === lessonId && l.courseSlug === courseSlug
      );

      if (existing) {
        return {
          ...prev,
          completedLessons: prev.completedLessons.map(l =>
            l.lessonId === lessonId && l.courseSlug === courseSlug
              ? { ...l, attempts: l.attempts + 1, lastAttemptAt: now }
              : l
          )
        };
      }

      const updated = {
        ...prev,
        totalXP: prev.totalXP + xpEarned,
        currentStreak: prev.currentStreak + (prev.currentStreak === 0 ? 1 : 0),
        lastActivityAt: now,
        completedLessons: [...prev.completedLessons, newLessonProgress]
      };

      // Save to localStorage immediately
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      return updated;
    });

    // If wallet connected, sync with API
    if (publicKey) {
      try {
        const response = await fetch('/api/progress', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            walletAddress,
            lessonId,
            courseSlug,
            xpEarned
          })
        });

        if (response.ok) {
          const data = await response.json();
          setProgress(data.progress);
          localStorage.setItem(STORAGE_KEY, JSON.stringify(data.progress));
          return true;
        }
      } catch (err) {
        console.error('Error syncing progress:', err);
        // Already updated locally, so return true
      }
    }

    return true;
  }, [publicKey]);

  // Check if a lesson is completed
  const isLessonCompleted = useCallback((lessonId: string, courseSlug: string): boolean => {
    if (!progress) return false;
    return progress.completedLessons.some(
      l => l.lessonId === lessonId && l.courseSlug === courseSlug && l.completed
    );
  }, [progress]);

  return (
    <ProgressContext.Provider
      value={{
        progress,
        isLoading,
        error,
        completeLesson,
        isLessonCompleted,
        refreshProgress
      }}
    >
      {children}
    </ProgressContext.Provider>
  );
}

export function useProgress() {
  const context = useContext(ProgressContext);
  if (context === undefined) {
    throw new Error('useProgress must be used within a ProgressProvider');
  }
  return context;
}
