'use client'

import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ResponsiveContainer,
  Legend,
} from 'recharts'

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
  const sizeConfig = {
    small: 250,
    medium: 350,
    large: 450,
  }

  const height = sizeConfig[size]

  const angleAxisStyle = {
    fontSize: 12,
    fill: '#9ca3af',
    fontFamily: 'inherit',
  }

  const radiusAxisStyle = {
    fontSize: 10,
    fill: '#6b7280',
  }

  return (
    <div className="w-full">
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          {title}
        </h3>
      )}
      <div className="relative" style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}>
            <PolarGrid 
              stroke="#374151" 
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
              stroke="#00F0FF"
              fill="#00F0FF"
              fillOpacity={0.3}
              strokeWidth={2}
            />
            <Legend 
              verticalAlign="bottom"
              height={36}
              formatter={(value) => (
                <span className="text-gray-400 text-sm">{value}</span>
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
            <span className="text-gray-600 dark:text-gray-400">
              {skill.skill}
            </span>
            <span className="font-medium text-neon-cyan dark:text-neon-cyan">
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
