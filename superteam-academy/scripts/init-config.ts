import * as anchor from "@coral-xyz/anchor"

async function main() {
  const provider = anchor.AnchorProvider.env()
  anchor.setProvider(provider)

  const program = anchor.workspace.SuperteamAcademy as anchor.Program
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  )

  const existing = await provider.connection.getAccountInfo(configPda)
  if (existing) {
    console.log(`Config already initialized: ${configPda.toBase58()}`)
    return
  }

  const signer = provider.wallet.publicKey
  const signature = await program.methods
    .initialize(signer, signer)
    .accounts({
      config: configPda,
      payer: signer,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc()

  console.log(`Config initialized: ${configPda.toBase58()}`)
  console.log(`Signature: ${signature}`)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
