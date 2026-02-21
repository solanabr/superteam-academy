# Customization Guide

This guide covers how to customize themes, add new languages, extend the gamification system, and modify the Superteam Academy LMS to fit your organization's needs.

## 🎨 Theme Customization

### Understanding the Theme System

The LMS uses a CSS variables-based theming system that supports:
- **Dark Mode Primary**: Solana-branded dark theme (default)
- **Light Mode Secondary**: Clean light theme for accessibility
- **System Mode**: Automatic switching based on user preference

### Theme Architecture

```css
/* Root Variables (Light Mode) */
:root {
  --background: 0 0% 100%;
  --foreground: 240 10% 3.9%;
  --primary: 269 87% 61%;     /* Solana Purple */
  --accent: 143 90% 61%;      /* Solana Green */
  /* ... other variables */
}

/* Dark Mode Overrides */
.dark {
  --background: 240 10% 3.9%;
  --foreground: 0 0% 98%;
  /* ... dark mode values */
}
```

### Creating Custom Themes

#### 1. Brand Color Customization

Replace Solana colors with your brand:

```css
/* src/app/globals.css */
:root {
  /* Your Primary Brand Color */
  --primary: 220 100% 50%;    /* Blue example */
  --primary-foreground: 0 0% 100%;
  
  /* Your Secondary Brand Color */  
  --accent: 45 93% 47%;       /* Orange example */
  --accent-foreground: 0 0% 0%;
  
  /* Success/Error Colors */
  --success: 142 76% 36%;     /* Green */
  --warning: 38 92% 50%;      /* Yellow */
  --destructive: 0 84% 60%;   /* Red */
}
```

#### 2. Typography Customization

```css
/* Custom Font Integration */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

:root {
  --font-sans: 'Inter', system-ui, sans-serif;
  --font-mono: 'Fira Code', monospace;
}

body {
  font-family: var(--font-sans);
}

.font-mono {
  font-family: var(--font-mono);
}
```

#### 3. Component-Specific Styling

```css
/* Custom component styles */
.text-gradient {
  background: linear-gradient(135deg, 
    hsl(var(--primary)) 0%, 
    hsl(var(--accent)) 100%
  );
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
}

.xp-badge {
  background: hsl(var(--primary) / 0.1);
  color: hsl(var(--primary));
  border: 1px solid hsl(var(--primary) / 0.2);
}

.level-indicator {
  background: linear-gradient(135deg, 
    hsl(var(--primary)) 0%, 
    hsl(var(--accent)) 100%
  );
}
```

### Advanced Theme Features

#### 1. Multiple Theme Variants

Create additional theme variants:

```typescript
// src/lib/themes.ts
export const themes = {
  solana: {
    primary: '269 87% 61%',
    accent: '143 90% 61%',
    name: 'Solana (Default)'
  },
  
  ethereum: {
    primary: '220 100% 50%',
    accent: '280 100% 70%',
    name: 'Ethereum'
  },
  
  bitcoin: {
    primary: '38 100% 50%',
    accent: '45 100% 60%',
    name: 'Bitcoin'
  },
  
  corporate: {
    primary: '215 25% 27%',
    accent: '142 76% 36%',
    name: 'Corporate'
  }
}
```

#### 2. Dynamic Theme Switching

```typescript
// src/components/theme-selector.tsx
'use client'

import { useState } from 'react'
import { themes } from '@/lib/themes'

export function ThemeSelector() {
  const [currentTheme, setCurrentTheme] = useState('solana')
  
  const applyTheme = (themeKey: string) => {
    const theme = themes[themeKey]
    const root = document.documentElement
    
    Object.entries(theme).forEach(([property, value]) => {
      if (property !== 'name') {
        root.style.setProperty(`--${property}`, value)
      }
    })
    
    setCurrentTheme(themeKey)
    localStorage.setItem('custom-theme', themeKey)
  }
  
  return (
    <select 
      value={currentTheme} 
      onChange={(e) => applyTheme(e.target.value)}
    >
      {Object.entries(themes).map(([key, theme]) => (
        <option key={key} value={key}>
          {theme.name}
        </option>
      ))}
    </select>
  )
}
```

### Responsive Design Customization

#### 1. Breakpoint Customization

```typescript
// tailwind.config.ts - Custom breakpoints
module.exports = {
  theme: {
    screens: {
      'xs': '475px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      '3xl': '1920px',  // Custom large screen
    }
  }
}
```

#### 2. Component Responsive Behavior

```css
/* Custom responsive utilities */
@layer utilities {
  .course-grid {
    @apply grid grid-cols-1;
  }
  
  @screen sm {
    .course-grid {
      @apply grid-cols-2;
    }
  }
  
  @screen lg {
    .course-grid {
      @apply grid-cols-3;
    }
  }
  
  @screen xl {
    .course-grid {
      @apply grid-cols-4;
    }
  }
}
```

## 🌐 Internationalization (i18n)

### Adding New Languages

#### 1. Translation File Structure

```
src/i18n/
├── config.ts                 # i18n configuration
└── locales/
    ├── en.json               # English (default)
    ├── pt-BR.json           # Portuguese (Brazil)
    ├── es.json              # Spanish
    ├── fr.json              # French (new)
    ├── de.json              # German (new)
    └── ja.json              # Japanese (new)
```

#### 2. Translation File Format

```json
// src/i18n/locales/fr.json
{
  "common": {
    "loading": "Chargement...",
    "error": "Erreur",
    "success": "Succès",
    "cancel": "Annuler",
    "confirm": "Confirmer",
    "save": "Sauvegarder"
  },
  
  "navigation": {
    "home": "Accueil",
    "courses": "Cours",
    "dashboard": "Tableau de bord",
    "profile": "Profil",
    "settings": "Paramètres",
    "leaderboard": "Classement",
    "signIn": "Connexion",
    "signOut": "Déconnexion"
  },
  
  "courses": {
    "title": "Cours",
    "description": "Explorez nos cours de développement Solana",
    "difficulty": {
      "beginner": "Débutant",
      "intermediate": "Intermédiaire", 
      "advanced": "Avancé"
    },
    "filters": {
      "all": "Tous",
      "category": "Catégorie",
      "difficulty": "Difficulté",
      "duration": "Durée"
    }
  },
  
  "gamification": {
    "xp": "XP",
    "level": "Niveau",
    "streak": "Série",
    "achievements": "Succès",
    "leaderboard": "Classement",
    "progress": "Progression"
  },
  
  "lesson": {
    "complete": "Terminer la leçon",
    "next": "Suivant",
    "previous": "Précédent",
    "hint": "Indice",
    "solution": "Solution",
    "runCode": "Exécuter le code",
    "resetCode": "Réinitialiser le code"
  }
}
```

#### 3. i18n Configuration

```typescript
// src/i18n/config.ts
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

// Import translation files
import en from './locales/en.json'
import ptBR from './locales/pt-BR.json'
import es from './locales/es.json'
import fr from './locales/fr.json'
import de from './locales/de.json'
import ja from './locales/ja.json'

const resources = {
  en: { translation: en },
  'pt-BR': { translation: ptBR },
  es: { translation: es },
  fr: { translation: fr },
  de: { translation: de },
  ja: { translation: ja }
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: 'en', // Default language
    fallbackLng: 'en',
    
    interpolation: {
      escapeValue: false
    },
    
    // Namespace configuration
    defaultNS: 'translation',
    
    // Language detection
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage']
    }
  })

export default i18n

// Language metadata for UI
export const languages = [
  { code: 'en', name: 'English', flag: '🇺🇸' },
  { code: 'pt-BR', name: 'Português (Brasil)', flag: '🇧🇷' },
  { code: 'es', name: 'Español', flag: '🇪🇸' },
  { code: 'fr', name: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'Deutsch', flag: '🇩🇪' },
  { code: 'ja', name: '日本語', flag: '🇯🇵' }
]
```

#### 4. Language Selector Component

```typescript
// src/components/language-selector.tsx
'use client'

import { useTranslation } from 'react-i18next'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { languages } from '@/i18n/config'

export function LanguageSelector() {
  const { i18n } = useTranslation()
  
  const changeLanguage = (languageCode: string) => {
    i18n.changeLanguage(languageCode)
    localStorage.setItem('language', languageCode)
  }
  
  return (
    <Select value={i18n.language} onValueChange={changeLanguage}>
      <SelectTrigger className="w-48">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {languages.map((language) => (
          <SelectItem key={language.code} value={language.code}>
            <div className="flex items-center gap-2">
              <span>{language.flag}</span>
              <span>{language.name}</span>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
```

### Right-to-Left (RTL) Language Support

#### 1. RTL Configuration

```typescript
// src/i18n/config.ts - Add RTL support
export const rtlLanguages = ['ar', 'he', 'fa']

export const isRTL = (language: string): boolean => {
  return rtlLanguages.includes(language)
}

// Apply RTL to document
export const applyTextDirection = (language: string) => {
  document.dir = isRTL(language) ? 'rtl' : 'ltr'
  document.documentElement.setAttribute('dir', document.dir)
}
```

#### 2. RTL Styles

```css
/* src/app/globals.css - RTL styles */
[dir="rtl"] .text-gradient {
  background: linear-gradient(-135deg, 
    hsl(var(--primary)) 0%, 
    hsl(var(--accent)) 100%
  );
}

[dir="rtl"] .course-card {
  transform: scaleX(-1);
}

[dir="rtl"] .navigation-menu {
  flex-direction: row-reverse;
}
```

## 🎮 Gamification System Extension

### Achievement System

#### 1. Achievement Categories

```typescript
// src/types/achievements.ts
export interface Achievement {
  id: number              // Bit position (0-255)
  name: string           // Achievement name
  description: string    // Description
  icon: string          // Emoji or icon
  category: AchievementCategory
  requirement: string   // Human-readable requirement
  xpReward: number     // XP awarded
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary'
  hidden?: boolean     // Hidden until unlocked
}

export type AchievementCategory = 
  | 'progress'    // Course/lesson completion
  | 'streaks'     // Daily activity streaks  
  | 'skills'      // Technical skill mastery
  | 'community'   // Social interactions
  | 'special'     // Limited time/special events
```

#### 2. Achievement Definitions

```typescript
// src/data/achievements.ts
export const achievements: Achievement[] = [
  // Progress Achievements
  {
    id: 0,
    name: 'First Steps',
    description: 'Complete your first lesson',
    icon: '👶',
    category: 'progress',
    requirement: 'Complete any lesson',
    xpReward: 25,
    rarity: 'common'
  },
  
  {
    id: 1,
    name: 'Course Conqueror', 
    description: 'Complete your first course',
    icon: '🏆',
    category: 'progress',
    requirement: 'Complete any course',
    xpReward: 100,
    rarity: 'uncommon'
  },
  
  {
    id: 2,
    name: 'Scholar',
    description: 'Complete 5 courses',
    icon: '🎓',
    category: 'progress', 
    requirement: 'Complete 5 courses',
    xpReward: 500,
    rarity: 'rare'
  },
  
  // Streak Achievements
  {
    id: 10,
    name: 'Week Warrior',
    description: 'Maintain a 7-day learning streak',
    icon: '🔥',
    category: 'streaks',
    requirement: '7 consecutive days of activity',
    xpReward: 100,
    rarity: 'uncommon'
  },
  
  {
    id: 11,
    name: 'Month Master',
    description: 'Maintain a 30-day learning streak',
    icon: '🌟',
    category: 'streaks',
    requirement: '30 consecutive days of activity', 
    xpReward: 1000,
    rarity: 'rare'
  },
  
  // Skill Achievements
  {
    id: 20,
    name: 'Code Crusher',
    description: 'Solve your first coding challenge',
    icon: '⚡',
    category: 'skills',
    requirement: 'Complete any coding challenge',
    xpReward: 50,
    rarity: 'common'
  },
  
  {
    id: 21,
    name: 'Rust Rookie',
    description: 'Complete a Rust programming course',
    icon: '🦀',
    category: 'skills',
    requirement: 'Complete any Rust course',
    xpReward: 200,
    rarity: 'uncommon'
  },
  
  // Community Achievements  
  {
    id: 30,
    name: 'Helper',
    description: 'Help 10 other learners',
    icon: '🤝',
    category: 'community',
    requirement: 'Provide help to 10 students',
    xpReward: 250,
    rarity: 'uncommon',
    hidden: true
  },
  
  // Special Achievements
  {
    id: 50,
    name: 'Early Adopter',
    description: 'Joined during the beta period',
    icon: '🚀',
    category: 'special',
    requirement: 'Register during beta',
    xpReward: 500,
    rarity: 'legendary',
    hidden: true
  }
]
```

#### 3. Achievement Engine

```typescript
// src/services/achievement.service.ts
export class AchievementService {
  private achievements = achievements
  
  async checkAndUnlockAchievements(
    userId: string, 
    context: AchievementContext
  ): Promise<Achievement[]> {
    const userAchievements = await this.getUserAchievements(userId)
    const unlockedAchievements: Achievement[] = []
    
    for (const achievement of this.achievements) {
      if (this.hasAchievement(userAchievements, achievement.id)) continue
      
      if (await this.meetsRequirement(userId, achievement, context)) {
        await this.unlockAchievement(userId, achievement)
        unlockedAchievements.push(achievement)
      }
    }
    
    return unlockedAchievements
  }
  
  private async meetsRequirement(
    userId: string,
    achievement: Achievement, 
    context: AchievementContext
  ): Promise<boolean> {
    switch (achievement.id) {
      case 0: // First Steps
        return context.type === 'lesson_completed'
        
      case 1: // Course Conqueror
        return context.type === 'course_completed'
        
      case 2: // Scholar
        const completedCourses = await this.getCompletedCoursesCount(userId)
        return completedCourses >= 5
        
      case 10: // Week Warrior
        return context.type === 'streak_milestone' && 
               (context.data.streakCount || 0) >= 7
               
      // Add more achievement logic...
      
      default:
        return false
    }
  }
}
```

### XP and Leveling System

#### 1. Custom XP Formulas

```typescript
// src/lib/gamification.ts
export class GamificationEngine {
  // Custom level calculation
  static calculateLevel(xp: number): number {
    // Square root progression: Level = sqrt(XP / 100)
    return Math.floor(Math.sqrt(xp / 100))
  }
  
  // Alternative: Exponential progression
  static calculateLevelExponential(xp: number): number {
    // More challenging progression
    return Math.floor(Math.log2(xp / 50 + 1))
  }
  
  // Custom XP requirements per level
  static getXPRequirement(level: number): number {
    return level * level * 100
  }
  
  // XP multipliers based on difficulty
  static getXPMultiplier(difficulty: 'beginner' | 'intermediate' | 'advanced'): number {
    const multipliers = {
      beginner: 1.0,
      intermediate: 1.5,
      advanced: 2.0
    }
    return multipliers[difficulty]
  }
  
  // Streak bonuses
  static getStreakBonus(streakDays: number): number {
    if (streakDays >= 30) return 50  // Month bonus
    if (streakDays >= 7) return 25   // Week bonus 
    if (streakDays >= 3) return 10   // Three day bonus
    return 5 // Daily bonus
  }
}
```

#### 2. Custom Rewards System

```typescript
// src/types/rewards.ts
interface Reward {
  id: string
  name: string
  description: string
  type: 'badge' | 'title' | 'avatar' | 'theme' | 'feature'
  cost: number          // XP cost to unlock
  requirement?: string  // Alternative requirement
  unlockLevel?: number  // Level requirement
}

// src/data/rewards.ts
export const rewards: Reward[] = [
  {
    id: 'golden-badge',
    name: 'Golden Learner Badge',
    description: 'Prestigious golden badge for your profile',
    type: 'badge',
    cost: 1000
  },
  
  {
    id: 'rust-master-title',
    name: 'Rust Master',
    description: 'Special title showing Rust expertise',
    type: 'title',
    cost: 2500,
    requirement: 'Complete 3 Rust courses'
  },
  
  {
    id: 'dark-theme-pro',
    name: 'Pro Dark Theme', 
    description: 'Exclusive dark theme variant',
    type: 'theme',
    cost: 500
  },
  
  {
    id: 'priority-support',
    name: 'Priority Support',
    description: '24/7 priority support access',
    type: 'feature',
    cost: 5000,
    unlockLevel: 10
  }
]
```

### Custom Progress Tracking

#### 1. Advanced Analytics

```typescript
// src/services/analytics.service.ts
export class LearningAnalytics {
  // Learning velocity tracking
  async getLearningVelocity(userId: string, days: number = 30): Promise<number> {
    const recentProgress = await this.getRecentProgress(userId, days)
    const totalXP = recentProgress.reduce((sum, p) => sum + p.xpGained, 0)
    return totalXP / days
  }
  
  // Skill progression mapping
  async getSkillProgression(userId: string): Promise<SkillMap> {
    const completedCourses = await this.getCompletedCourses(userId)
    const skillMap: SkillMap = {}
    
    completedCourses.forEach(course => {
      course.tags.forEach(skill => {
        skillMap[skill] = (skillMap[skill] || 0) + course.xpReward
      })
    })
    
    return skillMap
  }
  
  // Personalized recommendations
  async getPersonalizedRecommendations(userId: string): Promise<Course[]> {
    const userSkills = await this.getSkillProgression(userId)
    const userLevel = await this.getUserLevel(userId)
    
    // Algorithm to recommend courses based on:
    // - Current skill gaps
    // - User level and preferences
    // - Popular courses among similar users
    
    return this.recommendationEngine.generateRecommendations({
      userSkills,
      userLevel,
      preferredDifficulty: await this.getPreferredDifficulty(userId)
    })
  }
}
```

#### 2. Custom Challenges

```typescript
// src/types/challenges.ts
interface CustomChallenge {
  id: string
  name: string
  description: string
  type: 'daily' | 'weekly' | 'monthly' | 'event'
  startDate: string
  endDate: string
  requirements: ChallengeRequirement[]
  rewards: ChallengeReward[]
}

interface ChallengeRequirement {
  type: 'complete_lessons' | 'earn_xp' | 'maintain_streak' | 'solve_challenges'
  target: number
  currentProgress?: number
}

// src/data/challenges.ts
export const customChallenges: CustomChallenge[] = [
  {
    id: 'january-jumpstart',
    name: 'January Jumpstart',
    description: 'Start the year strong with intensive learning',
    type: 'monthly',
    startDate: '2024-01-01',
    endDate: '2024-01-31',
    requirements: [
      { type: 'complete_lessons', target: 20 },
      { type: 'maintain_streak', target: 15 }
    ],
    rewards: [
      { type: 'xp', amount: 1000 },
      { type: 'badge', id: 'january-champion' },
      { type: 'title', id: 'new-year-warrior' }
    ]
  }
]
```

## 🔧 Component Customization

### Custom UI Components

#### 1. Branded Course Cards

```typescript
// src/components/custom-course-card.tsx
interface CustomCourseCardProps {
  course: Course
  variant?: 'default' | 'featured' | 'compact'
  showProgress?: boolean
  customBranding?: {
    accentColor?: string
    logoUrl?: string
    partnerName?: string
  }
}

export function CustomCourseCard({ 
  course, 
  variant = 'default',
  customBranding 
}: CustomCourseCardProps) {
  const brandingStyles = customBranding ? {
    '--custom-accent': customBranding.accentColor,
  } as React.CSSProperties : {}
  
  return (
    <Card 
      className={cn(
        'course-card',
        variant === 'featured' && 'ring-2 ring-primary',
        variant === 'compact' && 'h-32'
      )}
      style={brandingStyles}
    >
      {/* Custom course card content with branding */}
    </Card>
  )
}
```

#### 2. Custom Progress Visualizations

```typescript
// src/components/custom-progress-chart.tsx
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis } from 'recharts'

interface ProgressChartProps {
  data: ProgressDataPoint[]
  type: 'line' | 'bar' | 'radar'
  timeframe: 'week' | 'month' | 'year'
}

export function CustomProgressChart({ data, type, timeframe }: ProgressChartProps) {
  const chartConfig = getChartConfig(type, timeframe)
  
  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <XAxis dataKey="date" />
        <YAxis />
        <Line 
          type="monotone" 
          dataKey="xp" 
          stroke="hsl(var(--primary))" 
          strokeWidth={3}
          dot={{ fill: 'hsl(var(--accent))' }}
        />
      </LineChart>
    </ResponsiveContainer>
  )
}
```

### White-Label Customization

#### 1. Configuration System

```typescript
// src/config/branding.ts
export interface BrandingConfig {
  // Brand Identity
  brandName: string
  logoUrl: string
  faviconUrl: string
  
  // Color Scheme
  primaryColor: string
  secondaryColor: string
  accentColor: string
  
  // Typography
  fontFamily: string
  headingFont?: string
  
  // Features
  enabledFeatures: {
    gamification: boolean
    certificates: boolean
    leaderboards: boolean
    socialFeatures: boolean
  }
  
  // Customization
  customCSS?: string
  customFooter?: string
  customAnalytics?: {
    googleAnalyticsId?: string
    customTrackingScript?: string
  }
}

// Environment-specific branding
export const brandingConfig: BrandingConfig = {
  brandName: process.env.NEXT_PUBLIC_BRAND_NAME || 'Superteam Academy',
  logoUrl: process.env.NEXT_PUBLIC_LOGO_URL || '/logo.svg',
  primaryColor: process.env.NEXT_PUBLIC_PRIMARY_COLOR || '269 87% 61%',
  // ... other config
}
```

#### 2. Dynamic Branding Application

```typescript
// src/components/branded-layout.tsx
'use client'

import { useEffect } from 'react'
import { brandingConfig } from '@/config/branding'

export function BrandedLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Apply custom CSS variables
    const root = document.documentElement
    root.style.setProperty('--primary', brandingConfig.primaryColor)
    root.style.setProperty('--secondary', brandingConfig.secondaryColor)
    
    // Apply custom font
    if (brandingConfig.fontFamily) {
      root.style.setProperty('--font-sans', brandingConfig.fontFamily)
    }
    
    // Apply custom CSS
    if (brandingConfig.customCSS) {
      const style = document.createElement('style')
      style.textContent = brandingConfig.customCSS
      document.head.appendChild(style)
    }
  }, [])
  
  return (
    <div className="branded-app">
      {children}
      {brandingConfig.customFooter && (
        <div dangerouslySetInnerHTML={{ __html: brandingConfig.customFooter }} />
      )}
    </div>
  )
}
```

This comprehensive customization guide enables organizations to fully adapt the Superteam Academy LMS to their brand, language requirements, and gamification preferences while maintaining the core educational functionality.