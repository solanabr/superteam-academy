/**
 * Server-only singleton layer for the Superteam Academy on-chain program.
 *
 * Provides lazy-initialized Connection, backend signer Keypair,
 * and Anchor Program instance used by API routes.
 *
 * This module must ONLY be imported from API routes (server-side).
 */

import { Connection, Keypair, clusterApiUrl } from "@solana/web3.js";
import type { Idl } from "@coral-xyz/anchor";
import { AnchorProvider, Program } from "@coral-xyz/anchor";
import NodeWallet from "@coral-xyz/anchor/dist/cjs/nodewallet";
import IDL from "./idl/superteam_academy.json";
import { findConfigPDA, PROGRAM_ID } from "./pda";

export { PROGRAM_ID } from "./pda";
export * from "./pda";

// ---------------------------------------------------------------------------
// Layer 2: Setup — server-only lazy singletons
// ---------------------------------------------------------------------------

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (_connection) return _connection;
  const rpcUrl =
    process.env.NEXT_PUBLIC_SOLANA_RPC_URL ?? clusterApiUrl("devnet");
  _connection = new Connection(rpcUrl, "confirmed");
  return _connection;
}

let _backendSigner: Keypair | null = null;

export function getBackendSigner(): Keypair {
  if (_backendSigner) return _backendSigner;
  const secret = process.env.BACKEND_SIGNER_SECRET;
  if (!secret) {
    throw new Error(
      "BACKEND_SIGNER_SECRET env var not set. Required for on-chain instructions."
    );
  }
  const secretKey = Uint8Array.from(JSON.parse(secret));
  _backendSigner = Keypair.fromSecretKey(secretKey);
  return _backendSigner;
}

let _serverProgram: Program | null = null;

export function getProgram(): Program {
  if (_serverProgram) return _serverProgram;
  const connection = getConnection();
  const signer = getBackendSigner();
  const provider = new AnchorProvider(connection, new NodeWallet(signer), {
    commitment: "confirmed",
  });
  _serverProgram = new Program(IDL as unknown as Idl, provider);
  return _serverProgram;
}

// ---------------------------------------------------------------------------
// Deployment check — cached permanently after first true
// ---------------------------------------------------------------------------

let _programLive: boolean | null = null;
let _programLiveCheckedAt = 0;
const CACHE_TTL = 60_000;

export async function isOnChainProgramLive(): Promise<boolean> {
  if (_programLive === true) return true;

  if (_programLive !== null && Date.now() - _programLiveCheckedAt < CACHE_TTL) {
    return _programLive;
  }

  const connection = getConnection();
  const [configPDA] = findConfigPDA(PROGRAM_ID);
  const account = await connection.getAccountInfo(configPDA);
  _programLive = account !== null;
  _programLiveCheckedAt = Date.now();
  return _programLive;
}
