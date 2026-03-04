/**
 * POST /api/lessons/complete
 *
 * Backend-signed lesson completion. Called after the learner finishes a lesson.
 * The backend signer (BACKEND_SIGNER_KEY) sends the `complete_lesson` instruction
 * so the program mints XP tokens to the learner's Token-2022 ATA.
 *
 * Body: { lessonId: string, lessonIndex: number }
 * Requires: authenticated session with walletAddress linked
 */

import { NextRequest, NextResponse } from "next/server"
import { getCurrentUser } from "@/lib/current-user"
import { db } from "@/drizzle/db"
import {
  LessonTable, CourseSectionTable, CourseTable, UserCourseAccessTable,
} from "@/drizzle/schema"
import { eq, and } from "drizzle-orm"
import { PublicKey, SystemProgram } from "@solana/web3.js"
import {
  getBackendSigner,
  getProgram,
  getConfigPda,
  getCoursePda,
  getEnrollmentPda,
  deriveXpAta,
  getXpMintAddress,
  TOKEN_2022_PROGRAM_ID,
  getRpcEndpoint,
} from "@/lib/anchor-program"
import { Connection } from "@solana/web3.js"
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddressSync } from "@solana/spl-token"

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser()
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json() as { lessonId?: string; lessonIndex?: number }
    const { lessonId, lessonIndex } = body

    if (!lessonId || lessonIndex === undefined || lessonIndex < 0) {
      return NextResponse.json({ error: "lessonId and lessonIndex are required" }, { status: 400 })
    }

    // Resolve lesson → section → course
    const lesson = await db.query.LessonTable.findFirst({
      where: eq(LessonTable.id, lessonId),
      columns: { id: true, sectionId: true },
    })
    if (!lesson) return NextResponse.json({ error: "Lesson not found" }, { status: 404 })

    const section = await db.query.CourseSectionTable.findFirst({
      where: eq(CourseSectionTable.id, lesson.sectionId),
      columns: { courseId: true },
    })
    if (!section) return NextResponse.json({ error: "Section not found" }, { status: 404 })

    const course = await db.query.CourseTable.findFirst({
      where: eq(CourseTable.id, section.courseId),
      columns: { id: true, onchainCourseId: true },
    })
    if (!course) return NextResponse.json({ error: "Course not found" }, { status: 404 })

    // Verify user is enrolled
    const enrollment = await db.query.UserCourseAccessTable.findFirst({
      where: and(
        eq(UserCourseAccessTable.userId, user.id),
        eq(UserCourseAccessTable.courseId, course.id)
      ),
    })
    if (!enrollment) return NextResponse.json({ error: "Not enrolled" }, { status: 403 })

    // If no onchainCourseId, skip on-chain and return stub success
    if (!course.onchainCourseId) {
      return NextResponse.json({
        success: true,
        onchain: false,
        message: "Lesson recorded (on-chain stub — course has no onchainCourseId yet)",
      })
    }

    // Need user's wallet address to derive XP ATA
    if (!user.walletAddress) {
      return NextResponse.json({
        success: true,
        onchain: false,
        message: "Lesson recorded (no wallet linked — XP token minting skipped)",
      })
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
      return NextResponse.json({
        success: true,
        onchain: false,
        message: "Lesson recorded (NEXT_PUBLIC_SOLANA_XP_MINT not set — XP minting skipped)",
      })
    }

    // Check if enrollment PDA exists on-chain
    const onchainEnrollment = await connection.getAccountInfo(enrollmentPda)
    if (!onchainEnrollment) {
      return NextResponse.json({
        success: true,
        onchain: false,
        message: "Lesson recorded (no on-chain enrollment found — XP minting skipped)",
      })
    }

    // Derive learner XP ATA (Token-2022)
    const learnerXpAta = deriveXpAta(learner, xpMint)

    // Create the XP ATA if it doesn't exist yet
    const ataInfo = await connection.getAccountInfo(learnerXpAta)
    if (!ataInfo) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        backendSigner.publicKey, // payer
        learnerXpAta,
        learner,
        xpMint,
        TOKEN_2022_PROGRAM_ID
      )
      const { Transaction } = await import("@solana/web3.js")
      const tx = new Transaction().add(createAtaIx)
      tx.feePayer = backendSigner.publicKey
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      tx.sign(backendSigner)
      await connection.sendRawTransaction(tx.serialize())
      // Don't wait for confirmation — complete_lesson will handle it
    }

    // Send complete_lesson instruction
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const signature = await (program.methods as any)
      .completeLesson(lessonIndex)
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

    return NextResponse.json({
      success: true,
      onchain: true,
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}?cluster=devnet`,
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)

    // Known non-fatal errors — lesson may already be complete
    if (msg.includes("LessonAlreadyCompleted")) {
      return NextResponse.json({ success: true, onchain: true, message: "Already marked complete" })
    }

    console.error("[/api/lessons/complete]", msg)
    return NextResponse.json({ error: msg }, { status: 500 })
  }
}
