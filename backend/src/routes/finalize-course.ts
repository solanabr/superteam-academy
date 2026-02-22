import { Hono } from "hono";
import { PublicKey, SendTransactionError } from "@solana/web3.js";
import { program, backendSigner, XP_MINT, TOKEN_2022_PROGRAM_ID } from "../lib/program.js";
import { getConfigPDA, getCoursePDA, getEnrollmentPDA } from "../lib/pda.js";
import { getOrCreateATA } from "../lib/ata.js";
import { authMiddleware } from "../middleware/auth.js";
import type { FinalizeCourseRequest } from "../types.js";

const app = new Hono();

app.post("/", authMiddleware, async (c) => {
  const body = await c.req.json<FinalizeCourseRequest>();
  const { courseId, learnerWallet } = body;

  if (!courseId || !learnerWallet) {
    return c.json({ error: "Missing required fields: courseId, learnerWallet" }, 400);
  }

  const learner = new PublicKey(learnerWallet);
  const [configPDA] = getConfigPDA();
  const [coursePDA] = getCoursePDA(courseId);
  const [enrollmentPDA] = getEnrollmentPDA(courseId, learner);

  const courseAccount = await program.account.course.fetch(coursePDA);
  const creator = courseAccount.creator as PublicKey;

  const [learnerATA, createLearnerAtaIx] = await getOrCreateATA(XP_MINT, learner, backendSigner.publicKey);
  const [creatorATA, createCreatorAtaIx] = await getOrCreateATA(XP_MINT, creator, backendSigner.publicKey);

  const preIxs = [createLearnerAtaIx, createCreatorAtaIx].filter(Boolean) as any[];

  const builder = program.methods
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

  if (preIxs.length > 0) {
    builder.preInstructions(preIxs);
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

  return c.json({
    success: true,
    signature,
  });
});

export default app;
