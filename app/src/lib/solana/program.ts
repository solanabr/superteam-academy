import { Program, AnchorProvider, type Idl } from "@coral-xyz/anchor";
import { Connection, type PublicKey } from "@solana/web3.js";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import { HELIUS_RPC_URL } from "@/lib/constants";
import IDL_JSON from "./idl/onchain_academy.json";
/** BN-like value returned by Anchor for u64/i64 fields. */
interface BNLike {
  toNumber(): number;
  toString(base?: number): string;
  isZero(): boolean;
  and(b: BNLike): BNLike;
  shln(bits: number): BNLike;
  shrn(bits: number): BNLike;
  clone(): BNLike;
}

/* ------------------------------------------------------------------ */
/*  Typed account shapes returned by program.account.<name>.fetch()   */
/* ------------------------------------------------------------------ */

export interface ConfigAccount {
  authority: PublicKey;
  backendSigner: PublicKey;
  xpMint: PublicKey;
  reserved: number[];
  bump: number;
}

export interface CourseAccount {
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
  createdAt: BNLike;
  updatedAt: BNLike;
  reserved: number[];
  bump: number;
}

export interface EnrollmentAccount {
  course: PublicKey;
  enrolledAt: BNLike;
  completedAt: BNLike | null;
  lessonFlags: BNLike[];
  credentialAsset: PublicKey | null;
  reserved: number[];
  bump: number;
}

interface AccountFetcher<T> {
  fetch(address: PublicKey): Promise<T>;
  all(): Promise<{ publicKey: PublicKey; account: T }[]>;
}

/** Typed accessor for the three program accounts. */
export interface ProgramAccounts {
  config: AccountFetcher<ConfigAccount>;
  course: AccountFetcher<CourseAccount>;
  enrollment: AccountFetcher<EnrollmentAccount>;
}

/**
 * Cast the untyped `program.account` to our known account shapes.
 * This replaces scattered `as any` casts with a single, auditable cast point.
 */
export function getAccounts(program: Program): ProgramAccounts {
  return program.account as unknown as ProgramAccounts;
}

/* ------------------------------------------------------------------ */

export function getConnection(): Connection {
  return new Connection(HELIUS_RPC_URL, "confirmed");
}

export function getProvider(wallet: AnchorWallet): AnchorProvider {
  const connection = getConnection();
  return new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
    preflightCommitment: "confirmed",
  });
}

export function getProgram(wallet: AnchorWallet): Program {
  const provider = getProvider(wallet);
  return new Program(IDL_JSON as Idl, provider);
}

export function getReadonlyProgram(connection?: Connection): Program {
  const conn = connection ?? getConnection();
  return new Program(IDL_JSON as Idl, { connection: conn } as AnchorProvider);
}

export { IDL_JSON };
