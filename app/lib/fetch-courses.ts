import { Connection } from "@solana/web3.js";
import { Program } from "@coral-xyz/anchor";
import type { CourseAccount } from "@/hooks/use-courses";
import IDL from "@/anchor/idl.json";

const RPC_URL =
  process.env.HELIUS_URL ||
  process.env.NEXT_PUBLIC_HELIUS_URL ||
  "https://api.devnet.solana.com";

let cached: { data: CourseAccount[]; ts: number } | null = null;
const TTL = 30_000;

export async function fetchCourses(): Promise<CourseAccount[]> {
  if (cached && Date.now() - cached.ts < TTL) return cached.data;

  try {
    const connection = new Connection(RPC_URL);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(IDL as any, { connection });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const all: any[] = await (program.account as any).course.all();

    const courses: CourseAccount[] = all
      .filter((c) => c.account.isActive)
      .map((c) => ({
        publicKey: c.publicKey.toBase58(),
        courseId: c.account.courseId,
        creator: c.account.creator.toBase58(),
        lessonCount: c.account.lessonCount,
        difficulty: c.account.difficulty,
        xpPerLesson: c.account.xpPerLesson,
        trackId: c.account.trackId,
        trackLevel: c.account.trackLevel,
        prerequisite: c.account.prerequisite?.toBase58() ?? null,
        creatorRewardXp: c.account.creatorRewardXp,
        totalCompletions: c.account.totalCompletions,
        totalEnrollments: c.account.totalEnrollments,
        isActive: c.account.isActive,
        createdAt: c.account.createdAt
          ? (c.account.createdAt as unknown as { toNumber(): number }).toNumber()
          : 0,
      }));

    cached = { data: courses, ts: Date.now() };
    return courses;
  } catch {
    return cached?.data ?? [];
  }
}
