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
import { verifyAnswers, hasQuiz as checkQuizExists } from "../lib/quiz-verification";
import { isRateLimited } from "../lib/rate-limit";

export async function completeLessonHandler(req: Request, res: Response) {
  try {
    const { courseId, lessonIndex, answers, learnerPubkey } = req.body;

    if (!courseId || typeof courseId !== "string" || courseId.length > 32)
      return res.status(400).json({ error: "Invalid courseId" });
    if (typeof lessonIndex !== "number" || lessonIndex < 0 || lessonIndex > 255)
      return res.status(400).json({ error: "Invalid lessonIndex" });
    if (!learnerPubkey || typeof learnerPubkey !== "string")
      return res.status(400).json({ error: "Invalid learnerPubkey" });

    let learner: PublicKey;
    try { learner = new PublicKey(learnerPubkey); }
    catch { return res.status(400).json({ error: "Invalid pubkey format" }); }

    if (isRateLimited(req, `complete:${learnerPubkey}:${courseId}:${lessonIndex}`))
      return res.status(429).json({ error: "Rate limited" });

    const quizExists = await checkQuizExists(courseId, lessonIndex);
    if (quizExists) {
      if (!answers || !Array.isArray(answers) || answers.length === 0) {
        return res.status(400).json({ error: "Answers required" });
      }
      const valid = await verifyAnswers(courseId, lessonIndex, answers);
      if (!valid) return res.status(400).json({ error: "Incorrect answers" });
    }

    const connection = getConnection();
    const backendSigner = getBackendSigner();
    const programId = getProgramId();
    const xpMint = getXpMint();

    const provider = new AnchorProvider(connection, new BackendWallet(backendSigner) as any, { commitment: "confirmed" });
    // IDL would be imported from shared location in production
    const program = new Program(require("../../idl.json") as any, provider) as any;

    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], programId);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], programId);
    const learnerXpAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022);

    const tx = new Transaction();
    try { await getAccount(connection, learnerXpAta, "confirmed", TOKEN_2022); }
    catch { tx.add(createAssociatedTokenAccountInstruction(backendSigner.publicKey, learnerXpAta, learner, xpMint, TOKEN_2022)); }

    const ix = await program.methods
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda, course: coursePda, enrollment: enrollmentPda,
        learner, learnerTokenAccount: learnerXpAta, xpMint,
        backendSigner: backendSigner.publicKey, tokenProgram: TOKEN_2022,
      })
      .instruction();
    tx.add(ix);

    const signature = await sendWithRetry(connection, tx, [backendSigner]);
    res.json({ signature });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("LessonAlreadyCompleted")) return res.status(409).json({ error: "Lesson already completed" });
    if (msg.includes("CourseNotActive")) return res.status(400).json({ error: "Course not active" });
    console.error("complete-lesson error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
