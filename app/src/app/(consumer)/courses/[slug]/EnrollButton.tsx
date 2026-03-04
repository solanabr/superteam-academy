"use client"

import { Button } from "@/components/ui/button"
import { enrollInCourse } from "@/features/courses/actions/enroll"
import { PROGRAM_ID, getCoursePda, getEnrollmentPda } from "@/lib/anchor-pda"
import { BookOpen, Loader2 } from "lucide-react"
import { useConnection, useWallet } from "@solana/wallet-adapter-react"
import { useAnchorWallet } from "@solana/wallet-adapter-react"
import { SystemProgram } from "@solana/web3.js"
import { AnchorProvider, Program } from "@coral-xyz/anchor"
import { useRouter } from "next/navigation"
import { useTransition, useRef } from "react"
import { toast } from "sonner"

interface EnrollButtonProps {
  courseId: string
  onchainCourseId: string | null
}

// Cache the IDL to avoid re-fetching on every enroll click
let _idlCache: object | null = null

async function fetchIdl(provider: AnchorProvider): Promise<object | null> {
  if (_idlCache) return _idlCache
  try {
    const idl = await Program.fetchIdl(PROGRAM_ID, provider)
    if (idl) _idlCache = idl
    return idl
  } catch {
    return null
  }
}

export function EnrollButton({ courseId, onchainCourseId }: EnrollButtonProps) {
  const [isPending, startTransition] = useTransition()
  const router = useRouter()
  const { connection } = useConnection()
  const { connected } = useWallet()
  const anchorWallet = useAnchorWallet()

  function handleEnroll() {
    startTransition(async () => {
      if (!connected || !anchorWallet) {
        toast.error("Connect your wallet to enroll.")
        return
      }
      if (!onchainCourseId) {
        toast.error("This course is not mapped to an on-chain course yet.")
        return
      }
      const onchainId = onchainCourseId.trim()
      if (!onchainId) {
        toast.error("Invalid on-chain course ID.")
        return
      }
      if (onchainId.length > 32) {
        toast.error("On-chain course ID is too long (max 32 chars). Please contact admin.")
        return
      }

      const provider = new AnchorProvider(connection, anchorWallet, { commitment: "confirmed" })
      const coursePda = getCoursePda(onchainId)
      const enrollmentPda = getEnrollmentPda(onchainId, anchorWallet.publicKey)

      // Sanity checks before wallet prompt
      const [programInfo, courseInfo] = await Promise.all([
        connection.getAccountInfo(PROGRAM_ID),
        connection.getAccountInfo(coursePda),
      ])

      if (!programInfo) {
        toast.error("On-chain program not found. Make sure your wallet is on Devnet.")
        return
      }
      if (!courseInfo) {
        toast.error(
          `Course PDA not found on-chain (id: ${onchainId}). ` +
            "An admin needs to run: npm run onchain:init-courses -- --apply"
        )
        return
      }

      // Check if enrollment already exists (avoid confusing error from program)
      const existingEnrollment = await connection.getAccountInfo(enrollmentPda)
      if (existingEnrollment) {
        // Already enrolled on-chain — just sync to DB
        const result = await enrollInCourse(courseId)
        if (!result.error) {
          toast.success("Already enrolled! Let's start learning.")
          router.refresh()
        }
        return
      }

      // Fetch IDL (cached after first fetch)
      const idl = await fetchIdl(provider)
      if (!idl) {
        toast.error("Could not fetch program IDL. Try again in a moment.")
        return
      }

      // Build and send enroll transaction via Anchor
      try {
        // Anchor v0.30+: program ID is embedded in the fetched IDL
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const program = new Program(idl as any, provider)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const signature = await (program.methods as any)
          .enroll(onchainId)
          .accountsPartial({
            course: coursePda,
            enrollment: enrollmentPda,
            learner: anchorWallet.publicKey,
            systemProgram: SystemProgram.programId,
          })
          .rpc()

        await connection.confirmTransaction(signature, "confirmed")
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Wallet transaction failed."
        if (msg.includes("no record of a prior credit") || msg.includes("insufficient funds")) {
          toast.error("Your wallet has no Devnet SOL. Get some at faucet.solana.com then try again.")
          return
        }
        // Surface Anchor program error codes in a readable way
        const programError = msg.match(/custom program error: (0x[0-9a-f]+)/i)?.[1]
          ?? msg.match(/"([A-Z][a-zA-Z]+)"/)?.[ 1]
        toast.error(programError ? `Enroll failed: ${programError}` : msg)
        return
      }

      // Sync on-chain enrollment to DB
      const result = await enrollInCourse(courseId)
      if (result.error) {
        toast.error("Enrolled on-chain, but DB sync failed. Refresh the page.")
        return
      }

      toast.success("Enrolled! Let's start learning.")
      router.refresh()
    })
  }

  return (
    <Button
      className="bg-primary text-primary-foreground hover:bg-primary/90"
      onClick={handleEnroll}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <BookOpen className="w-4 h-4 mr-2" />
      )}
      {isPending ? "Enrolling…" : "Enroll for Free"}
    </Button>
  )
}
