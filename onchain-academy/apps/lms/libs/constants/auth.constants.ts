// ─── Auth + Settings — Static Constants ────────────────────────

// ─── Language Options ───────────────────────────────────────────

export interface LanguageOption {
  code: string
  label: string
  nativeLabel: string
  flag: string
}

export const LANGUAGE_OPTIONS: LanguageOption[] = [
  { code: 'en', label: 'English', nativeLabel: 'English', flag: '🇺🇸' },
  { code: 'pt', label: 'Portuguese', nativeLabel: 'Português', flag: '🇧🇷' },
  { code: 'es', label: 'Spanish', nativeLabel: 'Español', flag: '🇲🇽' },
]

// ─── Notification Preferences ───────────────────────────────────

export interface NotificationPref {
  id: string
  label: string
  description: string
  defaultEnabled: boolean
}

export const NOTIFICATION_PREFS: NotificationPref[] = [
  {
    id: 'course_updates',
    label: 'Course updates',
    description: 'New lessons, content changes, and course announcements',
    defaultEnabled: true,
  },
  {
    id: 'xp_rewards',
    label: 'XP & rewards',
    description: 'When you earn XP, level up, or unlock an achievement',
    defaultEnabled: true,
  },
  {
    id: 'streak_reminders',
    label: 'Streak reminders',
    description: 'Daily reminders to maintain your learning streak',
    defaultEnabled: true,
  },
  {
    id: 'leaderboard',
    label: 'Leaderboard changes',
    description: 'When your rank changes or you enter the top 10',
    defaultEnabled: false,
  },
  {
    id: 'community',
    label: 'Community activity',
    description: 'Replies, mentions, and new discussions in your courses',
    defaultEnabled: false,
  },
]

// ─── Wallet Options ─────────────────────────────────────────────

export interface WalletOption {
  id: string
  name: string
  icon: string
  connected: boolean
  address?: string
}

export const WALLET_OPTIONS: WalletOption[] = [
  {
    id: 'solana-wallet',
    name: 'Solana Wallet',
    icon: 'solana',
    connected: false,
    address: '7xKX...4mNp',
  },
]

// ─── Social Auth Connections ────────────────────────────────────

export interface SocialConnection {
  id: string
  name: string
  icon: string
  connected: boolean
  handle?: string
}

export const SOCIAL_CONNECTIONS: SocialConnection[] = [
  {
    id: 'google',
    name: 'Google',
    icon: 'G',
    connected: true,
    handle: 'alex.rivera@gmail.com',
  },
  {
    id: 'github',
    name: 'GitHub',
    icon: 'GH',
    connected: false,
  },
]

// ─── Settings Tab Config ─────────────────────────────────────────

export interface SettingsTab {
  id: string
  label: string
  icon: string
}

export const SETTINGS_TABS: SettingsTab[] = [
  { id: 'profile', label: 'Profile', icon: 'user' },
  { id: 'account', label: 'Account', icon: 'shield' },
  { id: 'preferences', label: 'Preferences', icon: 'sliders' },
  { id: 'privacy', label: 'Privacy', icon: 'lock' },
]

// ─── Mock User (for settings page) ─────────────────────────────

export const MOCK_USER_SETTINGS = {
  name: 'Alex Rivera',
  username: 'alex_dev',
  email: 'alex.rivera@gmail.com',
  bio: 'Solana developer building DeFi on-chain. Learning Anchor + Rust full-time. LatAm crypto native.',
  avatar: null as string | null,
  location: 'São Paulo, Brazil',
  website: 'https://alexdev.xyz',
  socials: {
    twitter: 'alex_dev',
    github: 'alexrivera',
    linkedin: 'alex-rivera-dev',
    telegram: 'alexdev_sol',
  },
  language: 'en',
  profileVisibility: 'public' as 'public' | 'private',
}
