import { PublicKey } from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { getProgram, connection } from "./program-client";
import { deriveCoursePda, deriveEnrollmentPda } from "./pda";
import { XP_MINT } from "./constants";

export interface OnChainCourse {
  courseId: string;
  creator: string;
  lessonCount: number;
  xpPerLesson: number;
  isActive: boolean;
  totalEnrollments: number;
  totalCompletions: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  version: number;
  difficulty: number;
}

export interface OnChainEnrollment {
  course: string;
  enrolledAt: number;
  completedAt: number | null;
  lessonFlags: bigint[];
  credentialAsset: string | null;
  completedLessonCount: number;
}

export async function fetchAllCourses(): Promise<OnChainCourse[]> {
  const program = getProgram();
  const accounts = await program.account.course.all();

  return accounts.map((a) => {
    const data = a.account;
    return {
      courseId: data.courseId,
      creator: data.creator.toBase58(),
      lessonCount: data.lessonCount,
      xpPerLesson: data.xpPerLesson,
      isActive: data.isActive,
      totalEnrollments: data.totalEnrollments,
      totalCompletions: data.totalCompletions,
      trackId: data.trackId,
      trackLevel: data.trackLevel,
      prerequisite: data.prerequisite?.toBase58() ?? null,
      version: data.version,
      difficulty: data.difficulty,
    };
  });
}

export async function fetchCourse(
  courseId: string,
): Promise<OnChainCourse | null> {
  try {
    const program = getProgram();
    const [pda] = deriveCoursePda(courseId);
    const data = await program.account.course.fetchNullable(pda);
    if (!data) return null;
    return {
      courseId: data.courseId,
      creator: data.creator.toBase58(),
      lessonCount: data.lessonCount,
      xpPerLesson: data.xpPerLesson,
      isActive: data.isActive,
      totalEnrollments: data.totalEnrollments,
      totalCompletions: data.totalCompletions,
      trackId: data.trackId,
      trackLevel: data.trackLevel,
      prerequisite: data.prerequisite?.toBase58() ?? null,
      version: data.version,
      difficulty: data.difficulty,
    };
  } catch {
    return null;
  }
}

export async function fetchEnrollment(
  courseId: string,
  learner: PublicKey,
): Promise<OnChainEnrollment | null> {
  try {
    const program = getProgram();
    const [pda] = deriveEnrollmentPda(courseId, learner);
    const data = await program.account.enrollment.fetchNullable(pda);
    if (!data) return null;

    const flags = data.lessonFlags as (bigint | number)[];
    const bigFlags = flags.map((f) => BigInt(f.toString()));
    let count = 0;
    for (const f of bigFlags) {
      let v = f;
      while (v > 0n) {
        count += Number(v & 1n);
        v >>= 1n;
      }
    }

    return {
      course: data.course.toBase58(),
      enrolledAt: typeof data.enrolledAt === "number"
        ? data.enrolledAt
        : Number(data.enrolledAt),
      completedAt: data.completedAt
        ? (typeof data.completedAt === "number"
            ? data.completedAt
            : Number(data.completedAt))
        : null,
      lessonFlags: bigFlags,
      credentialAsset: data.credentialAsset?.toBase58() ?? null,
      completedLessonCount: count,
    };
  } catch {
    return null;
  }
}

export async function fetchXpBalance(wallet: PublicKey): Promise<number> {
  try {
    const ata = getAssociatedTokenAddressSync(
      XP_MINT,
      wallet,
      true,
      TOKEN_2022_PROGRAM_ID,
    );
    const info = await connection.getTokenAccountBalance(ata);
    return Number(info.value.uiAmount ?? 0);
  } catch {
    return 0;
  }
}

export async function fetchXpLeaderboard(): Promise<
  Array<{ wallet: string; balance: number }>
> {
  try {
    const accounts = await connection.getParsedProgramAccounts(
      TOKEN_2022_PROGRAM_ID,
      {
        filters: [
          { memcmp: { offset: 0, bytes: XP_MINT.toBase58() } },
        ],
      },
    );

    const entries: Array<{ wallet: string; balance: number }> = [];
    for (const acc of accounts) {
      const parsed = (
        acc.account.data as {
          parsed?: {
            info?: {
              owner?: string;
              tokenAmount?: { uiAmount?: number; amount?: string };
            };
          };
        }
      ).parsed;
      if (parsed?.info) {
        const balance = parsed.info.tokenAmount?.uiAmount
          ?? Number(parsed.info.tokenAmount?.amount ?? 0);
        if (balance > 0) {
          entries.push({
            wallet: parsed.info.owner ?? acc.pubkey.toBase58(),
            balance,
          });
        }
      }
    }

    return entries.sort((a, b) => b.balance - a.balance);
  } catch {
    return [];
  }
}
