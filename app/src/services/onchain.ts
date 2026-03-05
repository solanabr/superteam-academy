/**
 * On-chain service — reads XP balances, enrollments, credentials, and leaderboard
 * from the Solana devnet program.
 */

import { PublicKey } from "@solana/web3.js";
import {
  getAccount,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getConnection,
  getReadProgram,
  XP_MINT,
  findCoursePda,
  findEnrollmentPda,
  findAchievementTypePda,
  findAchievementReceiptPda,
} from "@/lib/program";
import type { Credential, LeaderboardEntry } from "@/types/learning";
import { xpToLevel } from "@/lib/utils";

// --- XP Balance (Token-2022) ---

export async function getXpBalance(wallet: PublicKey): Promise<number> {
  const connection = getConnection();
  try {
    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      true,
      TOKEN_2022_PROGRAM_ID,
    );
    const account = await getAccount(
      connection,
      ata,
      "confirmed",
      TOKEN_2022_PROGRAM_ID,
    );
    return Number(account.amount);
  } catch {
    // ATA doesn't exist yet — user has 0 XP
    return 0;
  }
}

// --- Enrollment ---

export interface EnrollmentData {
  course: PublicKey;
  learner: PublicKey;
  lessonFlags: number[];
  enrolledAt: number;
  completedAt: number | null;
  credentialAsset: PublicKey | null;
}

export async function getEnrollment(
  courseId: string,
  learner: PublicKey,
): Promise<EnrollmentData | null> {
  const program = getReadProgram();
  const [enrollmentPda] = findEnrollmentPda(courseId, learner);
  try {
    const account = await program.account.enrollment.fetch(enrollmentPda);
    return {
      course: account.course,
      learner,
      lessonFlags: (
        account.lessonFlags as Array<{ toNumber?: () => number }>
      ).map((n) => (typeof n === "number" ? n : (n.toNumber?.() ?? Number(n)))),
      enrolledAt:
        typeof account.enrolledAt === "number"
          ? account.enrolledAt
          : Number(account.enrolledAt),
      completedAt: account.completedAt ? Number(account.completedAt) : null,
      credentialAsset: account.credentialAsset ?? null,
    };
  } catch {
    return null;
  }
}

export function isLessonCompleted(
  lessonFlags: number[],
  lessonIndex: number,
): boolean {
  const wordIndex = Math.floor(lessonIndex / 64);
  const bitIndex = lessonIndex % 64;
  if (wordIndex >= lessonFlags.length) return false;
  return (lessonFlags[wordIndex] & (1 << bitIndex)) !== 0;
}

export function countCompletedLessons(
  lessonFlags: number[],
  totalLessons: number,
): number {
  let count = 0;
  for (let i = 0; i < totalLessons; i++) {
    if (isLessonCompleted(lessonFlags, i)) count++;
  }
  return count;
}

// --- Course (on-chain) ---

export interface CourseOnChain {
  courseId: string;
  creator: PublicKey;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  isActive: boolean;
  totalCompletions: number;
  totalEnrollments: number;
}

export async function getCourseOnChain(
  courseId: string,
): Promise<CourseOnChain | null> {
  const program = getReadProgram();
  const [coursePda] = findCoursePda(courseId);
  try {
    const account = await program.account.course.fetch(coursePda);
    return {
      courseId: account.courseId,
      creator: account.creator,
      lessonCount: account.lessonCount,
      difficulty: account.difficulty,
      xpPerLesson:
        typeof account.xpPerLesson === "number"
          ? account.xpPerLesson
          : Number(account.xpPerLesson),
      trackId: account.trackId,
      trackLevel: account.trackLevel,
      prerequisite: account.prerequisite ?? null,
      isActive: account.isActive,
      totalCompletions:
        typeof account.totalCompletions === "number"
          ? account.totalCompletions
          : Number(account.totalCompletions),
      totalEnrollments:
        typeof account.totalEnrollments === "number"
          ? account.totalEnrollments
          : Number(account.totalEnrollments),
    };
  } catch {
    return null;
  }
}

// --- Leaderboard (RPC scan of XP token holders) ---

export async function getLeaderboardFromChain(): Promise<LeaderboardEntry[]> {
  const connection = getConnection();

  try {
    // Get all token accounts for the XP mint (Token-2022)
    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        filters: [
          { dataSize: 165 },
          { memcmp: { offset: 0, bytes: XP_MINT.toBase58() } },
        ],
      },
    );

    const entries: LeaderboardEntry[] = [];

    for (const { account } of accounts) {
      const parsed = (
        account.data as {
          parsed?: {
            info?: { tokenAmount?: { uiAmount?: number }; owner?: string };
          };
        }
      ).parsed;
      if (!parsed?.info) continue;

      const xp = parsed.info.tokenAmount?.uiAmount ?? 0;
      if (xp <= 0) continue;

      const owner = parsed.info.owner ?? "";
      const short =
        owner.length > 8 ? `${owner.slice(0, 4)}...${owner.slice(-4)}` : owner;

      entries.push({
        rank: 0,
        userId: owner,
        username: short,
        avatarUrl: null,
        xp,
        level: xpToLevel(xp),
        streak: 0,
      });
    }

    entries.sort((a, b) => b.xp - a.xp);
    entries.forEach((e, i) => {
      e.rank = i + 1;
    });

    return entries;
  } catch {
    return [];
  }
}

// --- Credentials (Metaplex Core NFTs via Helius DAS API) ---

const HELIUS_RPC =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC ??
  "https://api.devnet.solana.com";
const CREDENTIAL_COLLECTION =
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "";

interface DasAsset {
  id: string;
  content?: {
    metadata?: { name?: string; description?: string; symbol?: string };
    json_uri?: string;
    links?: { image?: string };
  };
  grouping?: Array<{ group_key: string; group_value: string }>;
  ownership?: { owner?: string };
  creators?: Array<{ address: string }>;
  attributes?: {
    attributeList?: Array<{ trait_type: string; value: string }>;
  };
}

export async function getCredentialsForWallet(
  wallet: PublicKey,
): Promise<Credential[]> {
  try {
    // Use Helius DAS API getAssetsByOwner
    const response = await fetch(HELIUS_RPC, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "credentials",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: wallet.toBase58(),
          page: 1,
          limit: 100,
          displayOptions: { showCollectionMetadata: true },
        },
      }),
    });

    const data = await response.json();
    const items: DasAsset[] = data?.result?.items ?? [];

    // Filter by credential collection if configured
    const credentials: Credential[] = [];
    for (const asset of items) {
      // If collection is configured, filter by it
      if (CREDENTIAL_COLLECTION) {
        const inCollection = asset.grouping?.some(
          (g) =>
            g.group_key === "collection" &&
            g.group_value === CREDENTIAL_COLLECTION,
        );
        if (!inCollection) continue;
      } else {
        // Without a collection filter, skip assets that don't look like credentials
        const name = asset.content?.metadata?.name ?? "";
        if (
          !name.toLowerCase().includes("credential") &&
          !name.toLowerCase().includes("certificate")
        )
          continue;
      }

      const attrs = asset.attributes?.attributeList ?? [];
      const trackAttr = attrs.find((a) => a.trait_type === "track_id");
      const levelAttr = attrs.find((a) => a.trait_type === "level");
      const coursesAttr = attrs.find(
        (a) => a.trait_type === "courses_completed",
      );
      const xpAttr = attrs.find((a) => a.trait_type === "total_xp");

      credentials.push({
        mint: asset.id,
        track: trackAttr?.value ?? "general",
        level: levelAttr ? parseInt(levelAttr.value, 10) : 1,
        metadataUri: asset.content?.json_uri ?? "",
        imageUri: asset.content?.links?.image ?? "",
        name: asset.content?.metadata?.name ?? "Credential",
        description: asset.content?.metadata?.description ?? "",
        compressed: false,
        owner: wallet,
        coursesCompleted: coursesAttr
          ? parseInt(coursesAttr.value, 10)
          : undefined,
        totalXp: xpAttr ? parseInt(xpAttr.value, 10) : undefined,
      });
    }

    return credentials;
  } catch {
    // DAS API unavailable or not a Helius RPC — return empty
    return [];
  }
}

// --- Achievements (on-chain reads) ---

export interface AchievementTypeData {
  achievementId: string;
  name: string;
  metadataUri: string;
  xpReward: number;
  currentSupply: number;
  maxSupply: number;
  isActive: boolean;
}

export async function getAchievementType(
  achievementId: string,
): Promise<AchievementTypeData | null> {
  const program = getReadProgram();
  const [pda] = findAchievementTypePda(achievementId);
  try {
    const account = await program.account.achievementType.fetch(pda);
    return {
      achievementId: account.achievementId,
      name: account.name,
      metadataUri: account.metadataUri,
      xpReward:
        typeof account.xpReward === "number"
          ? account.xpReward
          : Number(account.xpReward),
      currentSupply:
        typeof account.currentSupply === "number"
          ? account.currentSupply
          : Number(account.currentSupply),
      maxSupply:
        typeof account.maxSupply === "number"
          ? account.maxSupply
          : Number(account.maxSupply),
      isActive: account.isActive,
    };
  } catch {
    return null;
  }
}

export async function hasAchievementReceipt(
  achievementId: string,
  recipient: PublicKey,
): Promise<boolean> {
  const program = getReadProgram();
  const [pda] = findAchievementReceiptPda(achievementId, recipient);
  try {
    await program.account.achievementReceipt.fetch(pda);
    return true;
  } catch {
    return false;
  }
}

// --- Helper: check if user is enrolled on-chain ---

export async function isEnrolledOnChain(
  courseId: string,
  learner: PublicKey,
): Promise<boolean> {
  const enrollment = await getEnrollment(courseId, learner);
  return enrollment !== null;
}
