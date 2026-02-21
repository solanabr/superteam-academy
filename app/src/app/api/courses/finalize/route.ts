import { NextRequest, NextResponse } from "next/server";
import {
  Connection,
  Keypair,
  PublicKey,
  TransactionMessage,
  VersionedTransaction,
  TransactionInstruction,
} from "@solana/web3.js";
import {
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountIdempotentInstruction,
  TOKEN_2022_PROGRAM_ID,
} from "@solana/spl-token";
import { createClient } from "@supabase/supabase-js";
import {
  PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
} from "@/lib/solana/program";
import { updateStreak } from "@/lib/streak";

const RPC_URL =
  process.env.NEXT_PUBLIC_HELIUS_RPC ??
  process.env.NEXT_PUBLIC_SOLANA_RPC_URL ??
  "https://api.devnet.solana.com";

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ?? "5S5pSBFe968KdjAaG5yUXX1detFrE9vR4RGvT7JqRGjd",
);

const CREDENTIAL_COLLECTION = new PublicKey(
  process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTION ?? "3kVGs49bDKKjwhP1B83QuQDdNnCcDPkMoyRGKBm6Nosb",
);

// Anchor discriminators (sha256("global:<fn_name>")[..8])
const FINALIZE_COURSE_DISC = Buffer.from([68, 189, 122, 239, 39, 121, 16, 218]);
const ISSUE_CREDENTIAL_DISC = Buffer.from([255, 193, 171, 224, 68, 171, 194, 87]);

function getBackendSigner(): Keypair {
  const keyJson = process.env.BACKEND_SIGNER_KEY;
  if (!keyJson) throw new Error("BACKEND_SIGNER_KEY not configured");
  return Keypair.fromSecretKey(Uint8Array.from(JSON.parse(keyJson)));
}

function buildFinalizeCourseIx(
  config: PublicKey,
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
  learnerTokenAccount: PublicKey,
  creatorTokenAccount: PublicKey,
  creator: PublicKey,
  xpMint: PublicKey,
  backendSigner: PublicKey,
): TransactionInstruction {
  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: learnerTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creatorTokenAccount, isSigner: false, isWritable: true },
      { pubkey: creator, isSigner: false, isWritable: false },
      { pubkey: xpMint, isSigner: false, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: TOKEN_2022_PROGRAM_ID, isSigner: false, isWritable: false },
    ],
    data: FINALIZE_COURSE_DISC,
  });
}

function buildIssueCredentialIx(
  config: PublicKey,
  course: PublicKey,
  enrollment: PublicKey,
  learner: PublicKey,
  credentialAsset: PublicKey,
  trackCollection: PublicKey,
  payer: PublicKey,
  backendSigner: PublicKey,
  credentialName: string,
  metadataUri: string,
  coursesCompleted: number,
  totalXp: bigint,
): TransactionInstruction {
  // Serialize: discriminator + name (borsh string) + metadata_uri (borsh string)
  //            + courses_completed (u32 LE) + total_xp (u64 LE)
  const nameBytes = Buffer.from(credentialName, "utf-8");
  const uriBytes = Buffer.from(metadataUri, "utf-8");

  const data = Buffer.alloc(
    8 + 4 + nameBytes.length + 4 + uriBytes.length + 4 + 8,
  );
  let offset = 0;

  ISSUE_CREDENTIAL_DISC.copy(data, offset);
  offset += 8;

  data.writeUInt32LE(nameBytes.length, offset);
  offset += 4;
  nameBytes.copy(data, offset);
  offset += nameBytes.length;

  data.writeUInt32LE(uriBytes.length, offset);
  offset += 4;
  uriBytes.copy(data, offset);
  offset += uriBytes.length;

  data.writeUInt32LE(coursesCompleted, offset);
  offset += 4;

  data.writeBigUInt64LE(totalXp, offset);

  return new TransactionInstruction({
    programId: PROGRAM_ID,
    keys: [
      { pubkey: config, isSigner: false, isWritable: false },
      { pubkey: course, isSigner: false, isWritable: false },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: learner, isSigner: false, isWritable: false },
      { pubkey: credentialAsset, isSigner: true, isWritable: true },
      { pubkey: trackCollection, isSigner: false, isWritable: true },
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: backendSigner, isSigner: true, isWritable: false },
      { pubkey: MPL_CORE_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: new PublicKey("11111111111111111111111111111111"), isSigner: false, isWritable: false },
    ],
    data,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { courseId, learnerWallet, userId, action, finalizeSig } = body;

    if (!courseId || !learnerWallet || !userId) {
      return NextResponse.json(
        { error: "Missing required fields: courseId, learnerWallet, userId" },
        { status: 400 },
      );
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    // --- Confirm mode: frontend already sent the tx, update Supabase ---
    if (action === "confirm") {
      await supabase
        .from("course_progress")
        .update({
          is_finalized: true,
          is_completed: true,
          completed_at: new Date().toISOString(),
        })
        .eq("user_id", userId)
        .eq("course_id", courseId);

      await updateStreak(supabase, userId);
      return NextResponse.json({ success: true });
    }

    // --- Prepare mode: build partially-signed transactions ---

    // Check course progress in Supabase
    const { data: progress } = await supabase
      .from("course_progress")
      .select("completed_lessons, is_completed, is_finalized, xp_earned")
      .eq("user_id", userId)
      .eq("course_id", courseId)
      .single();

    if (!progress) {
      return NextResponse.json({ error: "Not enrolled" }, { status: 400 });
    }

    if (progress.is_finalized) {
      return NextResponse.json(
        { error: "Course already finalized", alreadyFinalized: true },
        { status: 200 },
      );
    }

    const connection = new Connection(RPC_URL, "confirmed");
    const backendKeypair = getBackendSigner();
    const learnerKey = new PublicKey(learnerWallet);

    const configPda = getConfigPda();
    const coursePda = getCoursePda(courseId);
    const enrollmentPda = getEnrollmentPda(courseId, learnerKey);

    // Read course account to get creator
    const courseAccount = await connection.getAccountInfo(coursePda);
    if (!courseAccount) {
      return NextResponse.json({ error: "Course not found on-chain" }, { status: 404 });
    }
    const courseData = courseAccount.data;
    const courseIdLen = courseData.readUInt32LE(8);
    const creatorOffset = 8 + 4 + courseIdLen;
    const creator = new PublicKey(courseData.subarray(creatorOffset, creatorOffset + 32));

    const learnerTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, learnerKey, true, TOKEN_2022_PROGRAM_ID,
    );
    const creatorTokenAccount = getAssociatedTokenAddressSync(
      XP_MINT, creator, true, TOKEN_2022_PROGRAM_ID,
    );

    // Build finalize tx — learner pays tx fee
    const createLearnerAta = createAssociatedTokenAccountIdempotentInstruction(
      learnerKey, learnerTokenAccount, learnerKey, XP_MINT, TOKEN_2022_PROGRAM_ID,
    );
    const createCreatorAta = createAssociatedTokenAccountIdempotentInstruction(
      learnerKey, creatorTokenAccount, creator, XP_MINT, TOKEN_2022_PROGRAM_ID,
    );

    const finalizeIx = buildFinalizeCourseIx(
      configPda, coursePda, enrollmentPda,
      learnerKey, learnerTokenAccount,
      creatorTokenAccount, creator,
      XP_MINT, backendKeypair.publicKey,
    );

    const { blockhash } =
      await connection.getLatestBlockhash("confirmed");

    const finalizeMsg = new TransactionMessage({
      payerKey: learnerKey, // learner pays tx fee
      recentBlockhash: blockhash,
      instructions: [createLearnerAta, createCreatorAta, finalizeIx],
    }).compileToV0Message();

    const finalizeTx = new VersionedTransaction(finalizeMsg);
    finalizeTx.sign([backendKeypair]); // backend partial-signs

    // Build credential tx (best-effort, separate tx)
    let credentialTxBase64: string | null = null;
    let credentialAssetAddress: string | null = null;
    try {
      const credentialKeypair = Keypair.generate();
      const totalXp = BigInt(progress.xp_earned ?? 0);

      const issueIx = buildIssueCredentialIx(
        configPda, coursePda, enrollmentPda,
        learnerKey, credentialKeypair.publicKey,
        CREDENTIAL_COLLECTION,
        learnerKey,                // payer = learner
        backendKeypair.publicKey,  // backend_signer
        `Superteam Academy — ${courseId}`,
        `https://arweave.net/credential/${courseId}`,
        1,
        totalXp,
      );

      const { blockhash: bh2 } =
        await connection.getLatestBlockhash("confirmed");

      const credMsg = new TransactionMessage({
        payerKey: learnerKey, // learner pays
        recentBlockhash: bh2,
        instructions: [issueIx],
      }).compileToV0Message();

      const credTx = new VersionedTransaction(credMsg);
      credTx.sign([backendKeypair, credentialKeypair]); // backend + asset keypair

      credentialTxBase64 = Buffer.from(credTx.serialize()).toString("base64");
      credentialAssetAddress = credentialKeypair.publicKey.toBase58();
    } catch (err) {
      console.error("Failed to build credential tx:", err);
    }

    return NextResponse.json({
      success: true,
      finalizeTx: Buffer.from(finalizeTx.serialize()).toString("base64"),
      credentialTx: credentialTxBase64,
      credentialAssetAddress,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("finalize-course API error:", message);

    if (message.includes("CourseAlreadyFinalized")) {
      return NextResponse.json(
        { error: "Course already finalized on-chain", alreadyFinalized: true },
        { status: 200 },
      );
    }

    return NextResponse.json(
      { error: "Failed to finalize course", details: message },
      { status: 500 },
    );
  }
}
