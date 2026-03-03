import { Router, Request, Response } from "express";
import { tryAwardAchievement } from "./achievements";

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    // AnchorError has .logs[] with the program logs
    const logs = (err as unknown as { logs?: string[] }).logs;
    if (logs?.length) return `${err.message || "AnchorError"}\n${logs.join("\n")}`;
    return err.message || err.toString() || JSON.stringify(err);
  }
  return String(err);
}
import {
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
} from "@solana/spl-token";
import { BN } from "@coral-xyz/anchor";
import {
  getProgram,
  getXpMint,
  getTrackCollection,
  getCredentialMeta,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "../program";
import { findConfigPDA, findCoursePDA, findEnrollmentPDA } from "../pda";

const router = Router();

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Ensure a Token-2022 ATA exists, creating it if necessary. Returns the ATA pubkey. */
async function ensureAta(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payer: any,
  owner: PublicKey,
  mint: PublicKey
): Promise<PublicKey> {
  const ata = getAssociatedTokenAddressSync(
    mint,
    owner,
    false,
    TOKEN_2022_PROGRAM_ID
  );

  const info = await connection.getAccountInfo(ata);
  if (info) return ata;

  const ix = createAssociatedTokenAccountInstruction(
    payer.publicKey,
    ata,
    owner,
    mint,
    TOKEN_2022_PROGRAM_ID
  );
  const tx = new Transaction().add(ix);
  const { blockhash, lastValidBlockHeight } =
    await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;
  tx.feePayer = payer.publicKey;
  tx.sign(payer);
  const sig = await connection.sendRawTransaction(tx.serialize());
  await connection.confirmTransaction(
    { signature: sig, blockhash, lastValidBlockHeight },
    "confirmed"
  );

  return ata;
}

// ─── POST /lessons/complete ───────────────────────────────────────────────────

interface CompleteBody {
  courseId: string;
  lessonIndex: number;
  learnerWallet: string;
}

router.post(
  "/complete",
  async (req: Request<object, object, CompleteBody>, res: Response) => {
    const { courseId, lessonIndex, learnerWallet } = req.body;

    if (!courseId || lessonIndex === undefined || !learnerWallet) {
      res.status(400).json({ error: "Missing courseId, lessonIndex, or learnerWallet" });
      return;
    }

    let learner: PublicKey;
    try {
      learner = new PublicKey(learnerWallet);
    } catch {
      res.status(400).json({ error: "Invalid learnerWallet pubkey" });
      return;
    }

    try {
      const { program, backendKeypair, connection } = getProgram();
      const xpMint = getXpMint();

      const [configPda] = findConfigPDA();
      const [coursePda] = findCoursePDA(courseId);
      const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

      // Ensure learner has a Token-2022 XP ATA
      const learnerXpAta = await ensureAta(
        connection,
        backendKeypair,
        learner,
        xpMint
      );

      // Submit complete_lesson
      const signature = await program.methods
        .completeLesson(lessonIndex)
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount: learnerXpAta,
          xpMint,
          backendSigner: backendKeypair.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([backendKeypair])
        .rpc();

      // Auto-award XP milestone + first-lesson achievements (best-effort)
      const awarded: Array<{ id: string; asset: string }> = [];
      try {
        const xpBalance = await connection.getTokenAccountBalance(learnerXpAta);
        const currentXp = xpBalance.value.uiAmount ?? 0;

        const toAward = ["first-lesson"];
        if (currentXp >= 100) toAward.push("xp-100");
        if (currentXp >= 500) toAward.push("xp-500");
        if (currentXp >= 1000) toAward.push("xp-1000");
        if (currentXp >= 2500) toAward.push("xp-2500");

        const results = await Promise.all(
          toAward.map(async (id) => {
            const r = await tryAwardAchievement(id, learnerWallet);
            return r.awarded && r.asset ? { id, asset: r.asset } : null;
          })
        );
        awarded.push(...results.filter((r): r is { id: string; asset: string } => r !== null));
      } catch {
        // best-effort
      }

      res.json({ success: true, signature, achievements: awarded });
    } catch (err: unknown) {
      const msg = serializeError(err);
      console.error("[backend] error:", msg);
      res.status(500).json({ error: msg });
    }
  }
);

// ─── POST /lessons/finalize ───────────────────────────────────────────────────

interface FinalizeBody {
  courseId: string;
  learnerWallet: string;
}

router.post(
  "/finalize",
  async (req: Request<object, object, FinalizeBody>, res: Response) => {
    const { courseId, learnerWallet } = req.body;

    if (!courseId || !learnerWallet) {
      res.status(400).json({ error: "Missing courseId or learnerWallet" });
      return;
    }

    let learner: PublicKey;
    try {
      learner = new PublicKey(learnerWallet);
    } catch {
      res.status(400).json({ error: "Invalid learnerWallet pubkey" });
      return;
    }

    try {
      const { program, backendKeypair, connection } = getProgram();
      const xpMint = getXpMint();

      const [configPda] = findConfigPDA();
      const [coursePda] = findCoursePDA(courseId);
      const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const course = await (program as any).account.course.fetch(coursePda) as any;

      const result = await finalizeCourseInternal(
        program,
        backendKeypair,
        connection,
        xpMint,
        courseId,
        learner,
        coursePda,
        enrollmentPda,
        configPda,
        course
      );

      // Auto-award first-course achievement (best-effort)
      const achievements: Array<{ id: string; asset: string }> = [];
      try {
        const r = await tryAwardAchievement("first-course", learnerWallet);
        if (r.awarded && r.asset) achievements.push({ id: "first-course", asset: r.asset });
      } catch {
        // best-effort
      }

      res.json({ success: true, ...result, achievements });
    } catch (err: unknown) {
      const msg = serializeError(err);
      console.error("[backend] error:", msg);
      res.status(500).json({ error: msg });
    }
  }
);

// ─── Shared finalize + issue_credential logic ─────────────────────────────────

async function finalizeCourseInternal(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  backendKeypair: any,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any,
  xpMint: PublicKey,
  courseId: string,
  learner: PublicKey,
  coursePda: PublicKey,
  enrollmentPda: PublicKey,
  configPda: PublicKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  course: any
): Promise<{
  finalized: boolean;
  finalizeSignature?: string;
  credentialSignature?: string;
  credentialAsset?: string;
}> {
  const creator: PublicKey = course.creator as PublicKey;

  const [learnerXpAta, creatorXpAta] = await Promise.all([
    ensureAta(connection, backendKeypair, learner, xpMint),
    ensureAta(connection, backendKeypair, creator, xpMint),
  ]);

  const finalizeSignature: string = await program.methods
    .finalizeCourse()
    .accountsPartial({
      config: configPda,
      course: coursePda,
      enrollment: enrollmentPda,
      learner,
      learnerTokenAccount: learnerXpAta,
      creatorTokenAccount: creatorXpAta,
      creator,
      xpMint,
      backendSigner: backendKeypair.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([backendKeypair])
    .rpc();

  // ── Issue or upgrade credential ───────────────────────────────────────────
  let credentialSignature: string | undefined;
  let credentialAssetPubkey: string | undefined;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrollment = await (program as any).account.enrollment.fetch(enrollmentPda) as any;
    const trackId: number = course.trackId as number;
    const trackCollection = getTrackCollection(trackId);

    if (trackCollection) {
      const meta = getCredentialMeta(trackId, 1, 0);

      if (!enrollment.credentialAsset) {
        // First credential for this track — issue new NFT
        const { Keypair: KP } = await import("@solana/web3.js");
        const credentialAsset = KP.generate();

        credentialSignature = await program.methods
          .issueCredential(
            meta.name,
            meta.uri,
            meta.coursesCompleted,
            new BN(meta.totalXp)
          )
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner,
            credentialAsset: credentialAsset.publicKey,
            trackCollection,
            payer: backendKeypair.publicKey,
            backendSigner: backendKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([backendKeypair, credentialAsset])
          .rpc();

        credentialAssetPubkey = credentialAsset.publicKey.toBase58();
      } else {
        // Upgrade existing credential
        const existingAsset = new PublicKey(enrollment.credentialAsset as PublicKey);

        credentialSignature = await program.methods
          .upgradeCredential(
            meta.name,
            meta.uri,
            meta.coursesCompleted,
            new BN(meta.totalXp)
          )
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner,
            credentialAsset: existingAsset,
            trackCollection,
            payer: backendKeypair.publicKey,
            backendSigner: backendKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([backendKeypair])
          .rpc();

        credentialAssetPubkey = existingAsset.toBase58();
      }
    }
  } catch {
    // Credential issuance is best-effort if collection not configured
  }

  return {
    finalized: true,
    finalizeSignature,
    credentialSignature,
    credentialAsset: credentialAssetPubkey,
  };
}

export default router;
