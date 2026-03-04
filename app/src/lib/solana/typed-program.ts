/**
 * Typed wrapper for the Anchor Program object.
 *
 * Centralizes all `as unknown as` casts in ONE file so the rest of the
 * codebase accesses program accounts, methods, and the coder through
 * fully-typed accessors with zero `as any`.
 */

import type { Program } from "@coral-xyz/anchor";
import type { PublicKey, Transaction } from "@solana/web3.js";
import type {
  ConfigAccount,
  CourseAccount,
  EnrollmentAccount,
  AchievementTypeAccount,
  MinterRoleAccount,
  AchievementReceiptAccount,
} from "@/types/program";

/* ---------- Account client shapes ---------- */

interface AccountFetcher<T> {
  fetch(address: PublicKey): Promise<T>;
  fetchNullable(address: PublicKey): Promise<T | null>;
  all(): Promise<{ publicKey: PublicKey; account: T }[]>;
}

export interface TypedAccounts {
  config: AccountFetcher<ConfigAccount>;
  course: AccountFetcher<CourseAccount>;
  enrollment: AccountFetcher<EnrollmentAccount>;
  achievementType: AccountFetcher<AchievementTypeAccount>;
  minterRole: AccountFetcher<MinterRoleAccount>;
  achievementReceipt: AccountFetcher<AchievementReceiptAccount>;
}

/* ---------- Method builder shapes ---------- */

interface MethodBuilder {
  accountsPartial(accounts: Record<string, PublicKey>): MethodBuilder;
  remainingAccounts(
    accounts: { pubkey: PublicKey; isWritable: boolean; isSigner: boolean }[]
  ): MethodBuilder;
  signers(signers: { publicKey: PublicKey }[]): MethodBuilder;
  transaction(): Promise<Transaction>;
  rpc(): Promise<string>;
}

export interface TypedMethods {
  enroll(courseId: string): MethodBuilder;
  completeLesson(lessonIndex: number): MethodBuilder;
  finalizeCourse(): MethodBuilder;
  awardAchievement(): MethodBuilder;
  issueCredential(
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: bigint
  ): MethodBuilder;
  upgradeCredential(
    newName: string,
    newUri: string,
    coursesCompleted: number,
    totalXp: bigint
  ): MethodBuilder;
}

/* ---------- Coder shape ---------- */

export interface TypedAccountsCoder {
  decode<T>(accountName: string, data: Buffer): T;
}

export interface TypedCoder {
  accounts: TypedAccountsCoder;
}

/* ---------- Typed accessor functions ---------- */

export function getTypedAccounts(program: Program): TypedAccounts {
  return program.account as unknown as TypedAccounts;
}

export function getTypedMethods(program: Program): TypedMethods {
  return program.methods as unknown as TypedMethods;
}

export function getTypedCoder(program: Program): TypedCoder {
  return program.coder as unknown as TypedCoder;
}
