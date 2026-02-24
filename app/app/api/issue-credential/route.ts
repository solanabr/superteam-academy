import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
} from "@solana/web3.js";
import { sendWithRetry } from "@/lib/tx-retry";
import { type Idl, Program, AnchorProvider, BN } from "@coral-xyz/anchor";
import { BackendWallet } from "@/lib/backend-wallet";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { IDL, getTypedAccounts } from "@/anchor/idl";
import { isRateLimited } from "@/lib/rate-limit";

const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");
const MPL_CORE = new PublicKey("CoREENxT6tW1HoK8ypY1SxRMZTcVPm7R94rH4PZNhX7d");

function getBackendSigner(): Keypair {
  const key = process.env.BACKEND_SIGNER_KEY;
  if (!key || key === "[]") throw new Error("BACKEND_SIGNER_KEY not configured");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(key)));
}

function getConnection(): Connection {
  return new Connection(
    process.env.HELIUS_URL || process.env.NEXT_PUBLIC_HELIUS_URL || "https://api.devnet.solana.com",
    "confirmed"
  );
}

function getProgramId(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_PROGRAM_ID || "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
  );
}

function getXpMint(): PublicKey {
  return new PublicKey(
    process.env.NEXT_PUBLIC_XP_MINT || "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3"
  );
}

function getTrackCollection(): PublicKey | null {
  const addr = process.env.NEXT_PUBLIC_TRACK_COLLECTION;
  if (!addr) return null;
  return new PublicKey(addr);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { courseId, learnerPubkey } = body;

    if (!courseId || typeof courseId !== "string" || courseId.length > 32) {
      return NextResponse.json({ error: "Invalid courseId" }, { status: 400 });
    }
    if (!learnerPubkey || typeof learnerPubkey !== "string") {
      return NextResponse.json({ error: "Invalid learnerPubkey" }, { status: 400 });
    }

    let learner: PublicKey;
    try {
      learner = new PublicKey(learnerPubkey);
    } catch {
      return NextResponse.json({ error: "Invalid pubkey format" }, { status: 400 });
    }

    if (isRateLimited(req, `credential:${learnerPubkey}:${courseId}`)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
    }

    const trackCollection = getTrackCollection();
    if (!trackCollection) {
      return NextResponse.json({ error: "Track collection not configured" }, { status: 500 });
    }

    const connection = getConnection();
    const backendSigner = getBackendSigner();
    const programId = getProgramId();
    const xpMint = getXpMint();

    const provider = new AnchorProvider(
      connection,
      new BackendWallet(backendSigner),
      { commitment: "confirmed" }
    );
    const program = new Program(IDL as Idl, provider);

    // Derive PDAs
    const [configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("config")],
      programId
    );
    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(courseId)],
      programId
    );
    const [enrollmentPda] = PublicKey.findProgramAddressSync(
      [Buffer.from("enrollment"), Buffer.from(courseId), learner.toBuffer()],
      programId
    );

    // Fetch enrollment to check status
    const accounts = getTypedAccounts(program);
    const enrollment = await accounts.enrollment.fetch(enrollmentPda);

    if (!enrollment.completedAt) {
      return NextResponse.json({ error: "Course not finalized" }, { status: 400 });
    }

    // Get learner's XP balance for metadata
    const learnerXpAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022);
    let totalXp = 0;
    try {
      const balance = await connection.getTokenAccountBalance(learnerXpAta);
      totalXp = Number(balance.value.amount);
    } catch {
      // ATA might not exist yet
    }

    const credentialName = `Superteam Academy - ${courseId}`;
    const metadataUri = `https://arweave.net/placeholder-${courseId}`;

    if (enrollment.credentialAsset) {
      // Upgrade existing credential
      const ix = await program.methods
        .upgradeCredential(credentialName, metadataUri, 1, new BN(totalXp))
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          credentialAsset: enrollment.credentialAsset,
          trackCollection,
          payer: backendSigner.publicKey,
          backendSigner: backendSigner.publicKey,
          mplCoreProgram: MPL_CORE,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await sendWithRetry(connection, tx, [backendSigner]);

      return NextResponse.json({
        signature,
        credentialAsset: enrollment.credentialAsset.toBase58(),
      });
    } else {
      // Issue new credential
      const credentialAsset = Keypair.generate();

      const ix = await program.methods
        .issueCredential(credentialName, metadataUri, 1, new BN(totalXp))
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          credentialAsset: credentialAsset.publicKey,
          trackCollection,
          payer: backendSigner.publicKey,
          backendSigner: backendSigner.publicKey,
          mplCoreProgram: MPL_CORE,
          systemProgram: SystemProgram.programId,
        })
        .instruction();

      const tx = new Transaction().add(ix);
      const signature = await sendWithRetry(
        connection,
        tx,
        [backendSigner, credentialAsset]
      );

      return NextResponse.json({
        signature,
        credentialAsset: credentialAsset.publicKey.toBase58(),
      });
    }
  } catch (err: unknown) {
    console.error("issue-credential error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg.includes("CredentialAlreadyIssued")) {
      return NextResponse.json({ error: "Credential already issued" }, { status: 409 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
