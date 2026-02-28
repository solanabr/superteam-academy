import { NextResponse } from "next/server";
import { requireWalletSession } from "@/lib/auth/require-session";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import { getBackendProgram } from "@/lib/solana/backend-signer";
import { getAccounts } from "@/lib/solana/program";
import { findCoursePDA, findEnrollmentPDA } from "@/lib/solana/pda";
import {
  parseAnchorError,
  isClientError,
} from "@/lib/solana/anchor-errors";
import { logEnrollmentEvent } from "@/lib/supabase/enrollment-events";

export async function POST(req: Request) {
  try {
    const session = await requireWalletSession();
    if ("error" in session) return session.error;

    const body = await req.json();
    const { courseId } = body as {
      courseId?: string;
    };

    if (!courseId) {
      return NextResponse.json(
        { error: "Missing required field: courseId" },
        { status: 400 },
      );
    }

    const { program, connection } = getBackendProgram();
    const learnerKey = new PublicKey(session.wallet);
    const [coursePDA] = findCoursePDA(courseId);
    const [enrollmentPDA] = findEnrollmentPDA(courseId, learnerKey);

    // Check if enrollment PDA already exists (idempotent)
    const existingEnrollment = await connection.getAccountInfo(enrollmentPDA);
    if (existingEnrollment) {
      return NextResponse.json({
        alreadyDone: true,
        message: "Already enrolled in this course",
      });
    }

    // Read course to check prerequisites
    const accounts = getAccounts(program);
    const courseAccount = await accounts.course.fetch(coursePDA);

    const remainingAccounts: {
      pubkey: PublicKey;
      isWritable: boolean;
      isSigner: boolean;
    }[] = [];
    if (courseAccount.prerequisite) {
      const prereqCoursePubkey = courseAccount.prerequisite;
      const prereqCourseAccount =
        await accounts.course.fetch(prereqCoursePubkey);
      const prereqCourseId = prereqCourseAccount.courseId;
      const [prereqEnrollment] = findEnrollmentPDA(prereqCourseId, learnerKey);
      remainingAccounts.push(
        { pubkey: prereqCoursePubkey, isWritable: false, isSigner: false },
        { pubkey: prereqEnrollment, isWritable: false, isSigner: false },
      );
    }

    // Build the transaction for the client to sign (learner must be signer/payer)
    const tx = await program.methods
      .enroll(courseId)
      .accounts({
        course: coursePDA,
        enrollment: enrollmentPDA,
        learner: learnerKey,
        systemProgram: SystemProgram.programId,
      })
      .remainingAccounts(remainingAccounts)
      .transaction();

    const { blockhash, lastValidBlockHeight } =
      await connection.getLatestBlockhash("confirmed");
    tx.recentBlockhash = blockhash;
    tx.lastValidBlockHeight = lastValidBlockHeight;
    tx.feePayer = learnerKey;

    const serialized = tx
      .serialize({ requireAllSignatures: false })
      .toString("base64");

    // Note: logged at TX-build time (before client signs). This records intent,
    // not confirmation. The client signs and submits; on-chain state is the source of truth.
    logEnrollmentEvent({
      eventType: "enroll",
      wallet: session.wallet,
      courseId,
    });

    return NextResponse.json({ transaction: serialized });
  } catch (err: unknown) {
    const anchor = parseAnchorError(err);
    if (anchor && isClientError(anchor.code)) {
      return NextResponse.json(
        { error: anchor.message, code: anchor.name },
        { status: 400 },
      );
    }
    const message = err instanceof Error ? err.message : "Transaction failed";
    console.error("enroll error:", err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
