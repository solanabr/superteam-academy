import { Hono } from "hono";
import { PublicKey, SendTransactionError } from "@solana/web3.js";
import { program, backendSigner, XP_MINT, TOKEN_2022_PROGRAM_ID } from "../lib/program.js";
import { getConfigPDA, getCoursePDA, getEnrollmentPDA } from "../lib/pda.js";
import { getOrCreateATA } from "../lib/ata.js";
import { authMiddleware } from "../middleware/auth.js";
import type { CompleteLessonRequest } from "../types.js";

const app = new Hono();

/** Count set bits in a u64 represented as a BN-like object */
function popcount(val: { toString(): string }): number {
  let v = BigInt(val.toString());
  let count = 0;
  while (v > 0n) {
    count += Number(v & 1n);
    v >>= 1n;
  }
  return count;
}

app.post("/", authMiddleware, async (c) => {
  const body = await c.req.json<CompleteLessonRequest>();
  const { courseId, lessonIndex, learnerWallet } = body;

  if (!courseId || lessonIndex == null || !learnerWallet) {
    return c.json(
      { error: "Missing required fields: courseId, lessonIndex, learnerWallet" },
      400,
    );
  }

  const learner = new PublicKey(learnerWallet);
  const [configPDA] = getConfigPDA();
  const [coursePDA] = getCoursePDA(courseId);
  const [enrollmentPDA] = getEnrollmentPDA(courseId, learner);

  const courseAccount = await program.account.course.fetch(coursePDA);
  const creator = courseAccount.creator as PublicKey;

  const [learnerATA, createAtaIx] = await getOrCreateATA(
    XP_MINT,
    learner,
    backendSigner.publicKey,
  );

  const builder = program.methods
    .completeLesson(lessonIndex)
    .accountsStrict({
      config: configPDA,
      course: coursePDA,
      enrollment: enrollmentPDA,
      learner,
      learnerTokenAccount: learnerATA,
      xpMint: XP_MINT,
      backendSigner: backendSigner.publicKey,
      tokenProgram: TOKEN_2022_PROGRAM_ID,
    })
    .signers([backendSigner]);

  if (createAtaIx) {
    builder.preInstructions([createAtaIx]);
  }

  let signature: string;
  try {
    signature = await builder.rpc();
  } catch (err) {
    if (err instanceof SendTransactionError) {
      const logs = await err.getLogs(program.provider.connection);
      return c.json({ error: err.message, logs }, 500);
    }
    const message = err instanceof Error ? err.message : "Unknown error";
    return c.json({ error: message }, 500);
  }

  // Re-fetch enrollment to check if all lessons are now complete.
  // The program uses popcount(lessonFlags) == lessonCount for finalization.
  const enrollment = await program.account.enrollment.fetch(enrollmentPDA);
  const flags = enrollment.lessonFlags as unknown as { toString(): string }[];
  const completedCount = flags.reduce((sum, f) => sum + popcount(f), 0);
  const isComplete = completedCount >= (courseAccount.lessonCount as number);

  let finalizeSignature: string | undefined;

  if (isComplete && enrollment.completedAt === null) {
    try {
      const [creatorATA, createCreatorAtaIx] = await getOrCreateATA(
        XP_MINT,
        creator,
        backendSigner.publicKey,
      );

      const finalizeBuilder = program.methods
        .finalizeCourse()
        .accountsStrict({
          config: configPDA,
          course: coursePDA,
          enrollment: enrollmentPDA,
          learner,
          learnerTokenAccount: learnerATA,
          creatorTokenAccount: creatorATA,
          creator,
          xpMint: XP_MINT,
          backendSigner: backendSigner.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .signers([backendSigner]);

      if (createCreatorAtaIx) {
        finalizeBuilder.preInstructions([createCreatorAtaIx]);
      }

      finalizeSignature = await finalizeBuilder.rpc();
    } catch (err) {
      if (err instanceof SendTransactionError) {
        const logs = await err.getLogs(program.provider.connection);
        console.error("finalizeCourse failed:", err.message, logs);
      } else {
        console.error("finalizeCourse failed:", err instanceof Error ? err.message : err);
      }
      // Not fatal — CourseAlreadyFinalized or transient error
    }
  }

  return c.json({
    success: true,
    signature,
    xpEarned: courseAccount.xpPerLesson,
    isComplete,
    finalizeSignature,
  });
});

export default app;
