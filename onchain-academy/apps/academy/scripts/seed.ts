import {
  courseDetailExtras,
  extendedModules,
  extendedReviews,
} from '@/libs/constants/courseDetail.constants'
import { lessonContents } from '@/libs/constants/lesson.constants'
import { courses } from '@/libs/constants/mockData'
import { getPayloadClient } from '@/libs/payload'

import { Course } from '@/payload-types'
import * as anchor from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import IDL from '../../../target/idl/onchain_academy.json'
import type { OnchainAcademy } from '../../../target/types/onchain_academy'

const PROGRAM_ID = new PublicKey(IDL.address)

// ─── Type helpers ───────────────────────────────────────────────

const DIFFICULTY_MAP: Record<string, 'beginner' | 'intermediate' | 'advanced'> =
  {
    Beginner: 'beginner',
    Intermediate: 'intermediate',
    Advanced: 'advanced',
  }

const LESSON_TYPE_MAP: Record<
  string,
  'video' | 'reading' | 'code_challenge' | 'quiz' | 'hybrid'
> = {
  Video: 'video',
  Reading: 'reading',
  'Code Challenge': 'code_challenge',
  Quiz: 'quiz',
  Hybrid: 'hybrid',
}

// ─── Seed ───────────────────────────────────────────────────────

async function seed() {
  console.log('🌱 Starting seed process...')
  const payload = await getPayloadClient()

  // ── Find admin user for instructor relationship ──────────────
  let instructorId: number = 0
  try {
    const users = await payload.find({
      collection: 'users',
      where: { role: { equals: 'admin' } },
      limit: 1,
    })

    if (users.docs.length > 0) {
      instructorId = users.docs[0].id as number
      console.log(`👤 Using existing admin user: ${users.docs[0].email}`)
    } else {
      console.log(
        '👤 No admin found — seeding without instructor relationship.',
      )
    }
  } catch (err) {
    console.error('Error fetching users:', err)
  }

  // ── Anchor provider (optional — skip gracefully) ─────────────
  if (!process.env.ANCHOR_PROVIDER_URL || !process.env.ANCHOR_WALLET) {
    try {
      const output = execSync('solana config get', { encoding: 'utf-8' })
      const rpc = output.match(/RPC URL:\s*(.+)/)?.[1]?.trim()
      const walletPath = output.match(/Keypair Path:\s*(.+)/)?.[1]?.trim()
      if (!process.env.ANCHOR_PROVIDER_URL && rpc)
        process.env.ANCHOR_PROVIDER_URL = rpc
      if (!process.env.ANCHOR_WALLET && walletPath) {
        const possiblePaths = [
          path.resolve(process.cwd(), walletPath),
          path.resolve(process.cwd(), '../../', walletPath),
          path.resolve(process.cwd(), '../../wallets/signer.json'),
          walletPath,
        ]
        const validPath = possiblePaths.find((p: string) => fs.existsSync(p))
        if (validPath) process.env.ANCHOR_WALLET = validPath
      }
    } catch {
      console.log('Failed to read solana config automatically.')
    }
  }

  let provider: anchor.AnchorProvider | undefined
  try {
    provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)
  } catch {
    console.warn('⚠️ Could not load AnchorProvider. Skipping on-chain steps.')
  }

  const program = provider
    ? (new anchor.Program(
        IDL as anchor.Idl,
        provider,
      ) as unknown as anchor.Program<OnchainAcademy>)
    : null

  const wallet = provider?.wallet as anchor.Wallet

  if (program && wallet) {
    console.log(`🔗 Anchor connected. Wallet: ${wallet.publicKey.toBase58()}`)
  } else {
    console.log(
      '⚠️ Continuing without on-chain interactions (Anchor not configured)',
    )
  }

  let configPda: PublicKey | undefined
  if (program) {
    ;[configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID,
    )
  }

  // ═══════════════════════════════════════════════════════════════
  //  Main Loop — one course at a time
  // ═══════════════════════════════════════════════════════════════

  for (const course of courses) {
    const slug = course.slug
    console.log(`\n📚 Processing: ${course.title} (${slug})`)

    const extra = courseDetailExtras[slug]
    // Use extendedModules when available (contains full lesson trees for all courses)
    const modules = extendedModules[slug] || course.modules

    // ── 1. On-chain (optional) ─────────────────────────────────
    if (program && wallet && configPda) {
      const [coursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('course'), Buffer.from(slug)],
        PROGRAM_ID,
      )

      let onchainExists = false
      try {
        await program.account.course.fetch(coursePda)
        onchainExists = true
        console.log(
          `   ✅ On-chain course already exists: ${coursePda.toBase58()}`,
        )
      } catch {
        // doesn't exist yet
      }

      if (!onchainExists) {
        try {
          console.log(`   ⏳ Creating on-chain course…`)
          const totalLessons = modules.reduce(
            (acc, m) => acc + m.lessons.length,
            0,
          )

          await program.methods
            .createCourse({
              courseId: slug,
              creator: wallet.publicKey,
              contentTxId: Array.from(
                Buffer.from('mock-arweave-tx-id'.padEnd(32, '0')),
              ).slice(0, 32),
              lessonCount: totalLessons,
              difficulty:
                course.difficulty === 'Beginner'
                  ? 1
                  : course.difficulty === 'Intermediate'
                    ? 2
                    : 3,
              xpPerLesson: Math.floor(course.xp / Math.max(totalLessons, 1)),
              trackId: 1,
              trackLevel: 1,
              prerequisite: null,
              creatorRewardXp: 100,
              minCompletionsForReward: 5,
            })
            .accountsPartial({
              course: coursePda,
              config: configPda,
              authority: wallet.publicKey,
              systemProgram: SystemProgram.programId,
            })
            .rpc()
          console.log(`   ✅ On-chain course created!`)
        } catch (e) {
          console.error(
            `   ❌ Failed to create on-chain course:`,
            e instanceof Error ? e.message : String(e),
          )
        }
      }
    }

    // ── 2. Payload — upsert course with ALL fields ─────────────
    let payloadCourseId: string | number | undefined

    try {
      const existing = await payload.find({
        collection: 'courses',
        where: { slug: { equals: slug } },
      })

      const totalLessonsComputed = modules.reduce(
        (acc, m) => acc + m.lessons.length,
        0,
      )

      // Build richText longDescription from plain string
      // Payload's default Lexical richText accepts a Lexical JSON structure
      const longDescriptionLexical:
        | {
            root: {
              type: string
              children: {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                type: any
                version: number
                [k: string]: unknown
              }[]
              direction: ('ltr' | 'rtl') | null
              format:
                | 'left'
                | 'start'
                | 'center'
                | 'right'
                | 'end'
                | 'justify'
                | ''
              indent: number
              version: number
            }
            [k: string]: unknown
          }
        | undefined = extra?.longDescription
        ? {
            root: {
              type: 'root',
              children: [
                {
                  type: 'paragraph',
                  children: [
                    { type: 'text', text: extra.longDescription, version: 1 },
                  ],
                  version: 1,
                },
              ],
              direction: null,
              format: '',
              indent: 0,
              version: 1,
            },
          }
        : undefined

      const courseData: Partial<Course> = {
        title: course.title,
        slug,
        description: course.description,
        difficulty: DIFFICULTY_MAP[course.difficulty] ?? 'beginner',
        duration: course.duration,
        xpReward: course.xp || 0,
        topic: course.topic,
        status: 'published' as const,
        trackId: 1,
        trackLevel: 1,
        onChainCourseId: slug,
        totalLessons: totalLessonsComputed,
        // ...(instructorId ? { instructor: instructorId } : {}),
        // ─ New fields ─
        // ...(longDescriptionLexical
        //   ? { longDescription: longDescriptionLexical }
        //   : {}),
        longDescription: longDescriptionLexical || undefined,
        instructor: instructorId,
        learningOutcomes: (extra?.learningOutcomes ?? []).map((o) => ({
          outcome: o,
        })),
        prerequisites: (extra?.prerequisites ?? []).map((p) => ({
          prerequisite: p,
        })),
        enrollmentCount: extra?.enrolledCount ?? 0,
        rating: extra?.rating ?? 0,
        ratingCount: extra?.ratingCount ?? 0,
        lastUpdated: extra?.lastUpdated ?? '',
        language: extra?.language ?? 'English',
        certificate: extra?.certificate ?? false,
        onChainCredential: extra?.onChainCredential ?? false,
        // instructor: instructorId,
        // longDescription: ''
      }

      if (existing.docs.length > 0) {
        payloadCourseId = existing.docs[0].id
        console.log(`   ↻  Updating Payload course: ${payloadCourseId}`)
        await payload.update({
          collection: 'courses',
          id: payloadCourseId as number,
          data: courseData,
        })
      } else {
        console.log(`   ⏳ Creating Payload course…`)
        const created = await payload.create({
          collection: 'courses',
          data: courseData as Course,
        })
        payloadCourseId = created.id
        console.log(`   ✅ Payload course created: ${payloadCourseId}`)
      }

      // ── 3. Modules & Lessons ─────────────────────────────────
      if (payloadCourseId) {
        let sortOrderMod = 0
        let onChainLessonIndex = 0

        for (const mod of modules) {
          // Find or create module
          let payloadModuleId: string | number

          const existingMod = await payload.find({
            collection: 'modules',
            where: {
              title: { equals: mod.title },
              course: { equals: payloadCourseId },
            },
          })

          if (existingMod.docs.length > 0) {
            payloadModuleId = existingMod.docs[0].id
            console.log(`   📦 Module exists: ${mod.title}`)
          } else {
            const createdMod = await payload.create({
              collection: 'modules',
              data: {
                title: mod.title,
                course: payloadCourseId,
                sortOrder: sortOrderMod,
              },
            })
            payloadModuleId = createdMod.id
            console.log(`   📦 Module created: ${mod.title}`)
          }
          sortOrderMod++

          // Lessons
          let sortOrderLes = 0
          for (const les of mod.lessons) {
            // Pull xpReward from lessonContents if it exists (solana-fundamentals)
            const detail = lessonContents[les.id]
            const xpReward = detail?.xpReward ?? 50

            let payloadLessonId: string | number

            const existingLes = await payload.find({
              collection: 'lessons',
              where: {
                title: { equals: les.title },
                module: { equals: payloadModuleId },
              },
            })

            if (existingLes.docs.length > 0) {
              payloadLessonId = existingLes.docs[0].id
            } else {
              const createdLes = await payload.create({
                collection: 'lessons',
                data: {
                  title: les.title,
                  module: payloadModuleId,
                  type: LESSON_TYPE_MAP[les.type] ?? 'reading',
                  duration: les.duration,
                  xpReward,
                  sortOrder: sortOrderLes,
                  onChainLessonIndex,
                },
              })
              payloadLessonId = createdLes.id
              console.log(`     ✔  Lesson: ${les.title}`)
            }
            sortOrderLes++
            onChainLessonIndex++

            // ── 4. Lesson Contents ─────────────────────────────
            if (detail) {
              const existingContent = await payload.find({
                collection: 'lesson-contents',
                where: { lesson: { equals: payloadLessonId } },
              })

              if (existingContent.docs.length === 0) {
                const blocks = detail.blocks.map((b) => {
                  if (b.type === 'markdown')
                    return { blockType: 'markdown', content: b.content }
                  if (b.type === 'video')
                    return {
                      blockType: 'video',
                      url: b.url,
                      videoTitle: b.title,
                    }
                  if (b.type === 'callout')
                    return {
                      blockType: 'callout',
                      calloutVariant: b.variant,
                      content: b.content,
                    }
                  return { blockType: 'markdown', content: '' }
                })

                let challengeData: Record<string, unknown> | null = null
                if (detail.challenge) {
                  challengeData = {
                    prompt: detail.challenge.prompt,
                    objectives: detail.challenge.objectives.map((o) => ({
                      objective: o,
                    })),
                    starterCode: detail.challenge.starterCode || '',
                    language: detail.challenge.language || 'typescript',
                    expectedOutput: detail.challenge.expectedOutput || '',
                    solutionCode: detail.challenge.solutionCode || '',
                    testCases:
                      detail.challenge.testCases?.map((tc) => ({
                        name: tc.name,
                        expected: tc.expected,
                      })) || [],
                  }
                }

                let quizData: Record<string, unknown> | null = null
                if (detail.quiz) {
                  quizData = {
                    questions: detail.quiz.questions.map((q) => ({
                      questionType: q.type,
                      prompt: q.prompt,
                      options: q.options?.map((o) => ({ option: o })) || [],
                      correctIndex: q.correctIndex,
                      correctIndices: q.correctIndices,
                      starterCode: q.starterCode || '',
                      language: q.language || '',
                      expected: q.expected || '',
                    })),
                  }
                }

                await payload.create({
                  collection: 'lesson-contents',
                  data: {
                    lesson: payloadLessonId as number,
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    blocks: blocks as any,
                    hints: detail.hints?.map((h) => ({ hint: h })) || [],
                    solution: detail.solution || '',
                    ...(challengeData
                      ? { challenge: challengeData as Record<string, unknown> }
                      : {}),
                    ...(quizData
                      ? { quiz: quizData as Record<string, unknown> }
                      : {}),
                  },
                })
                console.log(`       📄 Content seeded for: ${les.title}`)
              }
            }
          }
        }

        // ── 5. Reviews ─────────────────────────────────────────
        // Use extendedReviews when available, fall back to course.reviews
        const allReviews = [
          ...(extendedReviews[slug] || []),
          ...(slug === 'solana-fundamentals' ? course.reviews : []),
        ]

        for (const review of allReviews) {
          // Idempotency check: match on reviewerName + course
          const existingReview = await payload.find({
            collection: 'reviews',
            where: {
              course: { equals: payloadCourseId },
              reviewerName: { equals: review.name },
            },
          })

          if (existingReview.docs.length === 0) {
            await payload.create({
              collection: 'reviews',
              data: {
                course: payloadCourseId as number,
                reviewerName: review.name,
                rating: review.rating,
                text: review.text,
                displayDate: review.date,
                status: 'approved', // seeded reviews are pre-approved
              },
            })
            console.log(
              `     ⭐ Review seeded: ${review.name} (${review.rating}★)`,
            )
          }
        }
      }
    } catch (e) {
      console.error(`   ❌ Failed Payload sync for ${slug}:`, e)
    }
  }

  console.log('\n🎉 Seeding complete!')
  process.exit(0)
}

seed().catch(console.error)
