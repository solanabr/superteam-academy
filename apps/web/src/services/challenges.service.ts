export type ChallengeDifficulty = 'easy' | 'medium' | 'hard';
export type ChallengeStatus = 'completed' | 'in-progress' | 'not-started' | 'expired';
export type ChallengeType = 'daily' | 'weekly' | 'seasonal';

export interface Challenge {
  id: string;
  title: string;
  description: string;
  type: ChallengeType;
  difficulty: ChallengeDifficulty;
  xpReward: number;
  timeLimit: number; // minutes
  status: ChallengeStatus;
  expiresAt: string;
  completedAt: string | null;
  tags: string[];
}

export interface SeasonalEvent {
  id: string;
  nameKey: string;
  descriptionKey: string;
  startDate: string;
  endDate: string;
  challenges: Challenge[];
  totalXP: number;
  completedXP: number;
  badgeImageUrl: string | null;
}

const STORAGE_KEY = 'superteam-challenges';

function tomorrow(): string {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  return d.toISOString();
}

function nextWeek(): string {
  const d = new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}

const SEED_CHALLENGES: Challenge[] = [
  {
    id: 'daily-1',
    title: 'Token Balance Checker',
    description: 'Write a function that fetches and displays the SOL balance of a given wallet address using @solana/web3.js.',
    type: 'daily',
    difficulty: 'easy',
    xpReward: 50,
    timeLimit: 30,
    status: 'not-started',
    expiresAt: tomorrow(),
    completedAt: null,
    tags: ['solana', 'web3.js'],
  },
  {
    id: 'daily-2',
    title: 'PDA Derivation',
    description: 'Derive a Program Derived Address (PDA) from given seeds and a program ID.',
    type: 'daily',
    difficulty: 'medium',
    xpReward: 100,
    timeLimit: 45,
    status: 'not-started',
    expiresAt: tomorrow(),
    completedAt: null,
    tags: ['solana', 'anchor'],
  },
  {
    id: 'daily-3',
    title: 'Instruction Data Serialization',
    description: 'Serialize instruction data using Borsh encoding for a custom Solana program.',
    type: 'daily',
    difficulty: 'hard',
    xpReward: 200,
    timeLimit: 60,
    status: 'not-started',
    expiresAt: tomorrow(),
    completedAt: null,
    tags: ['rust', 'borsh'],
  },
  {
    id: 'weekly-1',
    title: 'Build a Token Faucet',
    description: 'Create a full token faucet that mints SPL tokens to requesting wallets on devnet.',
    type: 'weekly',
    difficulty: 'medium',
    xpReward: 500,
    timeLimit: 180,
    status: 'not-started',
    expiresAt: nextWeek(),
    completedAt: null,
    tags: ['solana', 'spl-token'],
  },
  {
    id: 'weekly-2',
    title: 'NFT Metadata Viewer',
    description: 'Build a component that reads and displays NFT metadata from a mint address using Metaplex.',
    type: 'weekly',
    difficulty: 'hard',
    xpReward: 750,
    timeLimit: 240,
    status: 'not-started',
    expiresAt: nextWeek(),
    completedAt: null,
    tags: ['metaplex', 'nft'],
  },
];

const SEASONAL_EVENTS: SeasonalEvent[] = [
  {
    id: 'solana-summer-2025',
    nameKey: 'solanaSummer',
    descriptionKey: 'solanaSummerDesc',
    startDate: '2025-06-01',
    endDate: '2025-08-31',
    challenges: [],
    totalXP: 5000,
    completedXP: 0,
    badgeImageUrl: null,
  },
  {
    id: 'hackathon-season-2025',
    nameKey: 'hackathonSeason',
    descriptionKey: 'hackathonSeasonDesc',
    startDate: '2025-09-01',
    endDate: '2025-11-30',
    challenges: [],
    totalXP: 8000,
    completedXP: 0,
    badgeImageUrl: null,
  },
];

function getChallenges(): Challenge[] {
  if (typeof window === 'undefined') return SEED_CHALLENGES;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(SEED_CHALLENGES));
    return SEED_CHALLENGES;
  }
  return JSON.parse(stored) as Challenge[];
}

function saveChallenges(challenges: Challenge[]): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(challenges));
  }
}

export const challengesService = {
  async getChallenges(type?: ChallengeType): Promise<Challenge[]> {
    const all = getChallenges();
    return type ? all.filter((c) => c.type === type) : all;
  },

  async getSeasonalEvents(): Promise<SeasonalEvent[]> {
    return SEASONAL_EVENTS;
  },

  async startChallenge(id: string): Promise<void> {
    const challenges = getChallenges();
    const ch = challenges.find((c) => c.id === id);
    if (ch) {
      ch.status = 'in-progress';
      saveChallenges(challenges);
    }
  },

  async completeChallenge(id: string): Promise<void> {
    const challenges = getChallenges();
    const ch = challenges.find((c) => c.id === id);
    if (ch) {
      ch.status = 'completed';
      ch.completedAt = new Date().toISOString();
      saveChallenges(challenges);
    }
  },

  async getDailyChallenge(): Promise<Challenge | null> {
    const challenges = getChallenges();
    return challenges.find((c) => c.type === 'daily' && c.status !== 'completed') ?? null;
  },
};
