import { Hono } from "hono";
import { Keypair, PublicKey, SendTransactionError, SystemProgram } from "@solana/web3.js";
import BN from "bn.js";
import { program, backendSigner, TRACK_COLLECTION, MPL_CORE_PROGRAM_ID } from "../lib/program.js";
import { getConfigPDA, getCoursePDA, getEnrollmentPDA } from "../lib/pda.js";
import { authMiddleware } from "../middleware/auth.js";
import type { IssueCredentialRequest } from "../types.js";

const app = new Hono();

app.post("/", authMiddleware, async (c) => {
  const body = await c.req.json<IssueCredentialRequest>();
  const { courseId, learnerWallet, credentialName, metadataUri, coursesCompleted, totalXp } = body;

  if (!courseId || !learnerWallet || !credentialName || !metadataUri || coursesCompleted == null || totalXp == null) {
    return c.json({ error: "Missing required fields" }, 400);
  }

  const learner = new PublicKey(learnerWallet);
  const assetKeypair = Keypair.generate();
  const [configPDA] = getConfigPDA();
  const [coursePDA] = getCoursePDA(courseId);
  const [enrollmentPDA] = getEnrollmentPDA(courseId, learner);

  let signature: string;
  try {
    signature = await program.methods
      .issueCredential(credentialName, metadataUri, coursesCompleted, new BN(totalXp))
      .accountsStrict({
        config: configPDA,
        course: coursePDA,
        enrollment: enrollmentPDA,
        learner,
        credentialAsset: assetKeypair.publicKey,
        trackCollection: TRACK_COLLECTION,
        payer: backendSigner.publicKey,
        backendSigner: backendSigner.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backendSigner, assetKeypair])
      .rpc();
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
    credentialAsset: assetKeypair.publicKey.toBase58(),
  });
});

export default app;
