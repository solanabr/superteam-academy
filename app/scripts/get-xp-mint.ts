import { Connection, PublicKey } from "@solana/web3.js"

const DEFAULT_PROGRAM_ID = "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf"
const DEFAULT_RPC = "https://api.devnet.solana.com"

async function main() {
  const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? DEFAULT_RPC
  const programIdStr = process.env.NEXT_PUBLIC_SOLANA_PROGRAM_ID ?? DEFAULT_PROGRAM_ID
  const programId = new PublicKey(programIdStr)
  const connection = new Connection(rpcUrl, "confirmed")

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    programId
  )

  const accountInfo = await connection.getAccountInfo(configPda)
  if (!accountInfo) {
    throw new Error(`Config PDA not found on chain: ${configPda.toBase58()}`)
  }

  if (!accountInfo.owner.equals(programId)) {
    throw new Error(
      `Config PDA owner mismatch. Expected ${programId.toBase58()}, got ${accountInfo.owner.toBase58()}`
    )
  }

  const data = accountInfo.data
  const minimumLen = 8 + 32 + 32 + 32
  if (data.length < minimumLen) {
    throw new Error(`Unexpected config account size: ${data.length} bytes`)
  }

  const authority = new PublicKey(data.slice(8, 40))
  const backendSigner = new PublicKey(data.slice(40, 72))
  const xpMint = new PublicKey(data.slice(72, 104))

  console.log("Superteam Academy Config")
  console.log(`RPC: ${rpcUrl}`)
  console.log(`Program ID: ${programId.toBase58()}`)
  console.log(`Config PDA: ${configPda.toBase58()}`)
  console.log(`Authority: ${authority.toBase58()}`)
  console.log(`Backend Signer: ${backendSigner.toBase58()}`)
  console.log(`XP Mint: ${xpMint.toBase58()}`)
  console.log("")
  console.log("Add these to your .env:")
  console.log(`NEXT_PUBLIC_SOLANA_PROGRAM_ID=\"${programId.toBase58()}\"`)
  console.log(`NEXT_PUBLIC_SOLANA_XP_MINT=\"${xpMint.toBase58()}\"`)
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error)
  console.error(`Failed to fetch config/xp mint: ${message}`)
  process.exit(1)
})
