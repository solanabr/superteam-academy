/**
 * Create Course PDAs on-chain via the `create_course` instruction.
 * Runs for every DB course that has an onchainCourseId but no Course PDA on Devnet.
 *
 * Prerequisites:
 *   1. npm run courses:backfill-onchain-ids -- --apply   (sets onchainCourseId in DB)
 *   2. npm run onchain:xp-mint                          (verify program is live, note authority)
 *   3. Set ADMIN_SECRET_KEY in .env                     (must match config.authority on-chain)
 *
 * Usage:
 *   npm run onchain:init-courses            (dry run — shows what would happen)
 *   npm run onchain:init-courses -- --apply (live — sends transactions)
 *
 * See docs/INTEGRATION.md in the superteam-academy repo for the full create_course spec.
 */

import { Connection, PublicKey, SystemProgram } from "@solana/web3.js"
import { BN } from "@coral-xyz/anchor"
import { db } from "@/drizzle/db"
import { CourseTable, CourseSectionTable, LessonTable } from "@/drizzle/schema"
import { isNotNull, eq, count } from "drizzle-orm"
import {
  getAdminSigner,
  getProgram,
  getConfigPda,
  getCoursePda,
  getRpcEndpoint,
  PROGRAM_ID,
} from "@/lib/anchor-program"

// Map DB difficulty → on-chain u8  (1 = beginner, 2 = intermediate, 3 = advanced)
function difficultyToU8(diff: string | null): number {
  if (diff === "intermediate") return 2
  if (diff === "advanced") return 3
  return 1
}

// Map DB track → on-chain trackId u8
function trackToU8(track: string | null): number {
  switch (track) {
    case "defi":     return 2
    case "nft":      return 3
    case "security": return 4
    case "frontend": return 5
    default:         return 1 // fundamentals
  }
}

async function main() {
  const apply = process.argv.includes("--apply")
  const connection = new Connection(getRpcEndpoint(), "confirmed")

  console.log(`Program ID : ${PROGRAM_ID.toBase58()}`)
  console.log(`RPC        : ${getRpcEndpoint()}`)
  console.log(`Mode       : ${apply ? "APPLY (sends transactions)" : "DRY RUN (no transactions)"}`)
  console.log("")

  // Verify program is deployed
  const programInfo = await connection.getAccountInfo(PROGRAM_ID)
  if (!programInfo) {
    throw new Error("Program not found on chain. Check NEXT_PUBLIC_SOLANA_PROGRAM_ID.")
  }

  // Check Config PDA
  const configPda = getConfigPda()
  const configInfo = await connection.getAccountInfo(configPda)
  if (!configInfo || configInfo.data.length < 40) {
    throw new Error(
      `Config PDA not found: ${configPda.toBase58()}\n` +
        "Program not initialized. Contact the Superteam Brazil team."
    )
  }

  const onchainAuthority = new PublicKey(configInfo.data.slice(8, 40))
  console.log(`On-chain authority : ${onchainAuthority.toBase58()}\n`)

  // Load admin keypair and warn if it doesn't match
  const admin = apply ? getAdminSigner() : null
  if (admin && !admin.publicKey.equals(onchainAuthority)) {
    console.warn(
      `⚠️  WARNING: ADMIN_SECRET_KEY public key (${admin.publicKey.toBase58()})\n` +
        `   does NOT match the on-chain authority (${onchainAuthority.toBase58()}).\n` +
        `   Transactions will fail. Export the correct keypair or ask Superteam Brazil.\n`
    )
  }

  // Fetch courses that have onchainCourseId
  const courses = await db
    .select({
      id: CourseTable.id,
      name: CourseTable.name,
      difficulty: CourseTable.difficulty,
      track: CourseTable.track,
      xpReward: CourseTable.xpReward,
      onchainCourseId: CourseTable.onchainCourseId,
    })
    .from(CourseTable)
    .where(isNotNull(CourseTable.onchainCourseId))

  if (courses.length === 0) {
    console.log("No courses with onchainCourseId found.")
    console.log("Run: npm run courses:backfill-onchain-ids -- --apply")
    return
  }

  console.log(`Found ${courses.length} course(s).\n`)

  // Count lessons per course for xpPerLesson calculation
  const lessonCounts = await db
    .select({
      courseId: CourseSectionTable.courseId,
      total: count(LessonTable.id),
    })
    .from(LessonTable)
    .innerJoin(CourseSectionTable, eq(LessonTable.sectionId, CourseSectionTable.id))
    .groupBy(CourseSectionTable.courseId)

  const lessonCountMap = new Map(lessonCounts.map((r) => [r.courseId, r.total]))

  // Build Anchor program client (only needed for --apply)
  const program = apply && admin ? await getProgram(admin) : null

  let initialized = 0
  let skipped = 0
  let failed = 0

  for (const course of courses) {
    const onchainId = course.onchainCourseId!.trim()
    const coursePda = getCoursePda(onchainId)
    const existing = await connection.getAccountInfo(coursePda)

    if (existing) {
      console.log(`✓  SKIP  "${course.name}" — PDA exists (${coursePda.toBase58().slice(0, 8)}...)`)
      skipped++
      continue
    }

    // lesson count: use real count from DB, cap at 256, default to 10
    const rawLessonCount = lessonCountMap.get(course.id) ?? 10
    const lessonCount = Math.min(256, Math.max(1, rawLessonCount))

    // XP per lesson derived from total course XP, default 50
    const xpPerLesson = course.xpReward > 0
      ? Math.max(1, Math.round(course.xpReward / lessonCount))
      : 50

    console.log(`○  INIT  "${course.name}"`)
    console.log(`         courseId    : ${onchainId}`)
    console.log(`         Course PDA  : ${coursePda.toBase58()}`)
    console.log(`         difficulty  : ${difficultyToU8(course.difficulty)} (${course.difficulty ?? "beginner"})`)
    console.log(`         trackId     : ${trackToU8(course.track)} (${course.track ?? "fundamentals"})`)
    console.log(`         lessonCount : ${lessonCount}`)
    console.log(`         xpPerLesson : ${xpPerLesson}`)

    if (!apply || !program || !admin) {
      initialized++
      continue
    }

    // TypeScript narrowing — program and admin are guaranteed non-null here
    const anchorProgram = program
    const adminKp = admin

    try {
      // contentTxId: 32-byte Arweave TX ID — zeros are a valid placeholder.
      // Replace with real TX after uploading course content to Arweave.
      const contentTxId = new Array(32).fill(0)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const signature = await (anchorProgram.methods as any)
        .createCourse({
          courseId: onchainId,
          creator: adminKp.publicKey,      // set to dedicated creator wallet if available
          contentTxId,
          lessonCount,
          difficulty: difficultyToU8(course.difficulty),
          xpPerLesson,
          trackId: trackToU8(course.track),
          trackLevel: 1,
          prerequisite: null,            // add prerequisite courseId string if needed
          creatorRewardXp: new BN(50),
          minCompletionsForReward: 3,
        })
        .accountsPartial({
          course: coursePda,
          config: configPda,
          authority: adminKp.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc()

      console.log(`    ✓ Created! Signature: ${signature}`)
      initialized++

      // Small delay to avoid RPC rate limits
      await new Promise((r) => setTimeout(r, 600))
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      console.error(`    ✗ Failed: ${msg}`)
      failed++
    }
  }

  console.log(`\nResults: ${initialized} created, ${skipped} skipped, ${failed} failed`)

  if (!apply && initialized > 0) {
    console.log("\nRun with --apply to send transactions:")
    console.log("npm run onchain:init-courses -- --apply")
  }
}

main().catch((err) => {
  console.error(`\nFatal: ${err instanceof Error ? err.message : String(err)}`)
  process.exit(1)
})
