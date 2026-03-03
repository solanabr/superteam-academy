import { Program, AnchorProvider, BN, type Idl } from '@coral-xyz/anchor';
import { PublicKey, Connection, Keypair, Transaction, VersionedTransaction } from '@solana/web3.js';
import IDL from './academy.json';
import { PROGRAM_ID } from './constants';
import { normalizeAnchorIdl } from './idl-compat';

const PROGRAM_IDL = {
  ...normalizeAnchorIdl(IDL as Record<string, unknown>),
  address: PROGRAM_ID.toBase58(),
};

/**
 * Initialize Anchor program instance
 * For browser/frontend use with wallet adapter provider
 */
export function getProgram(provider: AnchorProvider): Program {
  return new Program(PROGRAM_IDL as Idl, provider);
}

/**
 * Initialize Anchor program with custom connection and keypair
 * For backend use with server signer
 */
export function getProgramWithKeypair(
  connection: Connection,
  payer: Keypair
): Program {
  const provider = new AnchorProvider(
    connection,
    {
      publicKey: payer.publicKey,
      signAllTransactions: async <T extends Transaction | VersionedTransaction>(txs: T[]): Promise<T[]> => txs,
      signTransaction: async <T extends Transaction | VersionedTransaction>(tx: T): Promise<T> => tx,
    },
    { commitment: 'confirmed' }
  );

  return new Program(PROGRAM_IDL as Idl, provider);
}

/**
 * Convert BN to number safely (for display)
 */
export function bnToNumber(value: BN): number {
  return value.toNumber();
}

/**
 * Convert number to BN
 */
export function numberToBn(value: number): BN {
  return new BN(value);
}

/**
 * Create BN with large value (for I80F48 fixed-point)
 */
export function createI80F48(value: number | bigint): { value: BN } {
  return {
    value: new BN(value),
  };
}
