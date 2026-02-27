'use client'

import { useEffect, useState } from 'react'
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts'
import { cn } from '@/lib/utils'

type SkillPoint = {
  label: string
  value: number
}

interface SkillsRadarProps {
  data: SkillPoint[]
}

export function SkillsRadar({ data }: SkillsRadarProps) {
  if (!data || data.length === 0) {
    return null
  }

  return (
    <div className="w-full h-64 md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data}>
          <PolarGrid stroke="hsl(var(--border))" />
          <PolarAngleAxis
            dataKey="label"
            tick={{
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 11,
            }}
          />
          <PolarRadiusAxis
            angle={30}
            domain={[0, 100]}
            tick={{
              fill: 'hsl(var(--muted-foreground))',
              fontSize: 10,
            }}
            stroke="hsl(var(--border))"
          />
          <Radar
            name="Skill"
            dataKey="value"
            stroke="hsl(var(--primary))"
            fill="hsl(var(--primary))"
            fillOpacity={0.2}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}

interface ProfileVisibilityToggleProps {
  userId: string
  label: string
  publicLabel: string
  privateLabel: string
}

export function ProfileVisibilityToggle({
  userId,
  label,
  publicLabel,
  privateLabel,
}: ProfileVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(true)

  useEffect(() => {
    const stored = typeof window !== 'undefined' ? window.localStorage.getItem(`profile-visibility:${userId}`) : null
    if (stored === 'public') {
      setIsPublic(true)
    } else if (stored === 'private') {
      setIsPublic(false)
    }
  }, [userId])

  function toggle() {
    const next = !isPublic
    setIsPublic(next)
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(`profile-visibility:${userId}`, next ? 'public' : 'private')
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      className={cn(
        'inline-flex items-center gap-2 rounded-full border px-3 py-1 text-xs font-medium transition-colors',
        'border-border/60 bg-background/60 hover:border-primary/60',
      )}
      aria-pressed={isPublic}
    >
      <span className="text-muted-foreground">{label}</span>
      <span
        className={cn(
          'rounded-full px-2 py-0.5 text-[10px] uppercase tracking-wide',
          isPublic ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
        )}
      >
        {isPublic ? publicLabel : privateLabel}
      </span>
    </button>
  )
}

