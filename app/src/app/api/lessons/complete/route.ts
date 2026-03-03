import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import {
  getAnchorProgram,
  getXpMintPubkey,
  getAchievementCollection,
  ensureXpAta,
  serializeAnchorError,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
} from "@/lib/anchor-server";
import {
  findConfigPDA,
  findCoursePDA,
  findEnrollmentPDA,
  findAchievementTypePDA,
  findAchievementReceiptPDA,
  findMinterRolePDA,
} from "@/lib/pda";

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const body = (await req.json()) as {
    courseId?: string;
    lessonIndex?: number;
    learnerWallet?: string;
  };
  const { courseId, lessonIndex, learnerWallet } = body;

  if (!courseId || lessonIndex === undefined || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId, lessonIndex, or learnerWallet" },
      { status: 400 },
    );
  }

  let learner: PublicKey;
  try {
    learner = new PublicKey(learnerWallet);
  } catch {
    return NextResponse.json(
      { error: "Invalid learnerWallet pubkey" },
      { status: 400 },
    );
  }

  try {
    const { program, backendKeypair, connection } = getAnchorProgram();
    const xpMint = getXpMintPubkey();

    const [configPda] = findConfigPDA();
    const [coursePda] = findCoursePDA(courseId);
    const [enrollmentPda] = findEnrollmentPDA(courseId, learner);

    const learnerXpAta = await ensureXpAta(
      connection,
      backendKeypair,
      learner,
      xpMint,
    );

    const signature = await program.methods
      .completeLesson(lessonIndex)
      .accountsPartial({
        config: configPda,
        course: coursePda,
        enrollment: enrollmentPda,
        learner,
        learnerTokenAccount: learnerXpAta,
        xpMint,
        backendSigner: backendKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([backendKeypair])
      .rpc();

    // Best-effort achievement auto-award (does not fail lesson completion)
    const awarded: Array<{ id: string; asset: string }> = [];
    try {
      const xpBalance = await connection.getTokenAccountBalance(learnerXpAta);
      const currentXp = xpBalance.value.uiAmount ?? 0;
      const toAward = ["first-lesson"];
      if (currentXp >= 100) toAward.push("xp-100");
      if (currentXp >= 500) toAward.push("xp-500");
      if (currentXp >= 1000) toAward.push("xp-1000");
      if (currentXp >= 2500) toAward.push("xp-2500");

      const results = await Promise.all(
        toAward.map((id) =>
          tryAwardAchievement(
            id,
            learner,
            program,
            backendKeypair,
            connection,
            xpMint,
          ),
        ),
      );
      awarded.push(
        ...results.filter(
          (r): r is { id: string; asset: string } => r !== null,
        ),
      );
    } catch {
      // best-effort
    }

    return NextResponse.json({
      success: true,
      signature,
      achievements: awarded,
    });
  } catch (err) {
    const msg = serializeAnchorError(err);
    console.error("[api/lessons/complete]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// ─── Inline achievement helper ────────────────────────────────────────────────

async function tryAwardAchievement(
  achievementId: string,
  recipient: PublicKey,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  program: any,
  backendKeypair: Keypair,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  connection: any,
  xpMint: PublicKey,
): Promise<{ id: string; asset: string } | null> {
  const collection = getAchievementCollection(achievementId);
  if (!collection) return null;

  try {
    const [configPda] = findConfigPDA();
    const [achievementTypePda] = findAchievementTypePDA(achievementId);
    const [achievementReceiptPda] = findAchievementReceiptPDA(
      achievementId,
      recipient,
    );
    const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

    const receiptInfo = await connection.getAccountInfo(achievementReceiptPda);
    if (receiptInfo) return null;

    const recipientTokenAccount = await ensureXpAta(
      connection,
      backendKeypair,
      recipient,
      xpMint,
    );
    const assetKp = Keypair.generate();

    await program.methods
      .awardAchievement()
      .accountsPartial({
        config: configPda,
        achievementType: achievementTypePda,
        achievementReceipt: achievementReceiptPda,
        minterRole: minterRolePda,
        asset: assetKp.publicKey,
        collection,
        recipient,
        recipientTokenAccount,
        xpMint,
        payer: backendKeypair.publicKey,
        minter: backendKeypair.publicKey,
        mplCoreProgram: MPL_CORE_PROGRAM_ID,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
        systemProgram: SystemProgram.programId,
      })
      .signers([backendKeypair, assetKp])
      .rpc();

    return { id: achievementId, asset: assetKp.publicKey.toBase58() };
  } catch {
    return null;
  }
}
