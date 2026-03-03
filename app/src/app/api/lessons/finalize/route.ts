import { NextRequest, NextResponse } from "next/server";
import { Keypair, PublicKey, SystemProgram } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  getAnchorProgram,
  getXpMintPubkey,
  getTrackCollection,
  getCredentialMeta,
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
    learnerWallet?: string;
  };
  const { courseId, learnerWallet } = body;

  if (!courseId || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId or learnerWallet" },
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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const course = (await (program as any).account.course.fetch(
      coursePda,
    )) as any;
    const creator: PublicKey = course.creator as PublicKey;

    const [learnerXpAta, creatorXpAta] = await Promise.all([
      ensureXpAta(connection, backendKeypair, learner, xpMint),
      ensureXpAta(connection, backendKeypair, creator, xpMint),
    ]);

    const finalizeSignature: string = await program.methods
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
        backendSigner: backendKeypair.publicKey,
        tokenProgram: TOKEN_2022_PROGRAM_ID,
      })
      .signers([backendKeypair])
      .rpc();

    // ── Issue or upgrade credential (best-effort) ─────────────────────────────
    let credentialSignature: string | undefined;
    let credentialAsset: string | undefined;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrollment = (await (program as any).account.enrollment.fetch(
        enrollmentPda,
      )) as any;
      const trackId: number = course.trackId as number;
      const trackCollection = getTrackCollection(trackId);

      if (trackCollection) {
        const meta = getCredentialMeta(trackId, 1, 0);

        if (!enrollment.credentialAsset) {
          const credentialAssetKp = Keypair.generate();
          credentialSignature = await program.methods
            .issueCredential(
              meta.name,
              meta.uri,
              meta.coursesCompleted,
              new BN(meta.totalXp),
            )
            .accountsPartial({
              config: configPda,
              course: coursePda,
              enrollment: enrollmentPda,
              learner,
              credentialAsset: credentialAssetKp.publicKey,
              trackCollection,
              payer: backendKeypair.publicKey,
              backendSigner: backendKeypair.publicKey,
              mplCoreProgram: MPL_CORE_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([backendKeypair, credentialAssetKp])
            .rpc();
          credentialAsset = credentialAssetKp.publicKey.toBase58();
        } else {
          const existingAsset = new PublicKey(
            enrollment.credentialAsset as PublicKey,
          );
          credentialSignature = await program.methods
            .upgradeCredential(
              meta.name,
              meta.uri,
              meta.coursesCompleted,
              new BN(meta.totalXp),
            )
            .accountsPartial({
              config: configPda,
              course: coursePda,
              enrollment: enrollmentPda,
              learner,
              credentialAsset: existingAsset,
              trackCollection,
              payer: backendKeypair.publicKey,
              backendSigner: backendKeypair.publicKey,
              mplCoreProgram: MPL_CORE_PROGRAM_ID,
              systemProgram: SystemProgram.programId,
            })
            .signers([backendKeypair])
            .rpc();
          credentialAsset = existingAsset.toBase58();
        }
      }
    } catch {
      // best-effort — credential issuance does not fail the finalization
    }

    // ── Best-effort first-course achievement ──────────────────────────────────
    const achievements: Array<{ id: string; asset: string }> = [];
    try {
      const collection = getAchievementCollection("first-course");
      if (collection) {
        const [configPda2] = findConfigPDA();
        const [achievementTypePda] = findAchievementTypePDA("first-course");
        const [achievementReceiptPda] = findAchievementReceiptPDA(
          "first-course",
          learner,
        );
        const [minterRolePda] = findMinterRolePDA(backendKeypair.publicKey);

        const receiptInfo = await connection.getAccountInfo(
          achievementReceiptPda,
        );
        if (!receiptInfo) {
          const recipientTokenAccount = await ensureXpAta(
            connection,
            backendKeypair,
            learner,
            xpMint,
          );
          const assetKp = Keypair.generate();

          await program.methods
            .awardAchievement()
            .accountsPartial({
              config: configPda2,
              achievementType: achievementTypePda,
              achievementReceipt: achievementReceiptPda,
              minterRole: minterRolePda,
              asset: assetKp.publicKey,
              collection,
              recipient: learner,
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

          achievements.push({
            id: "first-course",
            asset: assetKp.publicKey.toBase58(),
          });
        }
      }
    } catch {
      // best-effort
    }

    return NextResponse.json({
      success: true,
      finalized: true,
      finalizeSignature,
      credentialSignature,
      credentialAsset,
      achievements,
    });
  } catch (err) {
    const msg = serializeAnchorError(err);
    console.error("[api/lessons/finalize]", msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
