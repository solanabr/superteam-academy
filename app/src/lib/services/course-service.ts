import { ACADEMY_AUTHORITY } from "@/lib/solana/constants";
import { connection } from "@/lib/solana/program";
import { mockCourses } from "@/lib/data/mock-courses";
import type { Course } from "@/types";
import {
  SystemProgram,
  Transaction,
  type PublicKey,
} from "@solana/web3.js";

export interface WalletEnrollmentSigner {
  publicKey: PublicKey;
  sendTransaction: (
    transaction: Transaction,
    connectionArg: typeof connection,
    options?: Record<string, unknown>,
  ) => Promise<string>;
}

export interface CourseService {
  getAllCourses(): Promise<Course[]>;
  getCourseBySlug(slug: string): Promise<Course | null>;
  searchCourses(query: string, difficulty?: Course["difficulty"]): Promise<Course[]>;
  enrollInCourse(signer: WalletEnrollmentSigner, courseId: string): Promise<string>;
}

class LocalCourseService implements CourseService {
  async getAllCourses(): Promise<Course[]> {
    return mockCourses;
  }

  async getCourseBySlug(slug: string): Promise<Course | null> {
    return mockCourses.find((course) => course.slug === slug) ?? null;
  }

  async searchCourses(
    query: string,
    difficulty?: Course["difficulty"],
  ): Promise<Course[]> {
    const normalized = query.trim().toLowerCase();
    return mockCourses.filter((course) => {
      const matchesDifficulty = difficulty ? course.difficulty === difficulty : true;
      const matchesQuery =
        normalized.length === 0 ||
        course.title.toLowerCase().includes(normalized) ||
        course.tags.some((tag) => tag.toLowerCase().includes(normalized));
      return matchesDifficulty && matchesQuery;
    });
  }

  async enrollInCourse(
    signer: WalletEnrollmentSigner,
    courseId: string,
  ): Promise<string> {
    void courseId;
    const { blockhash } = await connection.getLatestBlockhash("confirmed");
    const tx = new Transaction({
      feePayer: signer.publicKey,
      recentBlockhash: blockhash,
    }).add(
      SystemProgram.transfer({
        fromPubkey: signer.publicKey,
        toPubkey: ACADEMY_AUTHORITY,
        lamports: 0,
      }),
    );

    const signature = await signer.sendTransaction(tx, connection, {
      skipPreflight: false,
      preflightCommitment: "confirmed",
    });

    await connection.confirmTransaction(signature, "confirmed");
    return signature;
  }
}

export const courseService: CourseService = new LocalCourseService();
