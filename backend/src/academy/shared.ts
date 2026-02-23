import type { Program } from "@coral-xyz/anchor";
import { Keypair, PublicKey, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountInstruction,
  getAssociatedTokenAddressSync,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import {
  getAuthorityKeypair,
  getAuthorityProgram,
  getBackendProgram,
  getBackendSignerKeypair,
} from "../program.js";
import {
  getAchievementTypePda,
  getConfigPda,
  getCoursePda,
} from "../pdas.js";
import { badRequest, internalError } from "../lib/errors.js";

export const MPL_CORE_PROGRAM_ID = new PublicKey(
  "CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d"
);

type ConfigAccount = {
  xpMint: PublicKey;
};

type CourseAccount = {
  creator: PublicKey;
};

type AchievementTypeAccount = {
  collection: PublicKey;
};

function accountNotFound(error: unknown): boolean {
  const message = String(error);
  return (
    message.includes("Account does not exist") ||
    message.includes("could not find account")
  );
}

export function requireAuthorityProgram(): Program {
  const program = getAuthorityProgram();
  if (!program) {
    throw internalError("ACADEMY_AUTHORITY_KEYPAIR not configured");
  }
  return program;
}

export function requireBackendProgram(): Program {
  const program = getBackendProgram();
  if (!program) {
    throw internalError("ACADEMY_BACKEND_SIGNER_KEYPAIR not configured");
  }
  return program;
}

export function requireAuthoritySigner(): Keypair {
  const signer = getAuthorityKeypair();
  if (!signer) {
    throw internalError("ACADEMY_AUTHORITY_KEYPAIR not configured");
  }
  return signer;
}

export function requireBackendSigner(): Keypair {
  const signer = getBackendSignerKeypair();
  if (!signer) {
    throw internalError("ACADEMY_BACKEND_SIGNER_KEYPAIR not configured");
  }
  return signer;
}

export function requireProviderPublicKey(program: Program): PublicKey {
  const pubkey = program.provider.publicKey;
  if (!pubkey) {
    throw internalError("Program provider wallet is missing public key");
  }
  return pubkey;
}

export async function fetchConfig(program: Program): Promise<{
  configPda: PublicKey;
  config: ConfigAccount;
}> {
  const configPda = getConfigPda(program.programId);
  const config = await (
    program.account as {
      config: {
        fetch: (pda: PublicKey) => Promise<ConfigAccount>;
      };
    }
  ).config.fetch(configPda);

  return { configPda, config };
}

export async function fetchCourseOrThrow(
  program: Program,
  courseId: string,
  notFoundHint: string
): Promise<{
  coursePda: PublicKey;
  course: CourseAccount;
}> {
  const coursePda = getCoursePda(courseId, program.programId);
  try {
    const course = await (
      program.account as {
        course: {
          fetch: (pda: PublicKey) => Promise<CourseAccount>;
        };
      }
    ).course.fetch(coursePda);
    return { coursePda, course };
  } catch (error) {
    if (accountNotFound(error)) {
      throw badRequest(notFoundHint);
    }
    throw error;
  }
}

export async function fetchAchievementType(
  program: Program,
  achievementId: string
): Promise<{
  achievementTypePda: PublicKey;
  achievementType: AchievementTypeAccount;
}> {
  const achievementTypePda = getAchievementTypePda(
    achievementId,
    program.programId
  );

  const achievementType = await (
    program.account as {
      achievementType: {
        fetch: (pda: PublicKey) => Promise<AchievementTypeAccount>;
      };
    }
  ).achievementType.fetch(achievementTypePda);

  return { achievementTypePda, achievementType };
}

export async function ensureToken2022Ata(
  program: Program,
  mint: PublicKey,
  owner: PublicKey
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const accountInfo = await program.provider.connection.getAccountInfo(ata);
  if (accountInfo) {
    return ata;
  }

  const payer = requireProviderPublicKey(program);
  const createIx = createAssociatedTokenAccountInstruction(
    payer,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID
  );

  const setupTx = new Transaction().add(createIx);
  const providerWithSendAndConfirm = program.provider as {
    sendAndConfirm?: (tx: Transaction) => Promise<string>;
  };

  if (!providerWithSendAndConfirm.sendAndConfirm) {
    throw internalError("Program provider cannot send setup transactions");
  }

  await providerWithSendAndConfirm.sendAndConfirm(setupTx);

  return ata;
}

export async function sendLegacyTransaction(
  program: Program,
  payer: Keypair,
  tx: Transaction,
  signers: Keypair[]
): Promise<string> {
  const latestBlockhash = await program.provider.connection.getLatestBlockhash();
  tx.recentBlockhash = latestBlockhash.blockhash;
  tx.feePayer = payer.publicKey;
  tx.partialSign(...signers, payer);

  const signature = await program.provider.connection.sendRawTransaction(
    tx.serialize()
  );
  await program.provider.connection.confirmTransaction(signature, "confirmed");

  return signature;
}
