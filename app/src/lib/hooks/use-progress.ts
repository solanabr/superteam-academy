'use client'

import { useState, useEffect, useCallback } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'

const STORAGE_KEY = 'stacademy_progress'

interface LessonProgress {
  completed: boolean
  completedAt: string
  quizScore?: number
}

interface CourseProgress {
  [lessonId: string]: LessonProgress
}

interface AllProgress {
  [courseSlug: string]: CourseProgress
}

function loadProgress(): AllProgress {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}')
  } catch {
    return {}
  }
}

function saveProgress(progress: AllProgress) {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(progress))
}

export function useProgress(courseSlug: string) {
  const { publicKey } = useWallet()
  const [progress, setProgress] = useState<CourseProgress>({})

  useEffect(() => {
    const all = loadProgress()
    setProgress(all[courseSlug] || {})
  }, [courseSlug])

  const completeLesson = useCallback((lessonId: string, quizScore?: number) => {
    const all = loadProgress()
    if (!all[courseSlug]) all[courseSlug] = {}
    all[courseSlug][lessonId] = {
      completed: true,
      completedAt: new Date().toISOString(),
      ...(quizScore !== undefined ? { quizScore } : {}),
    }
    saveProgress(all)
    setProgress({ ...all[courseSlug] })

    // Also sync to API if wallet connected
    if (publicKey) {
      fetch('/api/progress', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          wallet: publicKey.toBase58(),
          lessonId,
          courseSlug,
          quizScore,
        }),
      }).catch(() => {}) // Best effort
    }

    // Award XP
    const xpKey = 'stacademy_xp'
    const currentXP = parseInt(localStorage.getItem(xpKey) || '0', 10)
    const xpGain = quizScore !== undefined ? 50 : 25
    localStorage.setItem(xpKey, String(currentXP + xpGain))
  }, [courseSlug, publicKey])

  const isCompleted = useCallback((lessonId: string) => {
    return !!progress[lessonId]?.completed
  }, [progress])

  const getCompletedCount = useCallback(() => {
    return Object.values(progress).filter(p => p.completed).length
  }, [progress])

  return { progress, completeLesson, isCompleted, getCompletedCount }
}

export function useXP() {
  const [xp, setXP] = useState(0)

  useEffect(() => {
    if (typeof window === 'undefined') return
    setXP(parseInt(localStorage.getItem('stacademy_xp') || '0', 10))
  }, [])

  return xp
}

export function useTotalProgress() {
  const [stats, setStats] = useState({ coursesStarted: 0, lessonsCompleted: 0 })

  useEffect(() => {
    const all = loadProgress()
    let lessonsCompleted = 0
    const coursesStarted = Object.keys(all).length
    for (const course of Object.values(all)) {
      lessonsCompleted += Object.values(course).filter(p => p.completed).length
    }
    setStats({ coursesStarted, lessonsCompleted })
  }, [])

  return stats
}
