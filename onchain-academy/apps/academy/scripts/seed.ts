import {
  courseDetailExtras,
  extendedModules,
} from '@/libs/constants/courseDetail.constants'
import { lessonContents } from '@/libs/constants/lesson.constants'
import { courses } from '@/libs/constants/mockData'
import { getPayloadClient } from '@/libs/payload'

import * as anchor from '@coral-xyz/anchor'
import { PublicKey, SystemProgram } from '@solana/web3.js'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import IDL from '../../../target/idl/onchain_academy.json'
import type { OnchainAcademy } from '../../../target/types/onchain_academy'

const PROGRAM_ID = new PublicKey(IDL.address)

async function seed() {
  console.log('🌱 Starting seed process...')
  const payload = await getPayloadClient()

  let instructorId: number | undefined
  try {
    const users = await payload.find({
      collection: 'users',
      where: {
        role: { equals: 'admin' },
      },
      limit: 1,
    })
    console.log('user', users)

    if (users.docs.length > 0) {
      instructorId = users.docs[0].id as number
      console.log(`👤 Using existing admin user: ${users.docs[0].email}`)
    } else {
      console.log(
        '👤 No admin found. Please create one in Payload first or we will try without instructor.',
      )
    }
  } catch (err: unknown) {
    console.error('Error fetching users:', err)
  }

  // Anchor provider
  if (!process.env.ANCHOR_PROVIDER_URL || !process.env.ANCHOR_WALLET) {
    try {
      const output = execSync('solana config get', { encoding: 'utf-8' })
      const rpc = output.match(/RPC URL:\s*(.+)/)?.[1]?.trim()
      const walletPath = output.match(/Keypair Path:\s*(.+)/)?.[1]?.trim()

      if (!process.env.ANCHOR_PROVIDER_URL && rpc) {
        process.env.ANCHOR_PROVIDER_URL = rpc
      }
      if (!process.env.ANCHOR_WALLET && walletPath) {
        const possiblePaths = [
          path.resolve(process.cwd(), walletPath),
          path.resolve(process.cwd(), '../../', walletPath),
          path.resolve(process.cwd(), '../../wallets/signer.json'),
          walletPath,
        ]
        const validPath = possiblePaths.find((p: string) => fs.existsSync(p))
        if (validPath) {
          process.env.ANCHOR_WALLET = validPath
        }
      }
    } catch (e) {
      console.log('Failed to read solana config automatically.')
    }
  }

  let provider: anchor.AnchorProvider | undefined
  try {
    provider = anchor.AnchorProvider.env()
    anchor.setProvider(provider)
  } catch {
    console.warn(
      '⚠️ Could not load AnchorProvider from env. Ensure ANCHOR_WALLET is set if testing on-chain.',
    )
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
      `⚠️ Continuing without on-chain interactions (Anchor not configured)`,
    )
  }

  let configPda: PublicKey | undefined
  if (program) {
    ;[configPda] = PublicKey.findProgramAddressSync(
      [Buffer.from('config')],
      PROGRAM_ID,
    )
  }

  for (const course of courses) {
    console.log(`\n📚 Processing course: ${course.title} (${course.slug})`)
    const extra = courseDetailExtras[course.slug]
    const modules = extendedModules[course.slug] || course.modules

    // 1. Initialize Course On-Chain
    if (program && wallet && configPda) {
      const [coursePda] = PublicKey.findProgramAddressSync(
        [Buffer.from('course'), Buffer.from(course.slug)],
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
        // Doesn't exist
      }

      if (!onchainExists) {
        try {
          console.log(`   ⏳ Creating on-chain course for ${course.slug}...`)
          const totalLessons = modules.reduce(
            (acc, m) => acc + m.lessons.length,
            0,
          )

          await program.methods
            .createCourse({
              courseId: course.slug,
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
        } catch (e: unknown) {
          console.error(
            `   ❌ Failed to create on-chain course:`,
            e instanceof Error ? e.message : String(e),
          )
        }
      }
    }

    // 2. Create in Payload Off-Chain
    let payloadCourseId: string | number | undefined
    try {
      const existing = await payload.find({
        collection: 'courses',
        where: { slug: { equals: course.slug } },
      })

      if (existing.docs.length > 0) {
        payloadCourseId = existing.docs[0].id
        console.log(`   ✅ Payload course already exists: ${payloadCourseId}`)
      } else {
        console.log(`   ⏳ Creating Payload course...`)
        const created = await payload.create({
          collection: 'courses',
          data: {
            title: course.title,
            slug: course.slug,
            description: course.description,
            difficulty: course.difficulty.toLowerCase() as
              | 'beginner'
              | 'intermediate'
              | 'advanced',
            duration: course.duration,
            xpReward: course.xp || 0,
            topic: course.topic,
            status: 'published',
            trackId: 1,
            trackLevel: 1,
            onChainCourseId: course.slug,
            ...(instructorId ? { instructor: instructorId } : {}),
            certificate: extra?.certificate ?? false,
            onChainCredential: extra?.onChainCredential ?? false,
          },
        })
        payloadCourseId = created.id
        console.log(`   ✅ Payload course created: ${payloadCourseId}`)
      }

      if (payloadCourseId) {
        let sortOrderMod = 0
        let onChainLessonIndex = 0

        for (const mod of modules) {
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
          }
          sortOrderMod++

          let sortOrderLes = 0
          for (const les of mod.lessons) {
            let payloadLessonId: string | number

            const typeMap: Record<string, string> = {
              Video: 'video',
              Reading: 'reading',
              'Code Challenge': 'code_challenge',
              Quiz: 'quiz',
              Hybrid: 'hybrid',
            }

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
                  type: (typeMap[les.type] || 'reading') as
                    | 'video'
                    | 'reading'
                    | 'code_challenge'
                    | 'quiz'
                    | 'hybrid',
                  duration: les.duration,
                  xpReward: 50,
                  sortOrder: sortOrderLes,
                  onChainLessonIndex: onChainLessonIndex,
                },
              })
              payloadLessonId = createdLes.id
            }
            sortOrderLes++
            onChainLessonIndex++

            const detail = lessonContents[les.id]
            if (detail) {
              const existingDetails = await payload.find({
                collection: 'lesson-contents',
                where: {
                  lesson: { equals: payloadLessonId },
                },
              })

              if (existingDetails.docs.length === 0) {
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
                    blocks: blocks as Record<string, unknown>[],
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
                console.log(`     ✔️ Lesson content added for: ${les.title}`)
              }
            }
          }
        }
      }
    } catch (e: unknown) {
      console.error(`   ❌ Failed Payload sync for ${course.slug}:`, e)
    }
  }

  console.log('\n🎉 Seeding complete!')
  process.exit(0)
}

seed().catch(console.error)
