import { ReactNode } from 'react'

export interface PathModuleItem {
  label: string
  done?: boolean
  active?: boolean
}

export interface PathItem {
  svgKey: string
  slug: string
  tag: string
  tagColor: string
  tagText: string
  level: number
  title: string
  desc: string
  modules: { label: string; done?: boolean; active?: boolean }[]
  progress: number
  xp: string
  duration: string
  lessons: number
  featured: boolean
}

export interface FeatureItem {
  key: string
  num: string
  title: string
  desc: string
  meta: string
  accent?: boolean
}

export interface StatItem {
  value: string
  label: string
}

export interface TestimonialItem {
  name: string
  role: string
  initials: string
  avatarBg: string
  stars: number
  quote: string
  highlight: boolean
}

export interface LanguageOption {
  code: string
  label: string
  short: string
  flag: ReactNode
}

export interface PartnerItem {
  name: string
  abbr: string
}
