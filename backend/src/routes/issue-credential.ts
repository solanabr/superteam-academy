import { Request, Response } from "express";
import { Keypair, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import { Program, AnchorProvider, BN, type Idl } from "@coral-xyz/anchor";
import idl from "../../idl.json";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { getBackendSigner, getConnection, getProgramId, getXpMint, getTrackCollection, TOKEN_2022, MPL_CORE } from "../lib/config";
import { BackendWallet } from "../lib/backend-wallet";
import { sendWithRetry } from "../lib/send-tx";
import { isRateLimited } from "../lib/rate-limit";

export async function issueCredentialHandler(req: Request, res: Response) {
  try {
    const { courseId, learnerPubkey } = req.body;

    if (!courseId || typeof courseId !== "string" || courseId.length > 32)
      return res.status(400).json({ error: "Invalid courseId" });
    if (!learnerPubkey || typeof learnerPubkey !== "string")
      return res.status(400).json({ error: "Invalid learnerPubkey" });

    let learner: PublicKey;
    try { learner = new PublicKey(learnerPubkey); }
    catch { return res.status(400).json({ error: "Invalid pubkey format" }); }

    if (isRateLimited(req, `credential:${learnerPubkey}:${courseId}`))
      return res.status(429).json({ error: "Rate limited" });

    const trackCollection = getTrackCollection();
    if (!trackCollection) return res.status(500).json({ error: "Track collection not configured" });

    const connection = getConnection();
    const backendSigner = getBackendSigner();
    const programId = getProgramId();
    const xpMint = getXpMint();

    const provider = new AnchorProvider(connection, new BackendWallet(backendSigner), { commitment: "confirmed" });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program: any = new Program(idl as Idl, provider);

    const [configPda] = PublicKey.findProgramAddressSync([Buffer.from("config")], programId);
    const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(courseId)], programId);
    const [enrollmentPda] = PublicKey.findProgramAddressSync([Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()], programId);

    const enrollment = await program.account.enrollment.fetch(enrollmentPda);
    if (!enrollment.completedAt) return res.status(400).json({ error: "Course not finalized" });

    const learnerXpAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022);
    let totalXp = 0;
    try {
      const balance = await connection.getTokenAccountBalance(learnerXpAta);
      totalXp = Number(balance.value.amount);
    } catch { /* ATA may not exist */ }

    const credentialName = `Superteam Academy - ${courseId}`;
    const metadataUri = `https://arweave.net/placeholder-${courseId}`;

    if (enrollment.credentialAsset) {
      const ix = await program.methods
        .upgradeCredential(credentialName, metadataUri, 1, new BN(totalXp))
        .accountsPartial({
          config: configPda, course: coursePda, enrollment: enrollmentPda,
          learner, credentialAsset: enrollment.credentialAsset, trackCollection,
          payer: backendSigner.publicKey, backendSigner: backendSigner.publicKey,
          mplCoreProgram: MPL_CORE, systemProgram: SystemProgram.programId,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await sendWithRetry(connection, tx, [backendSigner]);
      res.json({ signature, credentialAsset: enrollment.credentialAsset.toBase58() });
    } else {
      const credentialAsset = Keypair.generate();
      const ix = await program.methods
        .issueCredential(credentialName, metadataUri, 1, new BN(totalXp))
        .accountsPartial({
          config: configPda, course: coursePda, enrollment: enrollmentPda,
          learner, credentialAsset: credentialAsset.publicKey, trackCollection,
          payer: backendSigner.publicKey, backendSigner: backendSigner.publicKey,
          mplCoreProgram: MPL_CORE, systemProgram: SystemProgram.programId,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await sendWithRetry(connection, tx, [backendSigner, credentialAsset]);
      res.json({ signature, credentialAsset: credentialAsset.publicKey.toBase58() });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    if (msg.includes("CredentialAlreadyIssued")) return res.status(409).json({ error: "Credential already issued" });
    console.error("issue-credential error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
}
