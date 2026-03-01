import type { Program } from "@coral-xyz/anchor";
import BN from "bn.js";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { getConfigPda, getCoursePda, getEnrollmentPda } from "@/pdas.js";
import { requireProviderPublicKey } from "@/academy/shared.js";
import { MPL_CORE_PROGRAM_ID } from "@/academy/shared.js";

type IssueCredentialMethods = {
  issueCredential: (
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BN
  ) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      signers: (signers: Keypair[]) => { rpc: () => Promise<string> };
    };
  };
};

type UpgradeCredentialMethods = {
  upgradeCredential: (
    credentialName: string,
    metadataUri: string,
    coursesCompleted: number,
    totalXp: BN
  ) => {
    accountsPartial: (accounts: Record<string, PublicKey>) => {
      rpc: () => Promise<string>;
    };
  };
};

export interface IssueCredentialParams {
  courseId: string;
  learner: PublicKey;
  credentialName: string;
  metadataUri: string;
  trackCollection: PublicKey;
  coursesCompleted: number;
  totalXp: number;
}

export interface UpgradeCredentialParams {
  courseId: string;
  learner: PublicKey;
  credentialAsset: PublicKey;
  credentialName: string;
  metadataUri: string;
  trackCollection: PublicKey;
  coursesCompleted: number;
  totalXp: number;
}

export async function issueCredentialInternal(
  program: Program,
  params: IssueCredentialParams
): Promise<{ tx: string; credentialAsset: PublicKey }> {
  const backendSigner = requireProviderPublicKey(program);
  const configPda = getConfigPda(program.programId);
  const coursePda = getCoursePda(params.courseId, program.programId);
  const enrollmentPda = getEnrollmentPda(
    params.courseId,
    params.learner,
    program.programId
  );
  const payer = requireProviderPublicKey(program);
  const credentialAsset = Keypair.generate();

  const methods = program.methods as unknown as IssueCredentialMethods;
  const tx = await methods
    .issueCredential(
      params.credentialName,
      params.metadataUri,
      params.coursesCompleted,
      new BN(params.totalXp)
    )
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner: params.learner,
      credentialAsset: credentialAsset.publicKey,
      trackCollection: params.trackCollection,
      payer,
      backendSigner,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([credentialAsset])
    .rpc();

  return { tx, credentialAsset: credentialAsset.publicKey };
}

export async function upgradeCredentialInternal(
  program: Program,
  params: UpgradeCredentialParams
): Promise<{ tx: string }> {
  const backendSigner = requireProviderPublicKey(program);
  const configPda = getConfigPda(program.programId);
  const coursePda = getCoursePda(params.courseId, program.programId);
  const enrollmentPda = getEnrollmentPda(
    params.courseId,
    params.learner,
    program.programId
  );
  const payer = requireProviderPublicKey(program);

  const methods = program.methods as unknown as UpgradeCredentialMethods;
  const tx = await methods
    .upgradeCredential(
      params.credentialName,
      params.metadataUri,
      params.coursesCompleted,
      new BN(params.totalXp)
    )
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner: params.learner,
      credentialAsset: params.credentialAsset,
      trackCollection: params.trackCollection,
      payer,
      backendSigner,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .rpc();

  return { tx };
}
