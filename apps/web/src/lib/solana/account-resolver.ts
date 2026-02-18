import {
  PublicKey,
  SystemProgram,
  Keypair,
  SYSVAR_RENT_PUBKEY,
  SYSVAR_CLOCK_PUBKEY,
} from "@solana/web3.js";
import {
  TOKEN_PROGRAM_ID,
  TOKEN_2022_PROGRAM_ID,
  ASSOCIATED_TOKEN_PROGRAM_ID,
} from "@solana/spl-token";
import { loadKeypair, saveKeypair } from "./keypair-storage";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** PDA seed definition from Anchor 0.32 IDL */
export interface IdlPdaSeed {
  kind: "const" | "account" | "arg";
  value?: number[]; // for "const" seeds — raw byte array
  path?: string; // for "account"/"arg" seeds — reference name
}

/** IDL account entry (supports both Anchor 0.29 and 0.32 formats) */
export interface IdlAccountDef {
  name: string;
  isMut?: boolean;
  isSigner?: boolean;
  writable?: boolean;
  signer?: boolean;
  address?: string;
  /** PDA definition (Anchor 0.32 format) */
  pda?: {
    seeds: IdlPdaSeed[];
  };
}

export interface ResolvedAccount {
  pubkey: PublicKey;
  isSigner: boolean;
  isWritable: boolean;
  source:
    | "wallet"
    | "well-known"
    | "keypair-loaded"
    | "keypair-generated"
    | "manual"
    | "idl-address"
    | "pda";
  label: string;
  keypair?: Keypair;
}

export interface UnresolvedAccount {
  name: string;
  isSigner: boolean;
  isWritable: boolean;
}

export type AccountResolution =
  | { resolved: true; account: ResolvedAccount }
  | { resolved: false; unresolved: UnresolvedAccount };

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

function normalizeAccountName(name: string): string {
  return name.toLowerCase().replace(/_/g, "");
}

// ---------------------------------------------------------------------------
// Well-known account matching
// ---------------------------------------------------------------------------

const WALLET_NAMES = new Set([
  "user",
  "authority",
  "signer",
  "payer",
  "owner",
  "wallet",
]);

const WELL_KNOWN_PROGRAMS: Record<string, PublicKey> = {
  systemprogram: SystemProgram.programId,
  rent: SYSVAR_RENT_PUBKEY,
  clock: SYSVAR_CLOCK_PUBKEY,
  tokenprogram: TOKEN_PROGRAM_ID,
  token2022program: TOKEN_2022_PROGRAM_ID,
  associatedtokenprogram: ASSOCIATED_TOKEN_PROGRAM_ID,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function isMut(acc: IdlAccountDef): boolean {
  return acc.isMut ?? acc.writable ?? false;
}

function isSgn(acc: IdlAccountDef): boolean {
  return acc.isSigner ?? acc.signer ?? false;
}

// ---------------------------------------------------------------------------
// Resolver
// ---------------------------------------------------------------------------

export function resolveAccount(
  acc: IdlAccountDef,
  wallet: PublicKey,
  storagePrefix: string,
  programId?: string
): AccountResolution {
  const normalized = normalizeAccountName(acc.name);
  const writable = isMut(acc);
  const signer = isSgn(acc);

  // 1. IDL provides explicit address (Anchor 0.32)
  if (acc.address) {
    return {
      resolved: true,
      account: {
        pubkey: new PublicKey(acc.address),
        isSigner: false,
        isWritable: false,
        source: "idl-address",
        label: `${acc.name} (IDL)`,
      },
    };
  }

  // 2. Wallet/signer convention
  if (WALLET_NAMES.has(normalized)) {
    return {
      resolved: true,
      account: {
        pubkey: wallet,
        isSigner: true,
        isWritable: writable,
        source: "wallet",
        label: `${acc.name} (your wallet)`,
      },
    };
  }

  // 3. Well-known programs
  const wellKnown =
    WELL_KNOWN_PROGRAMS[normalized] ??
    (normalized.startsWith("tokenkegqe") ? TOKEN_PROGRAM_ID : undefined);
  if (wellKnown) {
    return {
      resolved: true,
      account: {
        pubkey: wellKnown,
        isSigner: false,
        isWritable: false,
        source: "well-known",
        label: `${acc.name} (auto)`,
      },
    };
  }

  // 4. PDA resolution — Anchor 0.32 format
  if (acc.pda?.seeds && programId) {
    try {
      const seedBuffers: Buffer[] = acc.pda.seeds.map((seed) => {
        if (seed.kind === "const" && seed.value) {
          return Buffer.from(seed.value);
        }
        if (seed.kind === "account" && seed.path) {
          // Account reference: wallet-like names resolve to the connected wallet
          const seedNorm = normalizeAccountName(seed.path);
          if (WALLET_NAMES.has(seedNorm)) {
            return wallet.toBuffer();
          }
          throw new Error(`Cannot auto-resolve PDA seed: ${seed.path}`);
        }
        return Buffer.alloc(0);
      });

      const [pda] = PublicKey.findProgramAddressSync(
        seedBuffers,
        new PublicKey(programId)
      );

      return {
        resolved: true,
        account: {
          pubkey: pda,
          isSigner: false, // PDAs are never signers on the client side
          isWritable: writable,
          source: "pda",
          label: `${acc.name} (PDA)`,
        },
      };
    } catch {
      // If PDA derivation fails, fall through to keypair/manual resolution
    }
  }

  // 5. Mut + signer: load existing or generate keypair
  if (writable && signer) {
    const storageKey = `${storagePrefix}-${acc.name}`;
    const existing = loadKeypair(storageKey);
    if (existing) {
      return {
        resolved: true,
        account: {
          pubkey: existing.publicKey,
          isSigner: true,
          isWritable: true,
          source: "keypair-loaded",
          label: `${acc.name} (stored)`,
          keypair: existing,
        },
      };
    }
    const newKp = Keypair.generate();
    saveKeypair(storageKey, newKp);
    return {
      resolved: true,
      account: {
        pubkey: newKp.publicKey,
        isSigner: true,
        isWritable: true,
        source: "keypair-generated",
        label: `${acc.name} (new)`,
        keypair: newKp,
      },
    };
  }

  // 6. Mut + non-signer: load stored keypair
  if (writable && !signer) {
    const storageKey = `${storagePrefix}-${acc.name}`;
    const existing = loadKeypair(storageKey);
    if (existing) {
      return {
        resolved: true,
        account: {
          pubkey: existing.publicKey,
          isSigner: false,
          isWritable: true,
          source: "keypair-loaded",
          label: `${acc.name} (stored)`,
        },
      };
    }
    return {
      resolved: false,
      unresolved: { name: acc.name, isSigner: false, isWritable: true },
    };
  }

  // 7. Unresolved fallback
  return {
    resolved: false,
    unresolved: { name: acc.name, isSigner: signer, isWritable: writable },
  };
}

export function resolveAllAccounts(
  accounts: IdlAccountDef[],
  wallet: PublicKey,
  storagePrefix: string,
  programId?: string
): AccountResolution[] {
  return accounts.map((acc) =>
    resolveAccount(acc, wallet, storagePrefix, programId)
  );
}
