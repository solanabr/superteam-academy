import { Router, Request, Response } from "express";

function serializeError(err: unknown): string {
  if (err instanceof Error) {
    const logs = (err as unknown as { logs?: string[] }).logs;
    if (logs?.length) return `${err.message || "AnchorError"}\n${logs.join("\n")}`;
    return err.message || err.toString() || JSON.stringify(err);
  }
  return String(err);
}
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getProgram,
  getTrackCollection,
  getCredentialMeta,
  MPL_CORE_PROGRAM_ID,
} from "../program";
import { findConfigPDA, findCoursePDA, findEnrollmentPDA } from "../pda";

const router = Router();

// ─── POST /credentials/issue ──────────────────────────────────────────────────

interface IssueBody {
  courseId: string;
  learnerWallet: string;
  /** Optional overrides — if omitted, backend derives from trackId */
  credentialName?: string;
  metadataUri?: string;
  coursesCompleted?: number;
  totalXp?: number;
}

router.post(
  "/issue",
  async (req: Request<object, object, IssueBody>, res: Response) => {
    const {
      courseId,
      learnerWallet,
      credentialName,
      metadataUri,
      coursesCompleted,
      totalXp,
    } = req.body;

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
      const { program, backendKeypair } = getProgram();

      const [configPda] = findConfigPDA();
      const [coursePda] = findCoursePDA(courseId);
      const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const course = await (program as any).account.course.fetch(coursePda) as any;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrollment = await (program as any).account.enrollment.fetch(enrollmentPda) as any;

      if (!enrollment.completedAt) {
        res.status(400).json({ error: "Course not finalized yet" });
        return;
      }

      const trackId: number = course.trackId as number;
      const trackCollection = getTrackCollection(trackId);

      if (!trackCollection) {
        res.status(400).json({
          error: `No track collection configured for trackId ${trackId}`,
        });
        return;
      }

      const meta = getCredentialMeta(
        trackId,
        coursesCompleted ?? 1,
        totalXp ?? 0
      );
      const name = credentialName ?? meta.name;
      const uri = metadataUri ?? meta.uri;

      let signature: string;
      let credentialAsset: string;

      if (!enrollment.credentialAsset) {
        // Issue new credential NFT
        const assetKp = Keypair.generate();

        signature = await program.methods
          .issueCredential(name, uri, meta.coursesCompleted, new BN(meta.totalXp))
          .accountsPartial({
            config: configPda,
            course: coursePda,
            enrollment: enrollmentPda,
            learner,
            credentialAsset: assetKp.publicKey,
            trackCollection,
            payer: backendKeypair.publicKey,
            backendSigner: backendKeypair.publicKey,
            mplCoreProgram: MPL_CORE_PROGRAM_ID,
            systemProgram: SystemProgram.programId,
          })
          .signers([backendKeypair, assetKp])
          .rpc();

        credentialAsset = assetKp.publicKey.toBase58();
      } else {
        // Upgrade existing credential
        const existingAsset = new PublicKey(
          enrollment.credentialAsset as PublicKey
        );

        signature = await program.methods
          .upgradeCredential(name, uri, meta.coursesCompleted, new BN(meta.totalXp))
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

        credentialAsset = existingAsset.toBase58();
      }

      res.json({ success: true, signature, credentialAsset });
    } catch (err: unknown) {
      const msg = serializeError(err);
      console.error("[backend] credentials error:", msg);
      res.status(500).json({ error: msg });
    }
  }
);

export default router;
