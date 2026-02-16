const anchor = require("@coral-xyz/anchor");

module.exports = async function (provider: any) {
  anchor.setProvider(provider);
  const program = anchor.workspace.SuperteamAcademy;
  const [configPda] = anchor.web3.PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId
  );

  const existing = await provider.connection.getAccountInfo(configPda);
  if (existing) {
    // Config already exists, so migration is idempotent.
    return;
  }

  const authority = provider.wallet.publicKey;
  const backendSigner = provider.wallet.publicKey;
  await program.methods
    .initialize(backendSigner, authority)
    .accounts({
      config: configPda,
      payer: authority,
      systemProgram: anchor.web3.SystemProgram.programId,
    })
    .rpc();
};
