'use client'

import React from 'react'

interface ProgressBarProps {
  value: number
  max?: number
  showLabel?: boolean
}

export function ProgressBar({ value, max = 100, showLabel = false }: ProgressBarProps) {
  const percentage = Math.min((value / max) * 100, 100)

  return (
    <div>
      <div className="h-3 bg-gray-200 dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-neon-cyan to-neon-magenta transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      {showLabel && <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{Math.round(percentage)}% Complete</p>}
    </div>
  )
}

interface StatsCardProps {
  icon: string
  label: string
  value: string | number
}

export function StatsCard({ icon, label, value }: StatsCardProps) {
  return (
    <div className="bg-white dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded-lg p-4 text-center">
      <div className="text-3xl mb-2">{icon}</div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{label}</p>
      <p className="text-2xl font-bold text-blue-600 dark:text-neon-cyan">{value}</p>
    </div>
  )
}

interface LevelDisplayProps {
  level: number
  xp: number
  xpRequiredForNextLevel: number
}

export function LevelDisplay({ level, xp, xpRequiredForNextLevel }: LevelDisplayProps) {
  const progressPercent = (xp / xpRequiredForNextLevel) * 100

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-lg font-bold text-blue-600 dark:text-neon-cyan">Level {level}</span>
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {xp} / {xpRequiredForNextLevel} XP
        </span>
      </div>
      <div className="h-4 bg-gray-200 dark:bg-terminal-surface border border-gray-300 dark:border-terminal-border rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-neon-green to-neon-cyan transition-all duration-500"
          style={{ width: `${progressPercent}%` }}
        />
      </div>
    </div>
  )
}
