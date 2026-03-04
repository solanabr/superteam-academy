import { Program, AnchorProvider } from "@coral-xyz/anchor";
import type { Idl } from "@coral-xyz/anchor";
import { Connection, PublicKey } from "@solana/web3.js";
import { SOLANA_RPC_URL } from "./constants";
import type { AnchorWallet } from "@solana/wallet-adapter-react";

let _connection: Connection | null = null;

export function getConnection(): Connection {
  if (!_connection) {
    _connection = new Connection(SOLANA_RPC_URL, "confirmed");
  }
  return _connection;
}

const READ_ONLY_WALLET: AnchorWallet = {
  publicKey: PublicKey.default,
  signTransaction: () => { throw new Error("Read-only provider cannot sign transactions"); },
  signAllTransactions: () => { throw new Error("Read-only provider cannot sign transactions"); },
};

export function getReadOnlyProvider(): AnchorProvider {
  const connection = getConnection();
  return new AnchorProvider(connection, READ_ONLY_WALLET, { commitment: "confirmed" });
}

let _idl: Idl | null = null;
async function getIdl(): Promise<Idl> {
  if (!_idl) {
    _idl = (await import("./idl/onchain_academy.json")).default as Idl;
  }
  return _idl;
}

let _program: Program | null = null;

export async function getProgram(provider?: AnchorProvider): Promise<Program> {
  const idl = await getIdl();
  if (!provider) {
    if (_program) return _program;
    const prov = getReadOnlyProvider();
    _program = new Program(idl, prov);
    return _program;
  }
  return new Program(idl, provider);
}

export async function getProgramWithWallet(wallet: AnchorWallet): Promise<Program> {
  const idl = await getIdl();
  const connection = getConnection();
  const provider = new AnchorProvider(connection, wallet, { commitment: "confirmed" });
  return new Program(idl, provider);
}
