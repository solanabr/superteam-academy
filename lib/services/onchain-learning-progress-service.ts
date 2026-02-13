import { clusterApiUrl, Connection, PublicKey } from '@solana/web3.js';
import {
  AccountLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
  getMint
} from '@solana/spl-token';
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

interface ProgressApiResponse {
  progress: Progress;
}

interface EnrollmentApiResponse {
  enrolled: boolean;
}

interface XpApiResponse {
  xp: number;
}

interface StreakApiResponse {
  streak: StreakData;
}

interface LeaderboardApiResponse {
  leaderboard: LeaderboardEntry[];
}

interface MintRuntimeConfig {
  programId: PublicKey;
  decimals: number;
}

const PLACEHOLDER_XP_MINT = 'So11111111111111111111111111111111111111112';
const LEADERBOARD_CACHE_TTL_MS = 60_000;
const leaderboardCache = new Map<Timeframe, { expiresAt: number; entries: LeaderboardEntry[] }>();

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

function decodeAmount(rawAmount: Uint8Array | bigint | number): bigint {
  if (typeof rawAmount === 'bigint') {
    return rawAmount;
  }

  if (typeof rawAmount === 'number') {
    if (!Number.isFinite(rawAmount) || rawAmount <= 0) {
      return 0n;
    }

    return BigInt(Math.floor(rawAmount));
  }

  let value = 0n;
  for (let index = 0; index < rawAmount.length; index += 1) {
    value += BigInt(rawAmount[index] ?? 0) << (8n * BigInt(index));
  }
  return value;
}

async function resolveMintRuntimeConfig(
  connection: Connection,
  mint: PublicKey
): Promise<MintRuntimeConfig | null> {
  try {
    const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_2022_PROGRAM_ID);
    return {
      programId: TOKEN_2022_PROGRAM_ID,
      decimals: mintInfo.decimals
    };
  } catch {
    // Fallback to legacy SPL token program when Token-2022 lookup fails.
  }

  try {
    const mintInfo = await getMint(connection, mint, 'confirmed', TOKEN_PROGRAM_ID);
    return {
      programId: TOKEN_PROGRAM_ID,
      decimals: mintInfo.decimals
    };
  } catch {
    return null;
  }
}

async function fetchIndexedOnchainLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[] | null> {
  const now = Date.now();
  const cached = leaderboardCache.get(timeframe);
  if (cached && cached.expiresAt > now) {
    return cached.entries;
  }

  const mint = getXpMintAddress();
  if (!mint) {
    return null;
  }

  try {
    const connection = getConnection();
    const mintConfig = await resolveMintRuntimeConfig(connection, mint);
    if (!mintConfig) {
      return null;
    }

    const rawTokenAccounts = await connection.getProgramAccounts(mintConfig.programId, {
      commitment: 'confirmed',
      filters: [
        { memcmp: { offset: 0, bytes: mint.toBase58() } }
      ]
    });

    if (rawTokenAccounts.length === 0) {
      return [];
    }

    const divisor = 10n ** BigInt(mintConfig.decimals);
    const xpByWallet = new Map<string, number>();

    rawTokenAccounts.forEach((accountItem) => {
      const decoded = AccountLayout.decode(accountItem.account.data);
      const owner = new PublicKey(decoded.owner).toBase58();
      const amountRaw = decodeAmount(decoded.amount);

      if (amountRaw <= 0n) {
        return;
      }

      const amount = Number(amountRaw / divisor);
      if (!Number.isFinite(amount) || amount <= 0) {
        return;
      }

      xpByWallet.set(owner, (xpByWallet.get(owner) ?? 0) + Math.floor(amount));
    });

    const aliases = parseLeaderboardAliases();
    const entries = [...xpByWallet.entries()]
      .map(([wallet, baseXP]) => {
        const adjustedXP = deriveTimeframeXP(baseXP, timeframe);
        return {
          userId: wallet,
          username: aliases.get(wallet) ?? compactAddress(wallet),
          avatarUrl: '/avatars/default.png',
          xp: adjustedXP,
          level: levelFromXP(adjustedXP),
          streak: 0
        };
      })
      .filter((entry) => entry.xp > 0)
      .sort((a, b) => b.xp - a.xp)
      .map((entry, index) => ({
        rank: index + 1,
        ...entry
      }));

    leaderboardCache.set(timeframe, {
      expiresAt: now + LEADERBOARD_CACHE_TTL_MS,
      entries
    });

    return entries;
  } catch {
    return null;
  }
}

function withSearch(pathname: string, query: Record<string, string | undefined>): string {
  const params = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value.length > 0) {
      params.set(key, value);
    }
  });

  const encoded = params.toString();
  return encoded.length > 0 ? `${pathname}?${encoded}` : pathname;
}

async function fetchApi<T>(path: string, init?: RequestInit): Promise<T | null> {
  try {
    const response = await fetch(path, {
      credentials: 'include',
      cache: 'no-store',
      ...init
    });

    if (!response.ok) {
      return null;
    }

    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function postApi<T>(path: string, body: Record<string, unknown>): Promise<T | null> {
  return fetchApi<T>(path, {
    method: 'POST',
    headers: {
      'content-type': 'application/json'
    },
    body: JSON.stringify(body)
  });
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

    const today = new Date().toISOString().split('T')[0] ?? '';

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

export class OnchainLearningProgressService implements LearningProgressService {
  constructor(private readonly fallback: LearningProgressService = localLearningProgressService) {}

  async getProgress(userId: string, courseId: string): Promise<Progress> {
    const payload = await fetchApi<ProgressApiResponse>(
      withSearch('/api/learning/progress', {
        userId,
        courseId
      })
    );

    if (payload?.progress) {
      return payload.progress;
    }

    return this.fallback.getProgress(userId, courseId);
  }

  async enrollCourse(userId: string, courseId: string): Promise<void> {
    const payload = await postApi<{ ok?: boolean }>('/api/learning/enroll', {
      userId,
      courseId
    });

    if (payload?.ok) {
      return;
    }

    await this.fallback.enrollCourse(userId, courseId);
  }

  async getEnrollment(userId: string, courseId: string): Promise<boolean> {
    const payload = await fetchApi<EnrollmentApiResponse>(
      withSearch('/api/learning/enrollment', {
        userId,
        courseId
      })
    );

    if (typeof payload?.enrolled === 'boolean') {
      return payload.enrolled;
    }

    return this.fallback.getEnrollment(userId, courseId);
  }

  async completeLesson(userId: string, courseId: string, lessonIndex: number): Promise<void> {
    const payload = await postApi<{ ok?: boolean }>('/api/learning/complete-lesson', {
      userId,
      courseId,
      lessonIndex
    });

    if (payload?.ok) {
      return;
    }

    await this.fallback.completeLesson(userId, courseId, lessonIndex);
  }

  async getXP(userId: string): Promise<number> {
    const wallet = safePublicKey(userId);
    if (wallet) {
      const onchainXP = await fetchOnchainXP(wallet);
      if (onchainXP !== null) {
        return onchainXP;
      }
    }

    const directPayload = await fetchApi<XpApiResponse>(
      withSearch('/api/learning/xp', {
        userId
      })
    );

    if (typeof directPayload?.xp === 'number') {
      return directPayload.xp;
    }

    if (wallet) {
      const sessionPayload = await fetchApi<XpApiResponse>('/api/learning/xp');
      if (typeof sessionPayload?.xp === 'number') {
        return sessionPayload.xp;
      }
    }

    return this.fallback.getXP(userId);
  }

  async getStreak(userId: string): Promise<StreakData> {
    const payload = await fetchApi<StreakApiResponse>(
      withSearch('/api/learning/streak', {
        userId
      })
    );

    if (payload?.streak) {
      return payload.streak;
    }

    return this.fallback.getStreak(userId);
  }

  async getLeaderboard(timeframe: Timeframe): Promise<LeaderboardEntry[]> {
    const indexedLeaderboard = await fetchIndexedOnchainLeaderboard(timeframe);
    if (indexedLeaderboard && indexedLeaderboard.length > 0) {
      return indexedLeaderboard;
    }

    const walletStrings = (process.env.NEXT_PUBLIC_LEADERBOARD_WALLETS ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);

    if (walletStrings.length > 0) {
      const aliases = parseLeaderboardAliases();
      const walletKeys = walletStrings
        .map((wallet) => safePublicKey(wallet))
        .filter((wallet): wallet is PublicKey => wallet !== null);

      if (walletKeys.length > 0) {
        const rawEntries = await Promise.all(
          walletKeys.map(async (walletKey) => {
            const wallet = walletKey.toBase58();
            const xp = await fetchOnchainXP(walletKey);
            const resolvedXP = xp ?? 0;
            const adjustedXP = deriveTimeframeXP(resolvedXP, timeframe);

            return {
              userId: wallet,
              username: aliases.get(wallet) ?? compactAddress(wallet),
              avatarUrl: '/avatars/default.png',
              xp: adjustedXP,
              level: levelFromXP(adjustedXP),
              streak: 0
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
    }

    const payload = await fetchApi<LeaderboardApiResponse>(
      withSearch('/api/learning/leaderboard', {
        timeframe
      })
    );

    if (Array.isArray(payload?.leaderboard)) {
      return payload.leaderboard;
    }

    return this.fallback.getLeaderboard(timeframe);
  }

  async getCredentials(wallet: PublicKey): Promise<Credential[]> {
    const onchainCredentials = await fetchCredentialsFromDas(wallet);

    if (onchainCredentials !== null) {
      return onchainCredentials;
    }

    return this.fallback.getCredentials(wallet);
  }
}

export const onchainLearningProgressService = new OnchainLearningProgressService();
