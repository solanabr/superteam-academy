import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
} from "@solana/web3.js";
import { sendWithRetry } from "@/lib/tx-retry";
import { Program, AnchorProvider } from "@coral-xyz/anchor";
import { BackendWallet } from "@/lib/backend-wallet";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  getAccount,
} from "@solana/spl-token";
import { IDL } from "@/anchor/idl";
import { isRateLimited } from "@/lib/rate-limit";

const TOKEN_2022 = new PublicKey("TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb");

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

    if (isRateLimited(req, `finalize:${learnerPubkey}:${courseId}`)) {
      return NextResponse.json({ error: "Rate limited" }, { status: 429 });
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const program = new Program(IDL as any, provider) as any;

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

    // Fetch course to get creator
    const course = await program.account.course.fetch(coursePda);
    const creator = course.creator;

    const learnerXpAta = getAssociatedTokenAddressSync(xpMint, learner, false, TOKEN_2022);
    const creatorXpAta = getAssociatedTokenAddressSync(xpMint, creator, false, TOKEN_2022);

    const tx = new Transaction();

    // Ensure creator XP ATA exists
    try {
      await getAccount(connection, creatorXpAta, "confirmed", TOKEN_2022);
    } catch {
      tx.add(
        createAssociatedTokenAccountInstruction(
          backendSigner.publicKey,
          creatorXpAta,
          creator,
          xpMint,
          TOKEN_2022
        )
      );
    }

    const ix = await program.methods
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
        backendSigner: backendSigner.publicKey,
        tokenProgram: TOKEN_2022,
      })
      .instruction();
    tx.add(ix);

    const signature = await sendWithRetry(connection, tx, [backendSigner]);

    return NextResponse.json({ signature });
  } catch (err: unknown) {
    console.error("finalize-course error:", err);
    const msg = err instanceof Error ? err.message : "Unknown error";

    if (msg.includes("CourseAlreadyFinalized")) {
      return NextResponse.json({ error: "Course already finalized" }, { status: 409 });
    }
    if (msg.includes("CourseNotCompleted")) {
      return NextResponse.json({ error: "Not all lessons completed" }, { status: 400 });
    }

    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
