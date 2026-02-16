import { NextRequest, NextResponse } from "next/server";
import { PublicKey, sendAndConfirmTransaction } from "@solana/web3.js";
import { connectDB } from "@/lib/db/mongodb";
import { ensureUser, getUtcDay, findEnrollment } from "@/lib/db/helpers";
import { Certificate } from "@/lib/db/models/certificate";
import { SAMPLE_COURSES } from "@/lib/data/sample-courses";
import { getConnection } from "@/lib/solana/connection";
import { getBackendSigner } from "@/lib/solana/backend-signer";
import { getBackendProgram } from "@/lib/solana/program";
import { fetchConfig, fetchCourse as fetchOnChainCourse, fetchEnrollment, popcountBitmap } from "@/lib/solana/readers";
import {
  buildCompleteLessonTx,
  buildFinalizeCourseTx,
  buildIssueCredentialTx,
  sendMemoTx,
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
      const xpMint = config.currentMint;

      const onChainCourse = await fetchOnChainCourse(courseId);
      if (onChainCourse) {
        const xpPerLesson = Math.floor(onChainCourse.xpTotal / onChainCourse.lessonCount);

        const tx = await buildCompleteLessonTx(
          program,
          backendKeypair.publicKey,
          wallet,
          courseId,
          lessonIndex,
          xpPerLesson,
          xpMint
        );
        tx.feePayer = backendKeypair.publicKey;
        tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
        txSignature = await sendAndConfirmTransaction(connection, tx, [backendKeypair]);

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
              onChainCourse.creator
            );
            finalizeTx.feePayer = backendKeypair.publicKey;
            finalizeTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
            finalizeTxSignature = await sendAndConfirmTransaction(connection, finalizeTx, [backendKeypair]);

            try {
              const credentialTx = await buildIssueCredentialTx(
                program,
                backendKeypair.publicKey,
                wallet,
                courseId
              );
              credentialTx.feePayer = backendKeypair.publicKey;
              credentialTx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash;
              credentialTxSignature = await sendAndConfirmTransaction(connection, credentialTx, [backendKeypair]);
            } catch {
              // credential issuance is non-critical
            }
          }
        }
      }
    }
  } catch (err: any) {
    const errMsg = err?.message ?? "";
    if (errMsg.includes("LessonAlreadyCompleted") || errMsg.includes("6005")) {
      // Already completed on-chain
    } else {
      console.warn("[complete-lesson] program tx failed:", errMsg);
    }
  }

  // Fallback: send Memo tx as on-chain proof if program tx didn't work
  if (!txSignature) {
    try {
      const backendKeypair = getBackendSigner();
      const course = SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId);
      txSignature = await sendMemoTx(backendKeypair, {
        event: "lesson_complete",
        wallet: userId,
        courseId,
        lessonIndex: String(lessonIndex),
        courseTitle: course?.title ?? courseId,
        timestamp: new Date().toISOString(),
      });
    } catch {
      // no SOL or signer not configured
    }
  }

  // MongoDB sync
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

    const justCompleted = dbEnrollment.lessonsCompleted.length === dbEnrollment.totalLessons;
    if (justCompleted) {
      dbEnrollment.completedAt = new Date();

      // Send course completion memo if no finalize tx
      if (!finalizeTxSignature) {
        try {
          const backendKeypair = getBackendSigner();
          const course = SAMPLE_COURSES.find((c) => c.id === courseId || c.slug === courseId);
          finalizeTxSignature = await sendMemoTx(backendKeypair, {
            event: "course_complete",
            wallet: userId,
            courseId,
            courseTitle: course?.title ?? courseId,
            xpEarned: String(course?.xpTotal ?? 0),
            timestamp: new Date().toISOString(),
          });
        } catch {
          // no SOL or signer not configured
        }
      }
      dbEnrollment.completionTxHash = finalizeTxSignature ?? lessonTx ?? undefined;
    }
    await dbEnrollment.save();

    user.xp += 50;
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
      const course = SAMPLE_COURSES.find(
        (c) => c.id === dbEnrollment.courseId || c.slug === dbEnrollment.courseId
      );
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
