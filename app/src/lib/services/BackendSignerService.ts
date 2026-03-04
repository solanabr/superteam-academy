import "server-only";
import { Connection, Keypair, Transaction, VersionedTransaction, PublicKey, SystemProgram, sendAndConfirmTransaction } from "@solana/web3.js";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import type { Wallet } from "@coral-xyz/anchor/dist/cjs/provider";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { SOLANA_RPC_URL, TOKEN_2022_PROGRAM_ID, MPL_CORE_PROGRAM_ID } from "@/lib/solana/constants";
import { getConfigPda, getCoursePda, getEnrollmentPda, getAchievementTypePda, getAchievementReceiptPda, getMinterRolePda } from "@/lib/solana/pdas";
import { getTypedMethods, getTypedAccounts } from "@/lib/solana/typed-program";

let _backendKeypair: Keypair | null = null;
let _backendConnection: Connection | null = null;
let _backendProgram: Program | null = null;

function getBackendKeypair(): Keypair {
  if (!_backendKeypair) {
    const raw = process.env.BACKEND_SIGNER_KEYPAIR;
    if (!raw) throw new Error("Server configuration error");
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      throw new Error(
        "BACKEND_SIGNER_KEYPAIR is not valid JSON. Expected a JSON array of numbers (e.g. [1,2,3,...])."
      );
    }
    if (!Array.isArray(parsed) || parsed.length !== 64 || !parsed.every((n) => typeof n === "number")) {
      throw new Error(
        "BACKEND_SIGNER_KEYPAIR must be a JSON array of exactly 64 numbers."
      );
    }
    _backendKeypair = Keypair.fromSecretKey(Uint8Array.from(parsed));
  }
  return _backendKeypair;
}

function getBackendConnection(): Connection {
  if (!_backendConnection) {
    _backendConnection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return _backendConnection;
}

async function getBackendProgram(): Promise<Program> {
  if (!_backendProgram) {
    const idl = (await import("@/lib/solana/idl/onchain_academy.json")).default as Idl;
    const connection = getBackendConnection();
    const keypair = getBackendKeypair();
    const wallet: Wallet = {
      publicKey: keypair.publicKey,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => {
        if (tx instanceof Transaction) {
          tx.partialSign(keypair);
        } else {
          tx.sign([keypair]);
        }
        return tx;
      },
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => {
        txs.forEach((tx) => {
          if (tx instanceof Transaction) {
            tx.partialSign(keypair);
          } else {
            tx.sign([keypair]);
          }
        });
        return txs;
      },
    };

    const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });

    _backendProgram = new Program(idl, provider);
  }
  return _backendProgram;
}

async function ensureAtaExists(
  connection: Connection,
  payer: Keypair,
  owner: PublicKey,
  mint: PublicKey,
): Promise<void> {
  const ata = getAssociatedTokenAddressSync(mint, owner, false, TOKEN_2022_PROGRAM_ID);
  const info = await connection.getAccountInfo(ata);
  if (info) return;

  try {
    const ix = createAssociatedTokenAccountInstruction(
      payer.publicKey,
      ata,
      owner,
      mint,
      TOKEN_2022_PROGRAM_ID,
      ASSOCIATED_TOKEN_PROGRAM_ID,
    );
    const tx = new Transaction().add(ix);
    await sendAndConfirmTransaction(connection, tx, [payer], { commitment: "confirmed" });
  } catch (error: unknown) {
    // TOCTOU: another concurrent request may have created the ATA between
    // our getAccountInfo check and our creation attempt. Re-check existence.
    const recheck = await connection.getAccountInfo(ata);
    if (!recheck) {
      throw error;
    }
    // ATA now exists — creation succeeded concurrently, safe to continue.
  }
}

export async function completeLesson(
  learner: PublicKey,
  courseId: string,
  lessonIndex: number,
  xpMint: PublicKey
): Promise<string> {
  const program = await getBackendProgram();
  const keypair = getBackendKeypair();
  const connection = getBackendConnection();
  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);
  const learnerAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022_PROGRAM_ID);

  await ensureAtaExists(connection, keypair, learner, xpMint);

  return await getTypedMethods(program)
    .completeLesson(lessonIndex)
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      learnerTokenAccount: learnerAta,
      xpMint,
      backendSigner: keypair.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([keypair])
    .rpc();
}

export async function awardAchievement(
  achievementId: string,
  recipient: PublicKey,
  xpMint: PublicKey
): Promise<string> {
  const program = await getBackendProgram();
  const keypair = getBackendKeypair();
  const connection = getBackendConnection();

  const [configPda] = getConfigPda();
  const [achievementTypePda] = getAchievementTypePda(achievementId);
  const [achievementReceiptPda] = getAchievementReceiptPda(achievementId, recipient);
  const [minterRolePda] = getMinterRolePda(keypair.publicKey);

  // Fetch the AchievementType account to get the collection pubkey
  const achievementType = await getTypedAccounts(program).achievementType.fetchNullable(achievementTypePda);
  if (!achievementType) {
    throw new Error(`Achievement type not found: ${achievementId}`);
  }
  const collection = achievementType.collection;

  // Generate a new keypair for the NFT asset
  const assetKeypair = Keypair.generate();

  const recipientTokenAccount = getAssociatedTokenAddressSync(xpMint, recipient, false, TOKEN_2022_PROGRAM_ID);
  await ensureAtaExists(connection, keypair, recipient, xpMint);

  return await getTypedMethods(program)
    .awardAchievement()
    .accountsPartial({
      config: configPda,
      achievementType: achievementTypePda,
      achievementReceipt: achievementReceiptPda,
      minterRole: minterRolePda,
      asset: assetKeypair.publicKey,
      collection,
      recipient,
      recipientTokenAccount,
      xpMint,
      payer: keypair.publicKey,
      minter: keypair.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair, assetKeypair])
    .rpc();
}

export async function finalizeCourse(
  learner: PublicKey,
  courseId: string,
  creator: PublicKey,
  xpMint: PublicKey
): Promise<string> {
  const program = await getBackendProgram();
  const keypair = getBackendKeypair();
  const connection = getBackendConnection();
  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);
  const learnerAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022_PROGRAM_ID);
  const creatorAta = getAssociatedTokenAddressSync(xpMint, creator, false, TOKEN_2022_PROGRAM_ID);

  // Parallelize independent ATA creation calls
  await Promise.all([
    ensureAtaExists(connection, keypair, learner, xpMint),
    ensureAtaExists(connection, keypair, creator, xpMint),
  ]);

  return await getTypedMethods(program)
    .finalizeCourse()
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      learnerTokenAccount: learnerAta,
      creatorTokenAccount: creatorAta,
      creator,
      xpMint,
      backendSigner: keypair.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([keypair])
    .rpc();
}

export async function issueCredential(
  learner: PublicKey,
  courseId: string,
  trackCollection: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: bigint
): Promise<{ signature: string; credentialAsset: string }> {
  const program = await getBackendProgram();
  const keypair = getBackendKeypair();

  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  // Generate a new keypair for the credential NFT asset
  const credentialAssetKeypair = Keypair.generate();

  const sig = await getTypedMethods(program)
    .issueCredential(credentialName, metadataUri, coursesCompleted, totalXp)
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      credentialAsset: credentialAssetKeypair.publicKey,
      trackCollection,
      payer: keypair.publicKey,
      backendSigner: keypair.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair, credentialAssetKeypair])
    .rpc();

  return { signature: sig, credentialAsset: credentialAssetKeypair.publicKey.toBase58() };
}

export async function upgradeCredential(
  learner: PublicKey,
  courseId: string,
  trackCollection: PublicKey,
  existingAsset: PublicKey,
  newName: string,
  newUri: string,
  coursesCompleted: number,
  totalXp: bigint
): Promise<string> {
  const program = await getBackendProgram();
  const keypair = getBackendKeypair();

  const [configPda] = getConfigPda();
  const [coursePda] = getCoursePda(courseId);
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);

  return await getTypedMethods(program)
    .upgradeCredential(newName, newUri, coursesCompleted, totalXp)
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      credentialAsset: existingAsset,
      trackCollection,
      payer: keypair.publicKey,
      backendSigner: keypair.publicKey,
      mplCoreProgram: MPL_CORE_PROGRAM_ID,
      systemProgram: SystemProgram.programId,
    })
    .signers([keypair])
    .rpc();
}
