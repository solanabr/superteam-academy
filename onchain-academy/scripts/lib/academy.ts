import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import idlJson from "../../idl/onchain_academy.json";
import { OnchainAcademy } from "../../idl/onchain_academy";

/**
 * Builds the program from the committed IDL (`idl/onchain_academy.json`) against
 * the ambient Anchor provider. `ACADEMY_PROGRAM_ID` overrides the address for a
 * non-default deployment of the same program (e.g. the pinocchio fresh-id devnet
 * instance — docs/DEPLOY-PROGRAM.md § "Fresh devnet instance").
 *
 * Call after `anchor.setProvider(AnchorProvider.env())`.
 */
export function academyProgram(): Program<OnchainAcademy> {
  const override = process.env.ACADEMY_PROGRAM_ID;
  const idl = {
    ...(idlJson as OnchainAcademy),
    ...(override ? { address: override } : {}),
  } as OnchainAcademy;
  return new Program<OnchainAcademy>(idl, anchor.getProvider());
}
