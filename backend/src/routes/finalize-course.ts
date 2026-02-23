import { Request, Response } from "express";
import { PublicKey, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { getBackendSigner, getConnection, getProgramId, getXpMint, TOKEN_2022 } from "../lib/config";
import { BackendWallet } from "../lib/backend-wallet";
import { sendWithRetry } from "../lib/send-tx";
import { isRateLimited } from "../lib/rate-limit";

export async function finalizeCourseHandler(req: Request, res: Response) {
  try {
    const { courseId, learnerPubkey } = req.body;

    if (!courseId || typeof courseId !== "string" || courseId.length > 32)
      return res.status(400).json({ error: "Invalid courseId" });
    if (!learnerPubkey || typeof learnerPubkey !== "string")
      return res.status(400).json({ error: "Invalid learnerPubkey" });

    let learner: PublicKey;
    try { learner = new PublicKey(learnerPubkey); }
    catch { return res.status(400).json({ error: "Invalid pubkey format" }); }

    if (isRateLimited(req, `finalize:${learnerPubkey}:${courseId}`))
      return res.status(429).json({ error: "Rate limited" });

    const connection = getConnection();
    const backendSigner = getBackendSigner();
    const programId = getProgramId();
    const xpMint = getXpMint();

    const provider = new AnchorProvider(connection, new BackendWallet(backendSigner) as any, { commitment: "confirmed" });
    const program = new Program(require("../../idl.json") as any, provider) as any;

    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], programId);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], programId);

    const course = await program.account.course.fetch(coursePda);
    const creator = course.creator;

    const learnerXpAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022);
    const creatorXpAta = getAssociatedTokenAddressSync(xpMint, creator, false, TOKEN_2022);

    const tx = new Transaction();
    try { await getAccount(connection, creatorXpAta, "confirmed", TOKEN_2022); }
    catch { tx.add(createAssociatedTokenAccountInstruction(backendSigner.publicKey, creatorXpAta, creator, xpMint, TOKEN_2022)); }

    const ix = await program.methods
      .finalizeCourse()
      .accountsPartial({
        config: configPda, course: coursePda, enrollment: enrollmentPda,
        learner, learnerTokenAccount: learnerXpAta,
        creatorTokenAccount: creatorXpAta, creator, xpMint,
        backendSigner: backendSigner.publicKey, tokenProgram: TOKEN_2022,
      })
      .instruction();
    tx.add(ix);

    const signature = await sendWithRetry(connection, tx, [backendSigner]);
    res.json({ signature });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("CourseAlreadyFinalized")) return res.status(409).json({ error: "Course already finalized" });
    if (msg.includes("CourseNotCompleted")) return res.status(400).json({ error: "Not all lessons completed" });
    console.error("finalize-course error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
