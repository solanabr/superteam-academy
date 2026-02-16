import { Connection, PublicKey, SystemProgram, Transaction, TransactionInstruction } from "@solana/web3.js"
import { ACADEMY_PROGRAM_ID, ACADEMY_RPC_URL } from "@/lib/generated/academy-program"

const ENROLL_DISCRIMINATOR = Buffer.from([58, 12, 36, 3, 142, 28, 1, 43])

function deriveCoursePda(slug: string): PublicKey {
  const programId = new PublicKey(ACADEMY_PROGRAM_ID)
  const [coursePda] = PublicKey.findProgramAddressSync([Buffer.from("course"), Buffer.from(slug)], programId)
  return coursePda
}

function deriveEnrollmentPda(course: PublicKey, user: PublicKey): PublicKey {
  const programId = new PublicKey(ACADEMY_PROGRAM_ID)
  const [enrollmentPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("enrollment"), course.toBuffer(), user.toBuffer()],
    programId,
  )
  return enrollmentPda
}

export async function sendEnrollCourse(
  sendTransaction: (tx: Transaction, connection: Connection) => Promise<string>,
  walletAddress: string,
  courseSlug: string,
): Promise<string> {
  const user = new PublicKey(walletAddress)
  const programId = new PublicKey(ACADEMY_PROGRAM_ID)
  const course = deriveCoursePda(courseSlug)
  const enrollment = deriveEnrollmentPda(course, user)

  const instruction = new TransactionInstruction({
    programId,
    keys: [
      { pubkey: course, isSigner: false, isWritable: true },
      { pubkey: enrollment, isSigner: false, isWritable: true },
      { pubkey: user, isSigner: true, isWritable: true },
      { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
    ],
    data: ENROLL_DISCRIMINATOR,
  })

  const connection = new Connection(ACADEMY_RPC_URL, "confirmed")
  const tx = new Transaction()
  tx.add(instruction)
  tx.feePayer = user

  const signature = await sendTransaction(tx, connection)
  await connection.confirmTransaction(signature, "confirmed")
  return signature
}
