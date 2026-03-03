export const user = {
  name: 'Alex Rivera',
  level: 7,
  xp: 4280,
  xpToNext: 5000,
  rank: 142,
  streak: 12,
  tier: 'Gold',
}

export const courses = [
  {
    id: 1,
    title: 'Solana Fundamentals',
    progress: 65,
    nextLesson: 'Program Derived Addresses',
    cur: 15,
    total: 22,
    colorClass: 'text-green-primary',
    diff: 'Beginner',
  },
  {
    id: 2,
    title: 'Anchor Framework Mastery',
    progress: 28,
    nextLesson: 'Account Validation',
    cur: 8,
    total: 34,
    colorClass: 'text-green-mint',
    diff: 'Intermediate',
  },
  {
    id: 3,
    title: 'Building DeFi on Solana',
    progress: 10,
    nextLesson: 'AMM Architecture',
    cur: 3,
    total: 28,
    colorClass: 'text-amber',
    diff: 'Advanced',
  },
]

export const streakWeeks = [
  [1, 1, 1, 1, 1, 0, 1],
  [1, 1, 1, 1, 0, 1, 1],
  [1, 1, 1, 1, 1, 1, 0],
  [1, 1, 1, 1, 2, 0, 0],
]

export const badges = [
  { id: 1, name: 'First Deploy', icon: '🚀', earned: true, xp: 100 },
  { id: 2, name: 'Streak x7', icon: '🔥', earned: true, xp: 150 },
  { id: 3, name: 'DeFi Pioneer', icon: '⚡', earned: true, xp: 300 },
  { id: 4, name: 'Code Warrior', icon: '⚔️', earned: true, xp: 200 },
  { id: 5, name: 'NFT Builder', icon: '🎨', earned: false, xp: 250 },
  { id: 6, name: 'Validator Pro', icon: '🛡️', earned: false, xp: 400 },
]

export const recommended = [
  {
    id: 1,
    title: 'NFT Marketplace Development',
    xp: 900,
    lessons: 18,
    match: 98,
  },
  {
    id: 2,
    title: 'Solana Token Program Deep Dive',
    xp: 750,
    lessons: 14,
    match: 94,
  },
  {
    id: 3,
    title: 'Cross-Program Invocations',
    xp: 1100,
    lessons: 20,
    match: 89,
  },
]

export const feed = [
  {
    id: 1,
    text: 'Completed "Transaction Lifecycle"',
    time: '2h ago',
    xp: 50,
    colorClass: 'bg-green-primary',
  },
  {
    id: 2,
    text: 'Earned "Code Warrior" badge',
    time: '5h ago',
    xp: 200,
    colorClass: 'bg-amber',
  },
  {
    id: 3,
    text: 'Passed Challenge: Build a Vault',
    time: '1d ago',
    xp: 150,
    colorClass: 'bg-green-mint',
  },
  {
    id: 4,
    text: 'Completed "PDAs Explained"',
    time: '1d ago',
    xp: 50,
    colorClass: 'bg-green-primary',
  },
  {
    id: 5,
    text: 'Achieved 10-day streak milestone',
    time: '2d ago',
    xp: 100,
    colorClass: 'bg-amber',
  },
]

export const diffStyle: Record<
  string,
  { bgClass: string; textClass: string; borderClass: string }
> = {
  Beginner: {
    bgClass: 'bg-green-mint/10',
    textClass: 'text-green-primary',
    borderClass: 'border-green-mint/30',
  },
  Intermediate: {
    bgClass: 'bg-amber/10',
    textClass: 'text-amber-dark',
    borderClass: 'border-amber/30',
  },
  Advanced: {
    bgClass: 'bg-green-mint-soft/20',
    textClass: 'text-green-dark',
    borderClass: 'border-green-mint-soft/30',
  },
}
