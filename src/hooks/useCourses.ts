"use client";

import { useQuery } from "@tanstack/react-query";
import { useConnection } from "@solana/wallet-adapter-react";
import { AnchorProvider, Program, BN } from "@coral-xyz/anchor";
import { PublicKey, Keypair } from "@solana/web3.js";
import { IDL } from "@/lib/idl";
import { PROGRAM_ID } from "@/lib/anchor";

export interface CourseAccount {
  publicKey: PublicKey;
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  version: number;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: PublicKey | null;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
  createdAt: BN;
  updatedAt: BN;
  bump: number;
  source?: "onchain" | "content";
}

// Anchor 0.31 returns camelCase; older IDL versions may return snake_case.
// Accept both to be resilient against version mismatches.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function normalizeCourse(a: any, publicKey: PublicKey): CourseAccount {
  return {
    publicKey,
    courseId: a.courseId ?? a.course_id,
    creator: a.creator,
    contentTxId: a.contentTxId ?? a.content_tx_id,
    version: a.version,
    lessonCount: a.lessonCount ?? a.lesson_count,
    difficulty: a.difficulty,
    xpPerLesson: a.xpPerLesson ?? a.xp_per_lesson,
    trackId: a.trackId ?? a.track_id,
    trackLevel: a.trackLevel ?? a.track_level,
    prerequisite: a.prerequisite ?? null,
    creatorRewardXp: a.creatorRewardXp ?? a.creator_reward_xp,
    minCompletionsForReward:
      a.minCompletionsForReward ?? a.min_completions_for_reward,
    totalCompletions: a.totalCompletions ?? a.total_completions,
    totalEnrollments: a.totalEnrollments ?? a.total_enrollments,
    isActive: a.isActive ?? a.is_active,
    createdAt: a.createdAt ?? a.created_at,
    updatedAt: a.updatedAt ?? a.updated_at,
    bump: a.bump,
  };
}

function makeDummyProvider(
  connection: ConstructorParameters<typeof AnchorProvider>[0],
) {
  const dummyWallet = {
    publicKey: Keypair.generate().publicKey,
    signTransaction: async <T>(tx: T) => tx,
    signAllTransactions: async <T>(txs: T[]) => txs,
  };
  return new AnchorProvider(connection, dummyWallet, {
    commitment: "confirmed",
  });
}

type CatalogFallbackItem = {
  courseId: string;
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  creatorRewardXp: number;
  minCompletionsForReward: number;
  totalCompletions: number;
  totalEnrollments: number;
  isActive: boolean;
};

function mapFallbackToCourse(item: CatalogFallbackItem): CourseAccount {
  const [publicKey] = PublicKey.findProgramAddressSync(
    [Buffer.from("course"), Buffer.from(item.courseId)],
    PROGRAM_ID,
  );
  const now = new BN(Math.floor(Date.now() / 1000));
  return {
    publicKey,
    courseId: item.courseId,
    creator: Keypair.generate().publicKey,
    contentTxId: [],
    version: 1,
    lessonCount: item.lessonCount,
    difficulty: item.difficulty,
    xpPerLesson: item.xpPerLesson,
    trackId: item.trackId,
    trackLevel: item.trackLevel,
    prerequisite: null,
    creatorRewardXp: item.creatorRewardXp,
    minCompletionsForReward: item.minCompletionsForReward,
    totalCompletions: item.totalCompletions,
    totalEnrollments: item.totalEnrollments,
    isActive: item.isActive,
    createdAt: now,
    updatedAt: now,
    bump: 255,
    source: "content",
  };
}

async function fetchCatalogFallback(): Promise<CourseAccount[]> {
  const catalogPath: string = "/api/course-catalog";
  const res = await fetch(catalogPath, { cache: "no-store" });
  if (!res.ok) return [];
  const data = (await res.json()) as { courses?: CatalogFallbackItem[] };
  return (data.courses ?? []).map(mapFallbackToCourse);
}

export function useCourses() {
  const { connection } = useConnection();

  return useQuery<CourseAccount[]>({
    queryKey: ["courses", "merged-v1"],
    queryFn: async () => {
      let onchain: CourseAccount[] = [];
      try {
        const provider = makeDummyProvider(connection);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw = await (program.account as any)["course"].all();
        onchain = (
          raw
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            .map((c: any) =>
              normalizeCourse(c.account, c.publicKey as PublicKey),
            )
            .filter((c: CourseAccount) => c.isActive)
            .map((c: CourseAccount) => ({
              ...c,
              source: "onchain" as const,
            }))
        );
      } catch (err) {
        console.warn("[useCourses] on-chain fetch failed, using fallback", err);
      }

      const fallback = await fetchCatalogFallback();
      const merged = new Map<string, CourseAccount>();

      for (const c of onchain) {
        merged.set(c.courseId, c);
      }
      for (const c of fallback) {
        if (!merged.has(c.courseId)) {
          merged.set(c.courseId, c);
        }
      }

      return Array.from(merged.values());
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useCourse(courseId: string) {
  const { connection } = useConnection();

  return useQuery<CourseAccount | null>({
    queryKey: ["course", courseId],
    queryFn: async () => {
      try {
        const [coursePda] = PublicKey.findProgramAddressSync(
          [Buffer.from("course"), Buffer.from(courseId)],
          PROGRAM_ID,
        );
        const provider = makeDummyProvider(connection);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(IDL as any, provider);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const raw: any = await (program.account as any)["course"].fetchNullable(
          coursePda,
        );
        if (raw) {
          return {
            ...normalizeCourse(raw, coursePda),
            source: "onchain" as const,
          };
        }
      } catch (err) {
        console.warn("[useCourse] on-chain fetch failed, using fallback", err);
      }

      const fallback = await fetchCatalogFallback();
      return fallback.find((c) => c.courseId === courseId) ?? null;
    },
    staleTime: 5 * 60 * 1000,
    enabled: !!courseId,
  });
}
