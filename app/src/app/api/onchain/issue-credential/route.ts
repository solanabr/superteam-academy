import { NextResponse, type NextRequest } from "next/server";
import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync } from "@solana/spl-token";
import { resolveUserId } from "@/lib/auth-utils";
import { prisma } from "@/lib/db";
import {
  loadBackendSigner,
  getServerConnection,
  getTrackCollectionPubkey,
} from "@/lib/onchain/backend-signer";
import { getAllTracks, getTrackCollectionAddress } from "@/lib/tracks-service";
import { buildIssueCredentialTransaction } from "@/lib/onchain/instructions/issue-credential";
import { buildUpgradeCredentialTransaction } from "@/lib/onchain/instructions/upgrade-credential";
import {
  deserializeConfig,
  deserializeCourse,
  deserializeEnrollment,
} from "@/lib/onchain/deserializers";
import {
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
} from "@/lib/onchain/pda";
import {
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@/lib/onchain/constants";
import { parseAnchorError } from "@/lib/onchain/program-errors";
import { parseEventsFromLogs } from "@/lib/onchain/events";

export async function POST(request: NextRequest) {
  const userId = await resolveUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { courseId, learnerWallet, metadataUri, name } = body as {
    courseId?: string;
    learnerWallet?: string;
    metadataUri?: string;
    name?: string;
  };

  if (!courseId || !learnerWallet) {
    return NextResponse.json(
      { error: "Missing courseId or learnerWallet" },
      { status: 400 },
    );
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { wallet: true },
  });
  if (!user?.wallet || user.wallet !== learnerWallet) {
    return NextResponse.json({ error: "Wallet mismatch" }, { status: 403 });
  }

  let learner: PublicKey;
  try {
    learner = new PublicKey(learnerWallet);
  } catch {
    return NextResponse.json(
      { error: "Invalid learnerWallet" },
      { status: 400 },
    );
  }

  const connection = getServerConnection();

  // Verify enrollment exists and course is finalized
  const [enrollmentPda] = getEnrollmentPda(courseId, learner);
  const enrollmentInfo = await connection.getAccountInfo(enrollmentPda);
  if (!enrollmentInfo) {
    return NextResponse.json(
      { error: "Not enrolled in this course" },
      { status: 400 },
    );
  }
  const enrollment = deserializeEnrollment(Buffer.from(enrollmentInfo.data));
  if (!enrollment.completedAt) {
    return NextResponse.json({ error: "CourseNotFinalized" }, { status: 400 });
  }

  // Idempotency: credential already issued for this enrollment
  if (enrollment.credentialAsset !== null) {
    return NextResponse.json({
      success: true,
      credentialAsset: enrollment.credentialAsset.toBase58(),
    });
  }

  // Read course on-chain to get trackId and xpPerLesson
  const [coursePda] = getCoursePda(courseId);
  const courseInfo = await connection.getAccountInfo(coursePda);
  if (!courseInfo) {
    return NextResponse.json(
      { error: "Course not found on-chain" },
      { status: 404 },
    );
  }
  const course = deserializeCourse(Buffer.from(courseInfo.data));

  // Look up CMS-stored collection address, then fall back to env var
  const tracks = await getAllTracks();
  const cmsAddress = getTrackCollectionAddress(tracks, course.trackId);
  const trackCollection = getTrackCollectionPubkey(course.trackId, cmsAddress);
  if (!trackCollection) {
    return NextResponse.json(
      { error: `TRACK_COLLECTION_${course.trackId} env var not configured` },
      { status: 500 },
    );
  }

  // Compute totalXp from the learner's actual XP token balance (most accurate)
  let totalXp = BigInt(0);
  try {
    const [configPda] = getConfigPda();
    const configInfo = await connection.getAccountInfo(configPda);
    if (configInfo) {
      const { xpMint } = deserializeConfig(Buffer.from(configInfo.data));
      const learnerXpAta = getAssociatedTokenAddressSync(
        xpMint,
        learner,
        false,
        TOKEN_2022_PROGRAM_ID,
        ASSOCIATED_TOKEN_PROGRAM_ID,
      );
      const ataBalance = await connection.getTokenAccountBalance(learnerXpAta);
      totalXp = BigInt(ataBalance.value.amount);
    }
  } catch {
    // Fallback: base XP from course data (no bonus)
    totalXp = BigInt(course.lessonCount * course.xpPerLesson);
  }

  // Determine issue vs upgrade: check if this learner already has a credential for this track
  const existingCredential = await prisma.userCredential.findFirst({
    where: { userId, trackId: course.trackId },
    select: { mintAddress: true, coursesCompleted: true },
  });

  const backendSigner = loadBackendSigner();
  const credentialName = name ?? `${courseId} Credential`;
  const credentialUri =
    metadataUri ?? `https://academy.superteam.fun/api/credentials/${courseId}`;

  try {
    let signature: string;
    let assetAddress: string;

    if (existingCredential?.mintAddress) {
      // Upgrade existing credential NFT
      const existingAsset = new PublicKey(existingCredential.mintAddress);

      const tx = await buildUpgradeCredentialTransaction({
        courseId,
        learner,
        credentialAsset: existingAsset,
        trackCollection,
        name: credentialName,
        uri: credentialUri,
        coursesCompleted: (existingCredential.coursesCompleted ?? 0) + 1,
        totalXp,
        backendSigner: backendSigner.publicKey,
        connection,
      });

      tx.sign(backendSigner);

      signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
      });
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      let assetFromEvent: string | undefined;
      try {
        const txInfo = await connection.getTransaction(signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        const events = parseEventsFromLogs(txInfo?.meta?.logMessages ?? []);
        assetFromEvent = events.credentialUpgraded?.asset;
      } catch {
        // Non-fatal
      }
      assetAddress = assetFromEvent ?? existingAsset.toBase58();
    } else {
      // Issue a new credential NFT
      const { transaction: tx, credentialAssetKeypair } =
        await buildIssueCredentialTransaction({
          courseId,
          learner,
          trackCollection,
          name: credentialName,
          uri: credentialUri,
          coursesCompleted: 1,
          totalXp,
          backendSigner: backendSigner.publicKey,
          connection,
        });

      tx.sign(backendSigner, credentialAssetKeypair);

      signature = await connection.sendRawTransaction(tx.serialize(), {
        skipPreflight: false,
      });
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash();
      await connection.confirmTransaction(
        { signature, blockhash, lastValidBlockHeight },
        "confirmed",
      );

      let assetFromEvent: string | undefined;
      try {
        const txInfo = await connection.getTransaction(signature, {
          commitment: "confirmed",
          maxSupportedTransactionVersion: 0,
        });
        const events = parseEventsFromLogs(txInfo?.meta?.logMessages ?? []);
        assetFromEvent = events.credentialIssued?.asset;
      } catch {
        // Non-fatal
      }
      assetAddress =
        assetFromEvent ?? credentialAssetKeypair.publicKey.toBase58();
    }

    // Upsert UserCredential in DB with the on-chain asset address
    try {
      await prisma.userCredential.upsert({
        where: { userId_trackId: { userId, trackId: course.trackId } },
        update: {
          mintAddress: assetAddress,
          currentLevel: course.trackLevel,
          coursesCompleted: { increment: 1 },
          totalXpEarned: Number(totalXp),
          lastUpdated: new Date(),
        },
        create: {
          userId,
          trackId: course.trackId,
          trackName: `Track ${course.trackId}`,
          currentLevel: course.trackLevel,
          coursesCompleted: 1,
          totalXpEarned: Number(totalXp),
          mintAddress: assetAddress,
          metadataUri: credentialUri,
        },
      });
    } catch (dbErr) {
      console.error(
        "[onchain/issue-credential] DB upsert failed after on-chain success",
        dbErr,
      );
    }

    return NextResponse.json({
      success: true,
      signature,
      credentialAsset: assetAddress,
    });
  } catch (err) {
    const { name: errorName } = parseAnchorError(err);

    if (errorName === "CourseNotFinalized") {
      return NextResponse.json(
        { error: "CourseNotFinalized" },
        { status: 400 },
      );
    }

    const msg = err instanceof Error ? err.message : String(err);
    console.error("[onchain/issue-credential]", {
      userId,
      courseId,
      error: msg,
    });
    return NextResponse.json({ error: errorName ?? msg }, { status: 500 });
  }
}
