/**
 * Load program + provider for standalone script runs (e.g. devnet).
 * When run via `anchor test`, use anchor.workspace instead.
 */
import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import type { OnchainAcademy } from "../target/types/onchain_academy";
import * as path from "path";
import * as fs from "fs";

export function getProvider(): anchor.AnchorProvider {
  const provider = anchor.AnchorProvider.env();
  anchor.setProvider(provider);
  return provider;
}

export function getProgram(): Program<OnchainAcademy> {
  const provider = getProvider();
  const idlPath = path.join(__dirname, "../target/idl/onchain_academy.json");
  const idl = JSON.parse(fs.readFileSync(idlPath, "utf-8"));
  return new Program(idl, provider) as Program<OnchainAcademy>;
}
