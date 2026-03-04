/**
 * POST /api/credentials/mint
 *
 * Two-step on-chain credential issuance:
 *   1. finalize_course  — marks enrollment complete, mints bonus XP
 *   2. issue_credential — mints a soulbound Metaplex Core NFT (requires CREDENTIAL_COLLECTION_ADDRESS)
 *
 * Body: { courseId: string }
 * Requires: authenticated session with walletAddress linked
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import {
  LessonTable,
  CourseSectionTable,
  CourseTable,
  UserCourseAccessTable,
  UserLessonCompleteTable,
} from "@/drizzle/schema"
import { eq, and, count } from "drizzle-orm"
import { Keypair, PublicKey, SystemProgram, Connection } from "@solana/web3.js"
import { BN } from "@coral-xyz/anchor"
import {
  getBackendSigner,
  getProgram,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  deriveXpAta,
  getXpMintAddress,
  TOKEN_2022_PROGRAM_ID,
  MPL_CORE_PROGRAM_ID,
  getRpcEndpoint,
} from "@/lib/anchor-program"
import { createAssociatedTokenAccountInstruction } from "@solana/spl-token"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as { courseId?: string }
    const { courseId } = body
    if (!courseId) {
      return NextResponse.json({ error: "courseId is required" }, { status: 400 })
    }

    if (!user.walletAddress) {
      return NextResponse.json({ error: "No wallet linked. Add a wallet in Settings first." }, { status: 400 })
    }

    // Resolve course
    const course = await db.query.CourseTable.findFirst({
      where: eq(CourseTable.id, courseId),
      columns: { id: true, name: true, onchainCourseId: true, track: true, xpReward: true },
    })
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    if (!course.onchainCourseId) {
      return NextResponse.json({ error: "Course has no on-chain ID configured." }, { status: 400 })
    }

    // Verify enrollment
    const enrollment = await db.query.UserCourseAccessTable.findFirst({
      where: and(
        eq(UserCourseAccessTable.userId, user.id),
        eq(UserCourseAccessTable.courseId, courseId)
      ),
    })
    if (!enrollment) {
      return NextResponse.json({ error: "Not enrolled in this course." }, { status: 403 })
    }

    // Check all lessons complete in DB
    const [totalLessons, completedLessons] = await Promise.all([
      db.select({ total: count() }).from(LessonTable)
        .innerJoin(CourseSectionTable, eq(LessonTable.sectionId, CourseSectionTable.id))
        .where(eq(CourseSectionTable.courseId, courseId))
        .then(r => r[0]?.total ?? 0),
      db.select({ total: count() }).from(UserLessonCompleteTable)
        .innerJoin(LessonTable, eq(UserLessonCompleteTable.lessonId, LessonTable.id))
        .innerJoin(CourseSectionTable, eq(LessonTable.sectionId, CourseSectionTable.id))
        .where(and(
          eq(CourseSectionTable.courseId, courseId),
          eq(UserLessonCompleteTable.userId, user.id)
        ))
        .then(r => r[0]?.total ?? 0),
    ])

    if (completedLessons < totalLessons) {
      return NextResponse.json({
        error: `Complete all lessons first (${completedLessons}/${totalLessons} done).`
      }, { status: 400 })
    }

    const onchainId = course.onchainCourseId.trim()
    const learner = new PublicKey(user.walletAddress)
    const connection = new Connection(getRpcEndpoint(), "confirmed")
    const backendSigner = getBackendSigner()
    const program = await getProgram(backendSigner)

    const configPda = getConfigPda()
    const coursePda = getCoursePda(onchainId)
    const enrollmentPda = getEnrollmentPda(onchainId, learner)

    let xpMint: PublicKey
    try {
      xpMint = getXpMintAddress()
    } catch {
      return NextResponse.json({ error: "XP mint not configured." }, { status: 500 })
    }

    const { Transaction } = await import("@solana/web3.js")

    // Ensure learner XP ATA exists — must be CONFIRMED before finalizeCourse runs
    const learnerXpAta = deriveXpAta(learner, xpMint)
    const learnerAtaInfo = await connection.getAccountInfo(learnerXpAta)
    if (!learnerAtaInfo) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        backendSigner.publicKey,
        learnerXpAta,
        learner,
        xpMint,
        TOKEN_2022_PROGRAM_ID
      )
      const tx = new Transaction().add(createAtaIx)
      tx.feePayer = backendSigner.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.sign(backendSigner)
      const ataSig = await connection.sendRawTransaction(tx.serialize())
      await connection.confirmTransaction(ataSig, "confirmed")
    }

    // Ensure creator XP ATA exists — must be CONFIRMED before finalizeCourse runs
    const creatorXpAta = deriveXpAta(backendSigner.publicKey, xpMint)
    const creatorAtaInfo = await connection.getAccountInfo(creatorXpAta)
    if (!creatorAtaInfo) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        backendSigner.publicKey,
        creatorXpAta,
        backendSigner.publicKey,
        xpMint,
        TOKEN_2022_PROGRAM_ID
      )
      const tx = new Transaction().add(createAtaIx)
      tx.feePayer = backendSigner.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.sign(backendSigner)
      const ataSig = await connection.sendRawTransaction(tx.serialize())
      await connection.confirmTransaction(ataSig, "confirmed")
    }

    // ── Pre-step: sync lesson_flags ──────────────────────────────────────────
    // The on-chain enrollment tracks completed lessons via a bitset.
    // Lessons completed in DB may not have triggered complete_lesson on-chain
    // (e.g. enrolled before on-chain route was wired up, or lessonIndex missing).
    // Mark all lesson indices that are unset so finalizeCourse can proceed.
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const courseAccount = await (program.account as any).course.fetch(coursePda)
      const lessonCount: number = courseAccount.lessonCount ?? 0

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrollmentAccount = await (program.account as any).enrollment.fetch(enrollmentPda)
      const lessonFlags: { toNumber(): number }[] = enrollmentAccount.lessonFlags ?? []

      for (let i = 0; i < lessonCount; i++) {
        const wordIdx = Math.floor(i / 64)
        const bitIdx = i % 64
        const word = BigInt(lessonFlags[wordIdx]?.toNumber?.() ?? 0)
        const isSet = (word & (BigInt(1) << BigInt(bitIdx))) !== BigInt(0)
        if (isSet) continue

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          await (program.methods as any)
            .completeLesson(i)
            .accountsPartial({
              config: configPda,
              course: coursePda,
              enrollment: enrollmentPda,
              learner,
              learnerTokenAccount: learnerXpAta,
              xpMint,
              backendSigner: backendSigner.publicKey,
              tokenProgram: TOKEN_2022_PROGRAM_ID,
            })
            .rpc()
        } catch (lessonErr) {
          const lMsg = lessonErr instanceof Error ? lessonErr.message : String(lessonErr)
          if (!lMsg.includes("LessonAlreadyCompleted")) {
            console.warn(`[mint] complete_lesson(${i}) skipped: ${lMsg}`)
          }
        }
      }
    } catch (syncErr) {
      // Non-fatal — if the course/enrollment account can't be read, try finalize anyway
      console.warn("[mint] lesson-flag sync skipped:", syncErr instanceof Error ? syncErr.message : syncErr)
    }

    // ── Step 1: finalize_course ─────────────────────────────────────────────
    let finalizeSig: string | null = null
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      finalizeSig = await (program.methods as any)
        .finalizeCourse()
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          learnerTokenAccount: learnerXpAta,
          creatorTokenAccount: creatorXpAta,
          creator: backendSigner.publicKey,
          xpMint,
          backendSigner: backendSigner.publicKey,
          tokenProgram: TOKEN_2022_PROGRAM_ID,
        })
        .rpc()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      // Already finalized is fine — proceed to credential issuance
      if (!msg.includes("CourseAlreadyFinalized")) {
        console.error("[/api/credentials/mint] finalizeCourse error:", msg)
        return NextResponse.json({ error: `Finalize failed: ${msg}` }, { status: 500 })
      }
    }

    // ── Step 2: issue_credential ────────────────────────────────────────────
    const collectionAddress = process.env.CREDENTIAL_COLLECTION_ADDRESS
    if (!collectionAddress) {
      return NextResponse.json({
        success: true,
        finalized: true,
        credentialMinted: false,
        finalizeSig,
        message: "Course finalized on-chain! Set CREDENTIAL_COLLECTION_ADDRESS to also mint the NFT credential.",
      })
    }

    const credentialKeypair = Keypair.generate()
    const trackCollection = new PublicKey(collectionAddress)
    const metadataUri = `${process.env.NEXT_PUBLIC_SERVER_URL ?? "https://superteam-academy-brazil.vercel.app"}/api/credentials/metadata/${courseId}`
    const credentialName = `Superteam Brazil — ${course.name}`

    let credentialSig: string
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      credentialSig = await (program.methods as any)
        .issueCredential(
          credentialName,
          metadataUri,
          1,                   // courses_completed
          new BN(course.xpReward ?? 100),  // total_xp
        )
        .accountsPartial({
          config: configPda,
          course: coursePda,
          enrollment: enrollmentPda,
          learner,
          credentialAsset: credentialKeypair.publicKey,
          trackCollection,
          payer: backendSigner.publicKey,
          backendSigner: backendSigner.publicKey,
          mplCoreProgram: MPL_CORE_PROGRAM_ID,
          systemProgram: SystemProgram.programId,
        })
        .signers([credentialKeypair])
        .rpc()
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      if (msg.includes("CredentialAlreadyIssued")) {
        return NextResponse.json({
          success: true,
          finalized: true,
          credentialMinted: true,
          message: "Credential already issued.",
        })
      }
      console.error("[/api/credentials/mint] issueCredential error:", msg)
      return NextResponse.json({ error: `Credential mint failed: ${msg}` }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      finalized: true,
      credentialMinted: true,
      finalizeSig,
      credentialSig,
      credentialAsset: credentialKeypair.publicKey.toBase58(),
      explorerUrl: `https://explorer.solana.com/address/${credentialKeypair.publicKey.toBase58()}?cluster=devnet`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    console.error("[/api/credentials/mint]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
