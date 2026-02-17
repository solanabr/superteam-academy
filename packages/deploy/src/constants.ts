import { PublicKey } from "@solana/web3.js";

export const BPF_LOADER_UPGRADEABLE_ID = new PublicKey(
  "BPFLoaderUpgradeab1e11111111111111111111111"
);

export const SYSVAR_RENT = new PublicKey(
  "SysvarRent111111111111111111111111111111111"
);

export const SYSVAR_CLOCK = new PublicKey(
  "SysvarC1ock11111111111111111111111111111111"
);

/** Bytes of program data per write transaction (~1000 after tx overhead) */
export const CHUNK_SIZE = 1000;

/** Buffer account header size (UpgradeableLoaderState::size_of_buffer_metadata) */
export const BUFFER_HEADER_SIZE = 37;

/** Program account size (pointer to ProgramData) */
export const PROGRAM_ACCOUNT_SIZE = 36;

/** ProgramData header size (slot + optional upgrade authority) */
export const PROGRAM_DATA_HEADER_SIZE = 45;
