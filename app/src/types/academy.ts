import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";

export const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID || "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
);
export const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT || "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"
);
export const TOKEN_2022_PROGRAM_ID = new PublicKey(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb"
);
export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);
export const CLUSTER = (process.env.NEXT_PUBLIC_CLUSTER || "devnet") as "devnet" | "mainnet-beta";

export interface ConfigAccount {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
}

export interface CourseAccount {
  courseId: string;
  creator: PublicKey;
  contentTxId: number[];
  lessonCount: number;
  difficulty: number;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  isActive: boolean;
  totalCompletions: number;
  creatorRewardXp: number;
  minCompletionsForReward: number;
}

export interface EnrollmentAccount {
  course: PublicKey;
  learner: PublicKey;
  lessonFlags: BN[];
  completedAt: BN | null;
  enrolledAt: BN;
  credentialAsset: PublicKey | null;
}

export interface Course {
  publicKey: PublicKey;
  courseId: string;
  creator: PublicKey;
  lessonCount: number;
  difficulty: 1 | 2 | 3;
  xpPerLesson: number;
  trackId: number;
  trackLevel: number;
  prerequisite: string | null;
  isActive: boolean;
  totalCompletions: number;
  totalXp: number;
}

export interface Enrollment {
  courseId: string;
  coursePda: PublicKey;
  enrollmentPda: PublicKey;
  lessonFlags: BN[];
  completedLessons: number;
  totalLessons: number;
  isCompleted: boolean;
  enrolledAt: Date;
  completedAt: Date | null;
  credentialAsset: PublicKey | null;
}

export interface LeaderboardEntry {
  wallet: string;
  xpBalance: number;
  rank: number;
  displayName?: string;
}

export interface CredentialNFT {
  address: string;
  name: string;
  imageUri: string;
  trackId: number;
  coursesCompleted: number;
  totalXp: number;
}

export interface Achievement {
  id: string;
  name: string;
  metadataUri: string;
  maxSupply: number;
  currentSupply: number;
  xpReward: number;
  isActive: boolean;
  earned?: boolean;
}

export const DIFFICULTY_LABELS: Record<number, string> = {
  1: "Beginner",
  2: "Intermediate", 
  3: "Advanced",
};

export const DIFFICULTY_COLORS: Record<number, string> = {
  1: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  2: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  3: "bg-rose-500/10 text-rose-400 border-rose-500/20",
};

export const TRACK_NAMES: Record<number, string> = {
  1: "Anchor Development",
  2: "DeFi Protocols",
  3: "NFT & Metaplex",
  4: "Client Development",
  5: "Security & Auditing",
};
