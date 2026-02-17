import * as anchor from "@coral-xyz/anchor"

const COURSES = [
  { slug: "solana-fundamentals", lessonsCount: 12, trackId: 1 },
  { slug: "anchor-framework", lessonsCount: 6, trackId: 2 },
  { slug: "defi-development", lessonsCount: 3, trackId: 3 },
  { slug: "nft-marketplace", lessonsCount: 2, trackId: 4 },
  { slug: "web3-security", lessonsCount: 2, trackId: 5 },
  { slug: "rust-for-blockchain", lessonsCount: 3, trackId: 6 },
] as const

async function main() {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.SuperteamAcademy as anchor.Program
  const authority = provider.wallet.publicKey

  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  )

  const configAccount = await provider.connection.getAccountInfo(configPda)
  if (!configAccount) {
    console.error("Config not initialized. Run init-config.ts first.")
    process.exit(1)
  }

  for (const course of COURSES) {
    const [coursePda] = anchor.web3.PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(course.slug)],
      program.programId,
    )

    const existing = await provider.connection.getAccountInfo(coursePda)
    if (existing) {
      console.log(`[skip] ${course.slug} already exists: ${coursePda.toBase58()}`)
      continue
    }

    const signature = await program.methods
      .createCourse(course.slug, course.lessonsCount, course.trackId)
      .accounts({
        config: configPda,
        course: coursePda,
        authority,
        systemProgram: anchor.web3.SystemProgram.programId,
      })
      .rpc()

    console.log(`[created] ${course.slug} → ${coursePda.toBase58()} (tx: ${signature})`)
  }

  console.log("Done. All courses seeded.")
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
