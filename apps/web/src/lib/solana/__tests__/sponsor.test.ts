/* eslint-disable import/order -- vi.mock factories are hoisted above imports. */
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { Keypair } from "@solana/web3.js";
import type { Connection } from "@solana/web3.js";

const h = vi.hoisted(() => ({
  env: {} as Record<string, string | undefined>,
  logEvent: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env.server", () => ({
  serverEnv: new Proxy({}, { get: (_target, key: string) => h.env[key] }),
}));
vi.mock("@/lib/logging", () => ({ logEvent: h.logEvent }));

import { DEVNET_GENESIS_HASH, MAINNET_GENESIS_HASH } from "../network";
import {
  getPlatformPayerKeys,
  resetSponsorStateForTests,
  resolveFeePayer,
  SponsorUnavailableError,
  type FeePayer,
} from "../sponsor";

const sponsor = Keypair.generate();
const backend = Keypair.generate();
const secret = (kp: Keypair) => JSON.stringify(Array.from(kp.secretKey));

function connection(
  rpcEndpoint: string,
  genesis: () => Promise<string>
): Connection & { getGenesisHash: ReturnType<typeof vi.fn> } {
  return {
    rpcEndpoint,
    getGenesisHash: vi.fn(genesis),
  } as unknown as Connection & { getGenesisHash: ReturnType<typeof vi.fn> };
}

const fallback = (): FeePayer => ({ keypair: backend, role: "backend" });
// A host that names no cluster, so only the genesis lookup can decide.
const PRIVATE_RPC = "https://rpc.example.com/?api-key=x";

beforeEach(() => {
  h.env = {};
  h.logEvent.mockReset();
  resetSponsorStateForTests();
  delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
});

afterEach(() => {
  delete process.env.NEXT_PUBLIC_SOLANA_NETWORK;
});

describe("resolveFeePayer", () => {
  it("uses the sponsor wallet whenever SPONSOR_SECRET is set", async () => {
    h.env.SPONSOR_SECRET = secret(sponsor);
    const conn = connection(PRIVATE_RPC, async () => MAINNET_GENESIS_HASH);

    const payer = await resolveFeePayer(conn, fallback);

    expect(payer.role).toBe("sponsor");
    expect(payer.keypair.publicKey.equals(sponsor.publicKey)).toBe(true);
    // No cluster lookup is needed when the sponsor exists.
    expect(conn.getGenesisHash).not.toHaveBeenCalled();
  });

  it("fails closed on a mainnet RPC without SPONSOR_SECRET", async () => {
    const conn = connection(
      "https://mainnet.helius-rpc.com/?api-key=x",
      async () => MAINNET_GENESIS_HASH
    );
    await expect(resolveFeePayer(conn, fallback)).rejects.toBeInstanceOf(
      SponsorUnavailableError
    );
  });

  it("fails closed when the network label says mainnet, whatever the host", async () => {
    process.env.NEXT_PUBLIC_SOLANA_NETWORK = "mainnet";
    const conn = connection(PRIVATE_RPC, async () => DEVNET_GENESIS_HASH);
    await expect(resolveFeePayer(conn, fallback)).rejects.toBeInstanceOf(
      SponsorUnavailableError
    );
  });

  it("fails closed on a private RPC that answers with mainnet's genesis", async () => {
    const conn = connection(PRIVATE_RPC, async () => MAINNET_GENESIS_HASH);
    await expect(resolveFeePayer(conn, fallback)).rejects.toBeInstanceOf(
      SponsorUnavailableError
    );
  });

  it("fails closed when the cluster cannot be verified", async () => {
    const conn = connection(PRIVATE_RPC, async () => {
      throw new Error("rpc down");
    });
    await expect(resolveFeePayer(conn, fallback)).rejects.toBeInstanceOf(
      SponsorUnavailableError
    );
  });

  it("falls back to the backend signer on verified devnet, and says so once", async () => {
    const conn = connection(PRIVATE_RPC, async () => DEVNET_GENESIS_HASH);

    const first = await resolveFeePayer(conn, fallback);
    const second = await resolveFeePayer(conn, fallback);

    expect(first.role).toBe("backend");
    expect(second.keypair.publicKey.equals(backend.publicKey)).toBe(true);
    expect(h.logEvent).toHaveBeenCalledTimes(1);
    expect(h.logEvent.mock.calls[0]?.[0]).toMatchObject({
      event: "SPONSOR_001",
    });
    // The verified answer is reused; a failure would not have been.
    expect(conn.getGenesisHash).toHaveBeenCalledTimes(1);
  });

  it("does not cache a failed cluster check", async () => {
    let calls = 0;
    const conn = connection(PRIVATE_RPC, async () => {
      calls += 1;
      if (calls === 1) throw new Error("rpc down");
      return DEVNET_GENESIS_HASH;
    });

    await expect(resolveFeePayer(conn, fallback)).rejects.toBeInstanceOf(
      SponsorUnavailableError
    );
    await expect(resolveFeePayer(conn, fallback)).resolves.toMatchObject({
      role: "backend",
    });
  });
});

describe("getPlatformPayerKeys", () => {
  it("maps every configured platform key to its role", () => {
    h.env.SPONSOR_SECRET = secret(sponsor);
    h.env.BACKEND_SIGNER_SECRET = secret(backend);
    h.env.PROGRAM_AUTHORITY_SECRET = "not json";

    const keys = getPlatformPayerKeys();

    expect(keys.get(sponsor.publicKey.toBase58())).toBe("sponsor");
    expect(keys.get(backend.publicKey.toBase58())).toBe("backend");
    expect(keys.size).toBe(2);
  });
});
