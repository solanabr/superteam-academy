import {
  challengePool,
  type ChallengeDefinition,
  type ChallengeType,
} from "@/lib/data/challenge-pool";

export interface DailyChallenge extends ChallengeDefinition {
  progress: number;
  completed: boolean;
  claimedAt?: string;
}

export interface DailyChallengeState {
  date: string;
  challenges: DailyChallenge[];
}

const CHALLENGES_PER_DAY = 3;
const STORAGE_PREFIX = "stacad:challenges:";

function getTodayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * Deterministic daily selection: hash the date string with a salt,
 * then pick CHALLENGES_PER_DAY unique indices from the pool.
 */
function hashSeed(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const ch = input.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash |= 0;
  }
  return Math.abs(hash);
}

function selectDailyChallenges(date: string): ChallengeDefinition[] {
  const seed = hashSeed(date + "stacad");
  const poolSize = challengePool.length;
  const selected: ChallengeDefinition[] = [];
  const usedIndices = new Set<number>();

  let offset = 0;
  while (selected.length < CHALLENGES_PER_DAY && selected.length < poolSize) {
    const idx = (seed + offset) % poolSize;
    if (!usedIndices.has(idx)) {
      usedIndices.add(idx);
      selected.push(challengePool[idx]);
    }
    offset++;
  }

  return selected;
}

function storageKey(wallet: string, date: string): string {
  return `${STORAGE_PREFIX}${wallet}:${date}`;
}

function loadState(wallet: string, date: string): DailyChallengeState | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(storageKey(wallet, date));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch (error) {
    console.error("[challengeService] Failed to parse challenge state:", error);
    return null;
  }
}

function saveState(wallet: string, state: DailyChallengeState): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(
    storageKey(wallet, state.date),
    JSON.stringify(state),
  );
}

export const challengeService = {
  getDailyChallenges(walletAddress?: string): DailyChallengeState {
    const today = getTodayUTC();

    if (walletAddress) {
      const existing = loadState(walletAddress, today);
      if (existing) return existing;
    }

    const definitions = selectDailyChallenges(today);
    const state: DailyChallengeState = {
      date: today,
      challenges: definitions.map((def) => ({
        ...def,
        progress: 0,
        completed: false,
      })),
    };

    if (walletAddress) {
      saveState(walletAddress, state);
    }

    return state;
  },

  updateProgress(
    walletAddress: string,
    type: ChallengeType,
    increment: number,
  ): void {
    const today = getTodayUTC();
    const state = this.getDailyChallenges(walletAddress);

    if (state.date !== today) return;

    let changed = false;
    for (const challenge of state.challenges) {
      if (challenge.type === type && !challenge.completed) {
        challenge.progress = Math.min(
          challenge.progress + increment,
          challenge.target,
        );
        if (challenge.progress >= challenge.target) {
          challenge.completed = true;
        }
        changed = true;
      }
    }

    if (changed) {
      saveState(walletAddress, state);
    }
  },

  claimReward(walletAddress: string, challengeId: string): number {
    const today = getTodayUTC();
    const state = this.getDailyChallenges(walletAddress);

    if (state.date !== today) return 0;

    const challenge = state.challenges.find((c) => c.id === challengeId);
    if (!challenge || !challenge.completed || challenge.claimedAt) return 0;

    challenge.claimedAt = new Date().toISOString();
    saveState(walletAddress, state);

    return challenge.xpReward;
  },

  getTimeUntilReset(): number {
    const now = new Date();
    const tomorrow = new Date(
      Date.UTC(
        now.getUTCFullYear(),
        now.getUTCMonth(),
        now.getUTCDate() + 1,
        0,
        0,
        0,
        0,
      ),
    );
    return tomorrow.getTime() - now.getTime();
  },
};
