import {
  address,
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
} from "@solana/kit";

const TOKEN_2022_PROGRAM_ADDRESS = address(
  "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb",
);
const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = address(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);

/**
 * Derives the Token-2022 Associated Token Account address for the XP mint.
 * Matches INTEGRATION.md: getAssociatedTokenAddressSync(xpMint, owner, false, TOKEN_2022_PROGRAM_ID)
 */
export async function getXpAta(
  owner: Address,
  xpMint: Address,
): Promise<Address> {
  const [ata] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    seeds: [
      getAddressEncoder().encode(owner),
      getAddressEncoder().encode(TOKEN_2022_PROGRAM_ADDRESS),
      getAddressEncoder().encode(xpMint),
    ],
  });
  return ata;
}
