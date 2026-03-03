// ─── Profile Page Mock Data ──────────────────────────────────

export const profileUser = {
  name: 'Alex Rivera',
  handle: 'alex_sol',
  avatar:
    'https://api.dicebear.com/9.x/notionists/svg?seed=Alex&backgroundColor=c0aede',
  bio: 'Full-stack Solana developer building the future of decentralized finance. Anchor maximalist. Open-source contributor & educator.',
  joinDate: 'September 2024',
  level: 7,
  xp: 4280,
  xpToNext: 5000,
  rank: 142,
  tier: 'Gold',
  streak: 12,
  socials: {
    github: 'https://github.com/alexrivera',
    twitter: 'https://twitter.com/alex_sol',
    website: 'https://alexrivera.dev',
  },
}

export const skillRadarData = [
  { label: 'Rust', value: 72 },
  { label: 'Anchor', value: 85 },
  { label: 'Frontend', value: 68 },
  { label: 'Security', value: 55 },
  { label: 'DeFi', value: 40 },
  { label: 'NFTs', value: 62 },
]

export const profileBadges = [
  {
    id: 1,
    name: 'First Deploy',
    icon: '🚀',
    earned: true,
    earnedDate: 'Oct 2024',
    rarity: 'Common',
    xp: 100,
  },
  {
    id: 2,
    name: 'Streak x7',
    icon: '🔥',
    earned: true,
    earnedDate: 'Oct 2024',
    rarity: 'Common',
    xp: 150,
  },
  {
    id: 3,
    name: 'DeFi Pioneer',
    icon: '⚡',
    earned: true,
    earnedDate: 'Nov 2024',
    rarity: 'Rare',
    xp: 300,
  },
  {
    id: 4,
    name: 'Code Warrior',
    icon: '⚔️',
    earned: true,
    earnedDate: 'Dec 2024',
    rarity: 'Rare',
    xp: 200,
  },
  {
    id: 5,
    name: 'Anchor Master',
    icon: '⚓',
    earned: true,
    earnedDate: 'Jan 2025',
    rarity: 'Epic',
    xp: 500,
  },
  {
    id: 6,
    name: 'Security Sage',
    icon: '🛡️',
    earned: false,
    earnedDate: null,
    rarity: 'Legendary',
    xp: 750,
  },
  {
    id: 7,
    name: 'NFT Artisan',
    icon: '🎨',
    earned: false,
    earnedDate: null,
    rarity: 'Epic',
    xp: 400,
  },
  {
    id: 8,
    name: 'Full Stack',
    icon: '🏗️',
    earned: false,
    earnedDate: null,
    rarity: 'Legendary',
    xp: 1000,
  },
]

export const onChainCredentials = [
  {
    id: 1,
    track: 'Solana Core',
    level: 'Advanced',
    evolutionStage: 3,
    evolutionLabel: 'Dragon',
    mintAddress: '7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    verified: true,
    solscanUrl:
      'https://solscan.io/token/7xKXtg2CW87d97TXJSDpbD5jBkheTqA83TZRuJosgAsU',
    image: '🐉',
    xpEarned: 2500,
  },
  {
    id: 2,
    track: 'Anchor Development',
    level: 'Intermediate',
    evolutionStage: 2,
    evolutionLabel: 'Hatchling',
    mintAddress: '3JUSTxPbDVpS5y2KmE9fVnVYP1GnRo9aFWo6UsPiY7rT',
    verified: true,
    solscanUrl:
      'https://solscan.io/token/3JUSTxPbDVpS5y2KmE9fVnVYP1GnRo9aFWo6UsPiY7rT',
    image: '🐲',
    xpEarned: 1200,
  },
  {
    id: 3,
    track: 'DeFi Protocols',
    level: 'Beginner',
    evolutionStage: 1,
    evolutionLabel: 'Egg',
    mintAddress: '9aNfbQDnMk3dSMHR5cGrVfuPwnRmCVqs7gNFTggKsEA3',
    verified: false,
    solscanUrl:
      'https://solscan.io/token/9aNfbQDnMk3dSMHR5cGrVfuPwnRmCVqs7gNFTggKsEA3',
    image: '🥚',
    xpEarned: 450,
  },
]

export const completedCourses = [
  {
    id: 1,
    title: 'Introduction to Blockchain',
    difficulty: 'Beginner',
    xpEarned: 500,
    completedDate: 'Oct 15, 2024',
    lessons: 12,
    duration: '4 hours',
  },
  {
    id: 2,
    title: 'Solana Fundamentals',
    difficulty: 'Beginner',
    xpEarned: 850,
    completedDate: 'Nov 22, 2024',
    lessons: 22,
    duration: '8 hours',
  },
  {
    id: 3,
    title: 'Rust for Solana Developers',
    difficulty: 'Intermediate',
    xpEarned: 1100,
    completedDate: 'Dec 18, 2024',
    lessons: 28,
    duration: '12 hours',
  },
  {
    id: 4,
    title: 'Anchor Framework Mastery',
    difficulty: 'Intermediate',
    xpEarned: 1200,
    completedDate: 'Jan 30, 2025',
    lessons: 34,
    duration: '14 hours',
  },
  {
    id: 5,
    title: 'Token Program Deep Dive',
    difficulty: 'Advanced',
    xpEarned: 950,
    completedDate: 'Feb 20, 2025',
    lessons: 18,
    duration: '10 hours',
  },
]

export const rarityColors: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Common: {
    bg: 'rgba(139,109,56,0.08)',
    text: 'hsl(var(--text-secondary))',
    border: 'hsl(var(--border-warm))',
  },
  Rare: {
    bg: 'rgba(0,140,76,0.1)',
    text: 'hsl(var(--green-primary))',
    border: 'rgba(0,140,76,0.25)',
  },
  Epic: {
    bg: 'rgba(138,79,255,0.1)',
    text: '#8a4fff',
    border: 'rgba(138,79,255,0.25)',
  },
  Legendary: {
    bg: 'rgba(255,210,63,0.12)',
    text: 'hsl(var(--amber-dark))',
    border: 'rgba(255,210,63,0.3)',
  },
}

export const difficultyStyle: Record<
  string,
  { bg: string; text: string; border: string }
> = {
  Beginner: {
    bg: 'hsl(var(--green-mint) / 0.1)',
    text: 'hsl(var(--green-primary))',
    border: 'hsl(var(--green-mint) / 0.3)',
  },
  Intermediate: {
    bg: 'hsl(var(--amber) / 0.1)',
    text: 'hsl(var(--amber-dark))',
    border: 'hsl(var(--amber) / 0.3)',
  },
  Advanced: {
    bg: 'hsl(var(--green-mint-soft) / 0.2)',
    text: 'hsl(var(--green-dark))',
    border: 'hsl(var(--green-mint-soft) / 0.3)',
  },
}
