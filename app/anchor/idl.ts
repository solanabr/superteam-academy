import { PublicKey } from "@solana/web3.js";
import { type Idl, type Program } from "@coral-xyz/anchor";
import BN from "bn.js";

// ── IDL re-export ──────────────────────────────────────────────────
export type OnchainAcademy = {
  address: string;
  metadata: { name: string; version: string; spec: string };
  instructions: unknown[];
  accounts: unknown[];
  errors: { code: number; name: string; msg: string }[];
  types: unknown[];
  events: unknown[];
};

import idlJson from "./idl.json";
export const IDL = idlJson as unknown as OnchainAcademy;

// ── On-chain account shapes (mirror IDL "types" section) ───────────
export interface RawCourseAccount {
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
}

export interface RawEnrollmentAccount {
  course: PublicKey;
  enrolledAt: BN;
  completedAt: BN | null;
  lessonFlags: BN[];
  credentialAsset: PublicKey | null;
  bump: number;
}

// ── Typed account accessor ─────────────────────────────────────────
// Anchor's generated types don't work with the spec-0.1.0 IDL format,
// so we cast once here and provide typed accessors to avoid scattered
// `as any` throughout the codebase.

interface CourseAccountMethods {
  all(): Promise<{ publicKey: PublicKey; account: RawCourseAccount }[]>;
  fetch(address: PublicKey): Promise<RawCourseAccount>;
  fetchNullable(address: PublicKey): Promise<RawCourseAccount | null>;
}

interface EnrollmentAccountMethods {
  fetch(address: PublicKey): Promise<RawEnrollmentAccount>;
  fetchNullable(address: PublicKey): Promise<RawEnrollmentAccount | null>;
}

export interface TypedAccountClient {
  course: CourseAccountMethods;
  enrollment: EnrollmentAccountMethods;
}

/** Cast an untyped Anchor Program's `.account` to our typed accessors. */
export function getTypedAccounts(program: Program<Idl>): TypedAccountClient {
  return program.account as unknown as TypedAccountClient;
}
