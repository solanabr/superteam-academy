import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import { localLearningProgressService } from '@/lib/services/local-learning-progress-service';
import { LearningProgressService } from '@/lib/services/learning-progress-service';
import { Credential, LeaderboardEntry, Progress, StreakData, Timeframe } from '@/lib/types';
import { levelFromXP } from '@/lib/utils';

interface DasAsset {
  id: string;
  compression?: {
    compressed?: boolean;
  };
  content?: {
    metadata?: {
      name?: string;
      attributes?: Array<{
        trait_type?: string;
        value?: string | number;
      }>;
    };
    json_uri?: string;
  };
  mutable?: boolean;
}

interface DasResponse {
  result?: {
    items?: DasAsset[];
  };
}

const PLACEHOLDER_XP_MINT = 'So11111111111111111111111111111111111111112';

function getConnection(): Connection {
  const endpoint = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl('devnet');
  return new Connection(endpoint, 'confirmed');
}

function safePublicKey(value: string): PublicKey | null {
  try {
    return new PublicKey(value);
  } catch {
    return null;
  }
}

function getXpMintAddress(): PublicKey | null {
  const mint = process.env.NEXT_PUBLIC_XP_MINT_ADDRESS?.trim();
  if (!mint || mint === PLACEHOLDER_XP_MINT) {
    return null;
  }

  return safePublicKey(mint);
}

function getDasEndpoint(): string | null {
  const endpoint = process.env.NEXT_PUBLIC_DAS_RPC_URL;
  return endpoint && endpoint.length > 0 ? endpoint : null;
}

function compactAddress(value: string): string {
  if (value.length <= 10) {
    return value;
  }

  return `${value.slice(0, 4)}...${value.slice(-4)}`;
}

function deriveTimeframeXP(baseXP: number, timeframe: Timeframe): number {
  if (timeframe === 'alltime') {
    return baseXP;
  }

  if (timeframe === 'monthly') {
    return Math.max(0, Math.floor(baseXP * 0.65));
  }

  return Math.max(0, Math.floor(baseXP * 0.3));
}

function parseLeaderboardAliases(): Map<string, string> {
  const raw = process.env.NEXT_PUBLIC_LEADERBOARD_ALIASES ?? '';
  const map = new Map<string, string>();

  raw
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean)
    .forEach((entry) => {
      const [wallet, alias] = entry.split(':').map((item) => item.trim());
      if (wallet && alias) {
        map.set(wallet, alias);
      }
    });

  return map;
}

async function fetchOnchainXP(owner: PublicKey): Promise<number | null> {
  const mint = getXpMintAddress();
  if (!mint) {
    return null;
  }

  try {
    const connection = getConnection();
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(owner, { mint }, 'confirmed');

    const total = tokenAccounts.value.reduce((acc, item) => {
      const amountInfo = item.account.data.parsed.info.tokenAmount;
      const amountRaw = Number(amountInfo.amount);
      const decimals = Number(amountInfo.decimals);

      if (!Number.isFinite(amountRaw) || !Number.isFinite(decimals)) {
        return acc;
      }

      return acc + amountRaw / 10 ** decimals;
    }, 0);

    return Math.floor(total);
  } catch {
    return null;
  }
}

async function fetchCredentialsFromDas(owner: PublicKey): Promise<Credential[] | null> {
  const endpoint = getDasEndpoint();
  if (!endpoint) {
    return null;
  }

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json'
      },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 'superteam-academy',
        method: 'getAssetsByOwner',
        params: {
          ownerAddress: owner.toBase58(),
          page: 1,
          limit: 50,
          displayOptions: {
            showCollectionMetadata: true,
            showUnverifiedCollections: true
          }
        }
      }),
      cache: 'no-store'
    });

    if (!response.ok) {
      return null;
    }

    const payload = (await response.json()) as DasResponse;
    const items = payload.result?.items ?? [];
    const compressedAssets = items.filter((asset) => asset.compression?.compressed);

    if (compressedAssets.length === 0) {
      return [];
    }

    const today = new Date().toISOString().split('T')[0];

    return compressedAssets.map((asset) => {
      const attributes = asset.content?.metadata?.attributes ?? [];
      const levelAttribute = attributes.find(
        (attribute) => attribute.trait_type?.toLowerCase() === 'level'
      );
      const level = Number(levelAttribute?.value ?? 0);

      return {
        id: asset.id,
        walletAddress: owner.toBase58(),
        track: asset.content?.metadata?.name ?? 'Superteam Learning Track',
        level: Number.isFinite(level) ? level : 0,
        status: asset.mutable ? 'in_progress' : 'completed',
        mintAddress: asset.id,
        explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
        issuedAt: today,
        metadataUri: asset.content?.json_uri ?? ''
      };
    });
  } catch {
    return null;
  }
}

export class HybridLearningProgressService implements LearningProgressService {
  constructor(private readonly localService: LearningProgressService = localLearningProgressService) {}

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    return this.localService.getProgress(userId, courseId);
  }

  async enrollCourse(userId: string, courseId: string): Promise<void> {
    await this.localService.enrollCourse(userId, courseId);
  }

  async getEnrollment(userId: string, courseId: string): Promise<boolean> {
    return this.localService.getEnrollment(userId, courseId);
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    await this.localService.completeLesson(userId, courseId, lessonIndex);
  }

  async getXP(userId: string): Promise<number> {
    const wallet = safePublicKey(userId);
    if (!wallet) {
      return this.localService.getXP(userId);
    }

    const onchainXP = await fetchOnchainXP(wallet);
    if (onchainXP === null) {
      return this.localService.getXP(userId);
    }

    return onchainXP;
  }

  async getStreak(userId: string): Promise<StreakData> {
    return this.localService.getStreak(userId);
  }

  async getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    const walletStrings = (process.env.NEXT_PUBLIC_LEADERBOARD_WALLETS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (walletStrings.length === 0) {
      return this.localService.getLeaderboard(timeframe);
    }

    const aliases = parseLeaderboardAliases();
    const walletKeys = walletStrings
      .map((wallet) => safePublicKey(wallet))
      .filter((wallet): wallet is PublicKey => wallet !== null);

    if (walletKeys.length === 0) {
      return this.localService.getLeaderboard(timeframe);
    }

    const rawEntries = await Promise.all(
      walletKeys.map(async (walletKey) => {
        const wallet = walletKey.toBase58();
        const xp = await fetchOnchainXP(walletKey);
        const fallbackXP = await this.localService.getXP(wallet);
        const streak = await this.localService.getStreak(wallet);

        const resolvedXP = xp === null ? fallbackXP : xp;
        const adjustedXP = deriveTimeframeXP(resolvedXP, timeframe);

        return {
          userId: wallet,
          username: aliases.get(wallet) ?? compactAddress(wallet),
          avatarUrl: '/avatars/default.png',
          xp: adjustedXP,
          level: levelFromXP(adjustedXP),
          streak: streak.current
        };
      })
    );

    return rawEntries
      .sort((a, b) => b.xp - a.xp)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    const onchainCredentials = await fetchCredentialsFromDas(wallet);

    if (onchainCredentials === null || onchainCredentials.length === 0) {
      return this.localService.getCredentials(wallet);
    }

    return onchainCredentials;
  }
}

export const hybridLearningProgressService = new HybridLearningProgressService();
