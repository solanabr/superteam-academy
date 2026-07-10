/**
 * Rotate `Config.authority` to a new key — the on-chain half of the mainnet
 * custody migration (issue #305).
 *
 * `Config.authority` governs create_course / register_minter / update_config /
 * revoke_minter / deactivate_achievement_type / etc. There is NO CLI for it —
 * only the `update_config` instruction (its `new_authority` field, added in
 * #303) can change it. Use this to hand governance to a Squads multisig vault.
 *
 * The PROGRAM UPGRADE authority is separate — transfer that with the CLI:
 *   solana program set-upgrade-authority 7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V \
 *     --new-upgrade-authority <VAULT> --url "$SOLANA_RPC_URL"
 *
 * Usage (devnet first — dry-run prints, then re-run with --yes to send):
 *   ANCHOR_PROVIDER_URL="$SOLANA_RPC_URL" \
 *   ANCHOR_WALLET=wallets/signer.json \
 *   npx ts-node scripts/rotate-config-authority.ts <NEW_AUTHORITY_PUBKEY> [--yes]
 *
 * ANCHOR_WALLET MUST be the CURRENT `Config.authority` — it co-signs via
 * `has_one`. WARNING: one-step + irreversible; a wrong (but non-zero) key
 * permanently bricks governance. Verify <NEW_AUTHORITY_PUBKEY> carefully.
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { OnchainAcademy } from "../idl/onchain_academy";
import { academyProgram } from "./lib/academy";
import { PublicKey } from "@solana/web3.js";

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = academyProgram();

const [configPda] = PublicKey.findProgramAddressSync(
  [Buffer.from("config")],
  program.programId
);

async function main() {
  const arg = process.argv[2];
  const confirmed = process.argv.includes("--yes");
  if (!arg || arg.startsWith("--")) {
    console.error(
      "Usage: rotate-config-authority.ts <NEW_AUTHORITY_PUBKEY> [--yes]"
    );
    process.exit(1);
  }

  let newAuthority: PublicKey;
  try {
    newAuthority = new PublicKey(arg);
  } catch {
    console.error("Invalid pubkey:", arg);
    process.exit(1);
  }
  if (newAuthority.equals(PublicKey.default)) {
    console.error("Refusing to rotate to the zero pubkey (bricks governance).");
    process.exit(1);
  }

  const config = await program.account.config.fetch(configPda);
  console.log("Config PDA:         ", configPda.toBase58());
  console.log("Current authority:  ", config.authority.toBase58());
  console.log("Signer (must match):", provider.wallet.publicKey.toBase58());
  console.log("New authority:      ", newAuthority.toBase58());

  if (!config.authority.equals(provider.wallet.publicKey)) {
    console.error(
      "\nABORT: ANCHOR_WALLET is not the current Config.authority — it must co-sign."
    );
    process.exit(1);
  }
  if (newAuthority.equals(config.authority)) {
    console.error("\nNo-op: new authority equals the current one.");
    process.exit(0);
  }
  if (!confirmed) {
    console.log(
      "\nDry run (no tx sent). Re-run with --yes to send the IRREVERSIBLE rotation."
    );
    process.exit(0);
  }

  const tx = await program.methods
    .updateConfig({ newBackendSigner: null, paused: null, newAuthority })
    .accountsStrict({ config: configPda, authority: provider.wallet.publicKey })
    .rpc();

  const after = await program.account.config.fetch(configPda);
  console.log("\n✅ Rotated. Tx:", tx);
  console.log("Config.authority is now:", after.authority.toBase58());
  if (!after.authority.equals(newAuthority)) {
    console.error("⚠️  Post-check mismatch — verify manually before trusting!");
    process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
