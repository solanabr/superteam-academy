import { NextRequest, NextResponse } from "next/server";
import { PublicKey, Keypair, sendAndConfirmTransaction } from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { ensureUser, getUtcDay, findEnrollment } from "@/lib/db/helpers";
import { Certificate } from "@/lib/db/models/certificate";
import { getCourseById, getCoursesByTrack } from "@/lib/db/course-helpers";
import { fetchSanityCourse } from "@/lib/services/sanity-courses";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import {
  fetchConfig,
  fetchCourse as fetchOnChainCourse,
  fetchEnrollment,
  popcountBitmap,
} from "@/lib/solana/readers";
import { TRACKS } from "@/lib/solana/constants";
import {
  buildCompleteLessonTx,
  buildFinalizeCourseTx,
  buildIssueCredentialTx,
  buildUpgradeCredentialTx,
} from "@/lib/solana/transactions";

export async function POST(req: NextRequest) {
  const { userId, courseId, lessonIndex } = await req.json();
  if (!userId || !courseId || lessonIndex === undefined) {
    return NextResponse.json({ error: "missing fields" }, { status: 400 });
  }

  const wallet = new PublicKey(userId);
  let txSignature: string | null = null;
  let finalizeTxSignature: string | null = null;
  let credentialTxSignature: string | null = null;

  // On-chain: try full program instructions first
  try {
    const connection = getConnection();
    const backendKeypair = getBackendSigner();
    const program = getBackendProgram(backendKeypair);
    const config = await fetchConfig();
    if (config && !config.seasonClosed) {
      const xpMint = config.xpMint;

      const onChainCourse = await fetchOnChainCourse(courseId);
      if (onChainCourse) {
        const tx = await buildCompleteLessonTx(
          program,
          backendKeypair.publicKey,
          wallet,
          courseId,
          lessonIndex,
          xpMint,
        );
        tx.feePayer = backendKeypair.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        txSignature = await sendAndConfirmTransaction(connection, tx, [
          backendKeypair,
        ]);

        const enrollment = await fetchEnrollment(courseId, wallet);
        if (enrollment && !enrollment.completedAt) {
          const completedCount = popcountBitmap(enrollment.lessonFlags);
          if (completedCount >= onChainCourse.lessonCount) {
            const finalizeTx = await buildFinalizeCourseTx(
              program,
              backendKeypair.publicKey,
              wallet,
              courseId,
              xpMint,
              onChainCourse.creator,
            );
            finalizeTx.feePayer = backendKeypair.publicKey;
            finalizeTx.recentBlockhash = (
              await connection.getLatestBlockhash()
            ).blockhash;
            finalizeTxSignature = await sendAndConfirmTransaction(
              connection,
              finalizeTx,
              [backendKeypair],
            );

            try {
              const trackId = onChainCourse.trackId;
              const trackInfo = TRACKS[trackId];
              const trackCourses = await getCoursesByTrack(trackId);

              // Count completed courses in this track
              let trackCompletedCount = 0;
              let trackTotalXp = 0;
              let existingCredentialAsset: PublicKey | null = null;

              for (const tc of trackCourses) {
                const tcEnrollment = await fetchEnrollment(tc.id, wallet);
                if (tcEnrollment?.completedAt) {
                  trackCompletedCount++;
                  const tcCourse = await fetchOnChainCourse(tc.id);
                  if (tcCourse) {
                    trackTotalXp +=
                      Number(tcCourse.xpPerLesson) * tcCourse.lessonCount;
                  }
                  if (
                    tcEnrollment.credentialAsset &&
                    !new PublicKey(tcEnrollment.credentialAsset).equals(
                      PublicKey.default,
                    )
                  ) {
                    existingCredentialAsset = new PublicKey(
                      tcEnrollment.credentialAsset,
                    );
                  }
                }
              }

              const credentialName = `${trackInfo?.display ?? "Superteam"} - Level ${onChainCourse.trackLevel}`;

              if (existingCredentialAsset) {
                // Upgrade existing credential
                const credentialTx = await buildUpgradeCredentialTx(
                  program,
                  backendKeypair.publicKey,
                  wallet,
                  courseId,
                  existingCredentialAsset,
                  PublicKey.default,
                  credentialName,
                  "",
                  trackCompletedCount,
                  trackTotalXp,
                );
                credentialTx.feePayer = backendKeypair.publicKey;
                credentialTx.recentBlockhash = (
                  await connection.getLatestBlockhash()
                ).blockhash;
                credentialTxSignature = await sendAndConfirmTransaction(
                  connection,
                  credentialTx,
                  [backendKeypair],
                );
              } else {
                // Issue new credential
                const credentialAssetKeypair = Keypair.generate();
                const { tx: credentialTx, credentialAssetKeypair: assetKp } =
                  await buildIssueCredentialTx(
                    program,
                    backendKeypair.publicKey,
                    wallet,
                    courseId,
                    credentialAssetKeypair,
                    PublicKey.default,
                    credentialName,
                    "",
                    trackCompletedCount,
                    trackTotalXp,
                  );
                credentialTx.feePayer = backendKeypair.publicKey;
                credentialTx.recentBlockhash = (
                  await connection.getLatestBlockhash()
                ).blockhash;
                credentialTxSignature = await sendAndConfirmTransaction(
                  connection,
                  credentialTx,
                  [backendKeypair, assetKp],
                );
              }
            } catch {
              // credential issuance is non-critical
            }
          }
        }
      }
    }
  } catch (err: any) {
    const errMsg = err?.message ?? "";
    if (errMsg.includes("LessonAlreadyCompleted") || errMsg.includes("6003")) {
      // Already completed on-chain
    } else {
      console.warn("[complete-lesson] program tx failed:", errMsg);
    }
  }

  // MongoDB sync (backup)
  await connectDB();
  const user = await ensureUser(userId);
  const dbEnrollment = await findEnrollment(userId, courseId);
  if (dbEnrollment && !dbEnrollment.lessonsCompleted.includes(lessonIndex)) {
    dbEnrollment.lessonsCompleted.push(lessonIndex);
    dbEnrollment.percentComplete =
      (dbEnrollment.lessonsCompleted.length / dbEnrollment.totalLessons) * 100;

    // Store lesson tx hash
    const lessonTx = txSignature;
    if (lessonTx) {
      dbEnrollment.lessonTxHashes.set(String(lessonIndex), lessonTx);
    }

    const justCompleted =
      dbEnrollment.lessonsCompleted.length === dbEnrollment.totalLessons;
    if (justCompleted) {
      dbEnrollment.completedAt = new Date();
      dbEnrollment.completionTxHash =
        finalizeTxSignature ?? txSignature ?? undefined;
    }
    await dbEnrollment.save();

    const dbCourse = await getCourseById(courseId);
    const sanityCourse = !dbCourse ? await fetchSanityCourse(courseId) : null;
    const courseXpTotal = dbCourse?.xpTotal ?? sanityCourse?.xpTotal ?? 250;
    const xpPerLesson = Math.floor(courseXpTotal / dbEnrollment.totalLessons);
    user.xp += xpPerLesson;
    const today = getUtcDay();
    if (today > user.streak.lastDay) {
      if (today === user.streak.lastDay + 1) {
        user.streak.current += 1;
      } else {
        user.streak.current = 1;
      }
      user.streak.lastDay = today;
      if (user.streak.current > user.streak.longest) {
        user.streak.longest = user.streak.current;
      }
    }
    await user.save();

    if (justCompleted) {
      const course = await getCourseById(dbEnrollment.courseId);
      if (course) {
        const existing = await Certificate.findOne({
          wallet: userId,
          courseId: dbEnrollment.courseId,
        });
        const certTxHash = finalizeTxSignature ?? txSignature ?? null;
        if (!existing) {
          await Certificate.create({
            wallet: userId,
            courseId: dbEnrollment.courseId,
            courseTitle: course.title,
            trackId: course.trackId,
            xpEarned: course.xpTotal,
            txHash: certTxHash,
          });
        } else if (!existing.txHash && certTxHash) {
          existing.txHash = certTxHash;
          await existing.save();
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    txSignature,
    finalizeTxSignature,
    credentialTxSignature,
  });
}
