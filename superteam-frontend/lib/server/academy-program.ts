import "server-only"

import fs from "fs"
import path from "path"
import {
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js"
import { ACADEMY_CLUSTER, ACADEMY_PROGRAM_ID, ACADEMY_RPC_URL } from "@/lib/generated/academy-program"

const CONFIG_SEED = "config"
const LEARNER_SEED = "learner"
const COURSE_SEED = "course"
const ENROLLMENT_SEED = "enrollment"

const DEVNET_KEYPAIR_PATH = path.join(process.env.HOME ?? "", ".config/solana/devnet.json")
const DEFAULT_KEYPAIR_PATH = path.join(process.env.HOME ?? "", ".config/solana/id.json")

let cachedConnection: Connection | null = null
let cachedBackendKeypair: Keypair | null = null

function keypairPath(): string {
  if (ACADEMY_CLUSTER === "devnet") {
    return fs.existsSync(DEVNET_KEYPAIR_PATH) ? DEVNET_KEYPAIR_PATH : DEFAULT_KEYPAIR_PATH
  }
  return DEFAULT_KEYPAIR_PATH
}

function loadKeypair(): Keypair {
  const kpPath = keypairPath()
  const raw = fs.readFileSync(kpPath, "utf8")
  const secret = Uint8Array.from(JSON.parse(raw) as number[])
  return Keypair.fromSecretKey(secret)
}

function getClient(): { connection: Connection; backend: Keypair } {
  if (cachedConnection && cachedBackendKeypair) {
    return { connection: cachedConnection, backend: cachedBackendKeypair }
  }
  const backend = loadKeypair()
  const connection = new Connection(ACADEMY_RPC_URL, "confirmed")
  cachedConnection = connection
  cachedBackendKeypair = backend
  return { connection, backend }
}

function u16le(value: number): Buffer {
  const b = Buffer.alloc(2)
  b.writeUInt16LE(value, 0)
  return b
}

function u32le(value: number): Buffer {
  const b = Buffer.alloc(4)
  b.writeUInt32LE(value, 0)
  return b
}

function encodeCreateCourseArgs(courseId: string, lessonsCount: number, trackId: number): Buffer {
  const courseIdBytes = Buffer.from(courseId)
  return Buffer.concat([
    Buffer.from([120, 121, 154, 164, 107, 180, 167, 241]), // create_course discriminator
    u32le(courseIdBytes.length),
    courseIdBytes,
    u16le(lessonsCount),
    u16le(trackId),
  ])
}

function decodeEnrollmentLessonsCompleted(data: Buffer): number {
  // 8 bytes discriminator + 32 course + 32 user
  return data.readUInt16LE(8 + 32 + 32)
}

export function deriveConfigPda(): PublicKey {
  return PublicKey.findProgramAddressSync([Buffer.from(CONFIG_SEED)], new PublicKey(ACADEMY_PROGRAM_ID))[0]
}

export function deriveLearnerPda(user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(LEARNER_SEED), user.toBuffer()],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0]
}

export function deriveCoursePda(courseId: string): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(COURSE_SEED), Buffer.from(courseId)],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0]
}

export function deriveEnrollmentPda(course: PublicKey, user: PublicKey): PublicKey {
  return PublicKey.findProgramAddressSync(
    [Buffer.from(ENROLLMENT_SEED), course.toBuffer(), user.toBuffer()],
    new PublicKey(ACADEMY_PROGRAM_ID),
  )[0]
}

export async function ensureCourseOnChain(courseId: string, lessonsCount: number, trackId: number) {
  const { connection, backend } = getClient()
  const coursePda = deriveCoursePda(courseId)
  const existing = await connection.getAccountInfo(coursePda)
  if (existing) return coursePda

  const instruction = new TransactionInstruction({
    programId: new PublicKey(ACADEMY_PROGRAM_ID),
    keys: [
      { pubkey: deriveConfigPda(), isSigner: false, isWritable: true },
      { pubkey: coursePda, isSigner: false, isWritable: true },
      { pubkey: backend.publicKey, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: encodeCreateCourseArgs(courseId, lessonsCount, trackId),
  })
  const tx = new Transaction().add(instruction)
  await sendAndConfirmTransaction(connection, tx, [backend], { commitment: "confirmed" })

  return coursePda
}

export async function fetchLearnerProfile(user: PublicKey): Promise<any | null> {
  const { connection } = getClient()
  const learner = deriveLearnerPda(user)
  const info = await connection.getAccountInfo(learner)
  return info ? { exists: true } : null
}

export async function fetchEnrollment(user: PublicKey, courseId: string): Promise<any | null> {
  const { connection } = getClient()
  const course = deriveCoursePda(courseId)
  const enrollment = deriveEnrollmentPda(course, user)
  const info = await connection.getAccountInfo(enrollment)
  if (!info) return null
  return {
    lessonsCompleted: decodeEnrollmentLessonsCompleted(info.data),
  }
}

export async function completeLessonOnChain(user: PublicKey, courseId: string): Promise<void> {
  const { connection, backend } = getClient()
  const course = deriveCoursePda(courseId)
  const learner = deriveLearnerPda(user)
  const enrollment = deriveEnrollmentPda(course, user)

  const instruction = new TransactionInstruction({
    programId: new PublicKey(ACADEMY_PROGRAM_ID),
    keys: [
      { pubkey: deriveConfigPda(), isSigner: false, isWritable: false },
      { pubkey: learner, isSigner: false, isWritable: true },
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: backend.publicKey, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([77, 217, 53, 132, 204, 150, 169, 58]), // complete_lesson
  })
  const tx = new Transaction().add(instruction)
  await sendAndConfirmTransaction(connection, tx, [backend], { commitment: "confirmed" })
}

export async function finalizeCourseOnChain(user: PublicKey, courseId: string): Promise<void> {
  const { connection, backend } = getClient()
  const course = deriveCoursePda(courseId)
  const learner = deriveLearnerPda(user)
  const enrollment = deriveEnrollmentPda(course, user)

  const instruction = new TransactionInstruction({
    programId: new PublicKey(ACADEMY_PROGRAM_ID),
    keys: [
      { pubkey: deriveConfigPda(), isSigner: false, isWritable: false },
      { pubkey: learner, isSigner: false, isWritable: true },
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: backend.publicKey, isSigner: true, isWritable: false },
    ],
    data: Buffer.from([68, 189, 122, 239, 39, 121, 16, 218]), // finalize_course
  })
  const tx = new Transaction().add(instruction)
  await sendAndConfirmTransaction(connection, tx, [backend], { commitment: "confirmed" })
}
