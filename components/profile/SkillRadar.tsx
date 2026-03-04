'use client'

import { useMemo } from 'react'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'
import { useTheme } from '@/lib/hooks/useTheme'

export interface SkillData {
  skill: string
  value: number
  fullMark: number
}

interface SkillRadarProps {
  data: SkillData[]
  title?: string
  size?: 'small' | 'medium' | 'large'
}

const defaultSkills: SkillData[] = [
  { skill: 'Rust', value: 0, fullMark: 100 },
  { skill: 'Anchor', value: 0, fullMark: 100 },
  { skill: 'Frontend', value: 0, fullMark: 100 },
  { skill: 'Security', value: 0, fullMark: 100 },
  { skill: 'DeFi', value: 0, fullMark: 100 },
  { skill: 'NFTs', value: 0, fullMark: 100 },
]

export function SkillRadar({ 
  data = defaultSkills, 
  title = 'Skills',
  size = 'medium' 
}: SkillRadarProps) {
  const { isDark } = useTheme()

  const sizeConfig = {
    small: 250,
    medium: 350,
    large: 450,
  }

  const height = sizeConfig[size]

  const angleAxisStyle = useMemo(
    () => ({
      fontSize: 12,
      fill: isDark ? '#94a3b8' : '#475569',
      fontFamily: 'inherit',
    }),
    [isDark]
  )

  const radiusAxisStyle = useMemo(
    () => ({
      fontSize: 10,
      fill: isDark ? '#64748b' : '#64748b',
    }),
    [isDark]
  )

  const gridStroke = isDark ? '#334155' : '#cbd5e1'
  const radarColor = isDark ? '#00F0FF' : '#2563eb'

  return (
    <div className="w-full">
      {title && (
        <h3 className="mb-4 text-lg font-semibold text-slate-900 dark:text-white">
          {title}
        </h3>
      )}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid 
              stroke={gridStroke}
              strokeDasharray="3 3"
            />
            <PolarAngleAxis
              dataKey="skill"
              tick={angleAxisStyle}
            />
            <PolarRadiusAxis
              angle={30}
              domain={[0, 100]}
              tick={radiusAxisStyle}
              axisLine={false}
            />
            <Radar
              name="Skill Level"
              dataKey="value"
              stroke={radarColor}
              fill={radarColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value: string) => (
                <span className="text-sm text-slate-600 dark:text-gray-300">{value}</span>
              )}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="mt-4 grid grid-cols-2 gap-2">
        {data.map((skill) => (
          <div 
            key={skill.skill} 
            className="flex items-center justify-between text-sm"
          >
            <span className="text-slate-600 dark:text-gray-400">
              {skill.skill}
            </span>
            <span className="font-medium text-blue-700 dark:text-neon-cyan">
              {skill.value}%
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function calculateSkillsFromProgress(
  completedCourses: number,
  completedLessons: number,
  courseCategories?: { rust?: number; anchor?: number; frontend?: number; defi?: number; nfts?: number; security?: number }
): SkillData[] {
  const baseSkills = {
    rust: courseCategories?.rust ?? 0,
    anchor: courseCategories?.anchor ?? 0,
    frontend: courseCategories?.frontend ?? 0,
    security: courseCategories?.security ?? 0,
    defi: courseCategories?.defi ?? 0,
    nfts: courseCategories?.nfts ?? 0,
  }

  const totalCourses = completedCourses || 1
  
  return [
    { 
      skill: 'Rust', 
      value: Math.min(100, Math.round((baseSkills.rust / totalCourses) * 100 + (completedLessons * 2))),
      fullMark: 100 
    },
    { 
      skill: 'Anchor', 
      value: Math.min(100, Math.round((baseSkills.anchor / totalCourses) * 100 + (completedLessons * 2))),
      fullMark: 100 
    },
    { 
      skill: 'Frontend', 
      value: Math.min(100, Math.round((baseSkills.frontend / totalCourses) * 100 + (completedLessons * 2))),
      fullMark: 100 
    },
    { 
      skill: 'Security', 
      value: Math.min(100, Math.round((baseSkills.security / totalCourses) * 100 + (completedLessons * 1.5))),
      fullMark: 100 
    },
    { 
      skill: 'DeFi', 
      value: Math.min(100, Math.round((baseSkills.defi / totalCourses) * 100 + (completedLessons * 1.5))),
      fullMark: 100 
    },
    { 
      skill: 'NFTs', 
      value: Math.min(100, Math.round((baseSkills.nfts / totalCourses) * 100 + (completedLessons * 1.5))),
      fullMark: 100 
    },
  ]
}

export const demoSkillData: SkillData[] = [
  { skill: 'Rust', value: 75, fullMark: 100 },
  { skill: 'Anchor', value: 60, fullMark: 100 },
  { skill: 'Frontend', value: 85, fullMark: 100 },
  { skill: 'Security', value: 45, fullMark: 100 },
  { skill: 'DeFi', value: 55, fullMark: 100 },
  { skill: 'NFTs', value: 70, fullMark: 100 },
]
