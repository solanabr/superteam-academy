import { describe, it, expect } from "vitest";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";
import { Keypair, PublicKey } from "@solana/web3.js";
import idl from "../../idl/onchain_academy.json";
import {
  BPF_LOADER_UPGRADEABLE_ID,
  GENESIS_HASH,
  UsageError,
  assertGenesis,
  buildInitializeIx,
  buildRegisterMinterIx,
  buildUpdateConfigIx,
  configPda,
  decodeConfig,
  decodeIx,
  decodeMinterRole,
  decodeProgramData,
  minterRolePda,
  parseArgs,
  describeSignerSource,
  flagValue,
  parseU64,
  programDataAddress,
  readKeypairFile,
  redactUrls,
  resolveCluster,
  resolveProgramId,
  resolveSignerSource,
  writeKeypairFile,
} from "../lib/program-admin";

const PROGRAM_ID = new PublicKey(
  "7NeJaSRyb4Wxay3Tcd9bdpD7T3GWYUQSFyrhG8SgwE8V"
);

function idlAccounts(name: string): string[] {
  const ix = idl.instructions.find((i) => i.name === name);
  if (!ix) throw new Error(name);
  return ix.accounts.map((a) => a.name);
}

describe("arguments", () => {
  it("parses a command with value and boolean flags", () => {
    expect(parseArgs(["initialize", "--cluster", "devnet", "--yes"])).toEqual({
      command: "initialize",
      flags: { cluster: "devnet", yes: "true" },
    });
    expect(() => parseArgs(["status", "stray"])).toThrow(UsageError);
  });

  it("has no default cluster", () => {
    expect(() => resolveCluster({})).toThrow(
      /--cluster devnet\|mainnet is required/
    );
    expect(() => resolveCluster({ cluster: "testnet" })).toThrow(UsageError);
    expect(resolveCluster({ cluster: "mainnet" })).toBe("mainnet");
  });

  it("requires the RPC to be the declared cluster", () => {
    expect(() => assertGenesis("devnet", GENESIS_HASH.devnet)).not.toThrow();
    expect(() => assertGenesis("mainnet", GENESIS_HASH.devnet)).toThrow(
      /not mainnet/
    );
  });

  it("has no default program id", () => {
    expect(() => resolveProgramId({}, {})).toThrow(/Program id required/);
    expect(
      resolveProgramId(
        {},
        { NEXT_PUBLIC_PROGRAM_ID: PROGRAM_ID.toBase58() }
      ).equals(PROGRAM_ID)
    ).toBe(true);
    const other = Keypair.generate().publicKey;
    expect(
      resolveProgramId(
        { "program-id": other.toBase58() },
        { ACADEMY_PROGRAM_ID: PROGRAM_ID.toBase58() }
      ).equals(other)
    ).toBe(true);
  });

  it("parses u64 caps and requires the ones without a default", () => {
    expect(() => parseU64({}, "max-total-xp")).toThrow(/is required/);
    expect(parseU64({}, "max-xp-per-call", 100n)).toBe(100n);
    expect(parseU64({ "max-total-xp": "250000" }, "max-total-xp")).toBe(
      250000n
    );
    expect(() => parseU64({ "max-total-xp": "-1" }, "max-total-xp")).toThrow();
    expect(() =>
      parseU64({ "max-total-xp": "18446744073709551616" }, "max-total-xp")
    ).toThrow(/u64/);
  });
});

describe("account decoders", () => {
  it("decodes ProgramData with and without an upgrade authority", () => {
    const authority = Keypair.generate().publicKey;
    const data = Buffer.alloc(45 + 10);
    data.writeUInt32LE(3, 0);
    data.writeBigUInt64LE(42n, 4);
    data[12] = 1;
    authority.toBuffer().copy(data, 13);
    const decoded = decodeProgramData(data);
    expect(decoded.slot).toBe(42n);
    expect(decoded.upgradeAuthority?.equals(authority)).toBe(true);

    data[12] = 0;
    expect(decodeProgramData(data).upgradeAuthority).toBeNull();
    data.writeUInt32LE(2, 0);
    expect(() => decodeProgramData(data)).toThrow(/Not a ProgramData/);
  });

  it("decodes Config at its fixed offsets", () => {
    const [a, b, m] = [0, 1, 2].map(() => Keypair.generate().publicKey);
    const data = Buffer.alloc(113);
    Buffer.from([155, 12, 170, 224, 30, 250, 204, 130]).copy(data, 0);
    a!.toBuffer().copy(data, 8);
    b!.toBuffer().copy(data, 40);
    m!.toBuffer().copy(data, 72);
    data[104] = 1;
    data.writeUInt32LE(7, 105);
    const c = decodeConfig(data);
    expect(c.authority.equals(a!)).toBe(true);
    expect(c.backendSigner.equals(b!)).toBe(true);
    expect(c.xpMint.equals(m!)).toBe(true);
    expect(c.paused).toBe(true);
    expect(c.courseNonce).toBe(7);
  });

  it("decodes a MinterRole after its label", () => {
    const minter = Keypair.generate().publicKey;
    const label = "backend";
    const data = Buffer.alloc(110);
    Buffer.from([21, 246, 6, 133, 142, 211, 33, 193]).copy(data, 0);
    minter.toBuffer().copy(data, 8);
    data.writeUInt32LE(label.length, 40);
    data.write(label, 44);
    const o = 44 + label.length;
    data.writeBigUInt64LE(100n, o);
    data.writeBigUInt64LE(5n, o + 8);
    data[o + 16] = 1;
    data.writeBigUInt64LE(250_000n, o + 25);
    const r = decodeMinterRole(data);
    expect(r.minter.equals(minter)).toBe(true);
    expect(r.label).toBe(label);
    expect(r.maxXpPerCall).toBe(100n);
    expect(r.totalXpMinted).toBe(5n);
    expect(r.isActive).toBe(true);
    expect(r.maxTotalXp).toBe(250_000n);
  });
});

describe("instructions", () => {
  const authority = Keypair.generate().publicKey;

  it("initialize passes the program's ProgramData last, in IDL order", () => {
    const mint = Keypair.generate().publicKey;
    const ix = buildInitializeIx(PROGRAM_ID, authority, mint);
    expect(ix.keys).toHaveLength(idlAccounts("initialize").length);
    expect(idlAccounts("initialize").at(-1)).toBe("program_data");
    const programData = ix.keys.at(-1)!;
    expect(programData.pubkey.equals(programDataAddress(PROGRAM_ID))).toBe(
      true
    );
    expect(programData.isWritable).toBe(false);
    expect(
      programDataAddress(PROGRAM_ID).equals(
        PublicKey.findProgramAddressSync(
          [PROGRAM_ID.toBuffer()],
          BPF_LOADER_UPGRADEABLE_ID
        )[0]
      )
    ).toBe(true);
    expect(ix.keys[0]!.pubkey.equals(configPda(PROGRAM_ID))).toBe(true);
    expect(ix.keys[2]).toMatchObject({ isSigner: true, isWritable: true });
    expect(
      ix.keys[3]!.pubkey.equals(minterRolePda(authority, PROGRAM_ID))
    ).toBe(true);
    expect(decodeIx(ix.data)?.name).toBe("initialize");
  });

  it("rotate-backend retires the current backend's role", () => {
    const oldBackend = Keypair.generate().publicKey;
    const newBackend = Keypair.generate().publicKey;
    const ix = buildUpdateConfigIx(
      PROGRAM_ID,
      authority,
      { newBackendSigner: newBackend },
      oldBackend
    );
    expect(ix.keys).toHaveLength(3);
    expect(
      ix.keys[2]!.pubkey.equals(minterRolePda(oldBackend, PROGRAM_ID))
    ).toBe(true);
    expect(ix.keys[2]!.isWritable).toBe(true);
    const decoded = decodeIx(ix.data) as {
      name: string;
      data: {
        params: {
          new_backend_signer: PublicKey;
          paused: null;
          new_authority: null;
        };
      };
    };
    expect(decoded.name).toBe("update_config");
    expect(decoded.data.params.new_backend_signer.equals(newBackend)).toBe(
      true
    );
    expect(decoded.data.params.paused).toBeNull();
    expect(decoded.data.params.new_authority).toBeNull();

    expect(() =>
      buildUpdateConfigIx(PROGRAM_ID, authority, {
        newBackendSigner: newBackend,
      })
    ).toThrow(/current backend signer/);
  });

  it("set-paused sends only the paused flag and no remaining accounts", () => {
    const ix = buildUpdateConfigIx(PROGRAM_ID, authority, { paused: true });
    expect(ix.keys).toHaveLength(idlAccounts("update_config").length);
    const decoded = decodeIx(ix.data) as {
      data: { params: { new_backend_signer: null; paused: boolean } };
    };
    expect(decoded.data.params.paused).toBe(true);
    expect(decoded.data.params.new_backend_signer).toBeNull();
  });

  it("register-minter carries both caps and refuses an unlimited one", () => {
    const minter = Keypair.generate().publicKey;
    const ix = buildRegisterMinterIx(PROGRAM_ID, authority, {
      minter,
      label: "backend",
      maxXpPerCall: 100n,
      maxTotalXp: 250_000n,
    });
    expect(ix.keys).toHaveLength(idlAccounts("register_minter").length);
    expect(ix.keys[1]!.pubkey.equals(minterRolePda(minter, PROGRAM_ID))).toBe(
      true
    );
    const decoded = decodeIx(ix.data) as {
      data: {
        params: {
          minter: PublicKey;
          label: string;
          max_xp_per_call: { toString(): string };
          max_total_xp: { toString(): string };
        };
      };
    };
    expect(decoded.data.params.minter.equals(minter)).toBe(true);
    expect(decoded.data.params.label).toBe("backend");
    expect(decoded.data.params.max_xp_per_call.toString()).toBe("100");
    expect(decoded.data.params.max_total_xp.toString()).toBe("250000");

    expect(() =>
      buildRegisterMinterIx(PROGRAM_ID, authority, {
        minter,
        label: "backend",
        maxXpPerCall: 100n,
        maxTotalXp: 0n,
      })
    ).toThrow(/--max-total-xp must be greater than 0/);
    expect(() =>
      buildRegisterMinterIx(PROGRAM_ID, authority, {
        minter,
        label: "x".repeat(33),
        maxXpPerCall: 100n,
        maxTotalXp: 1n,
      })
    ).toThrow(/label/);
  });

  it("register-minter refuses an unlimited per-call cap too, unless --allow-unlimited", () => {
    const minter = Keypair.generate().publicKey;
    const params = {
      minter,
      label: "backend",
      maxXpPerCall: 0n,
      maxTotalXp: 250_000n,
    };
    expect(() => buildRegisterMinterIx(PROGRAM_ID, authority, params)).toThrow(
      /--max-xp-per-call must be greater than 0.*--allow-unlimited/
    );

    const ix = buildRegisterMinterIx(PROGRAM_ID, authority, {
      ...params,
      maxTotalXp: 0n,
      allowUnlimited: true,
    });
    const decoded = decodeIx(ix.data) as {
      data: {
        params: {
          max_xp_per_call: { toString(): string };
          max_total_xp: { toString(): string };
        };
      };
    };
    expect(decoded.data.params.max_xp_per_call.toString()).toBe("0");
    expect(decoded.data.params.max_total_xp.toString()).toBe("0");
  });
});

describe("signer source", () => {
  it("uses --keypair <path> over the env key", () => {
    const source = resolveSignerSource(
      { keypair: "wallets/upgrade.json" },
      { PROGRAM_AUTHORITY_SECRET: "[1,2,3]" }
    );
    expect(source).toEqual({ kind: "file", path: "wallets/upgrade.json" });
    expect(describeSignerSource(source)).toBe("file wallets/upgrade.json");
  });

  it("refuses a bare --keypair instead of falling back to the env key", () => {
    // `--keypair --yes` parses as keypair="true".
    const { flags } = parseArgs(["initialize", "--keypair", "--yes"]);
    expect(() =>
      resolveSignerSource(flags, { PROGRAM_AUTHORITY_SECRET: "[1,2,3]" })
    ).toThrow(/--keypair needs a value/);
  });

  it("names the env source, and refuses when there is none", () => {
    const source = resolveSignerSource({}, { PROGRAM_AUTHORITY_SECRET: "[1]" });
    expect(describeSignerSource(source)).toBe("env PROGRAM_AUTHORITY_SECRET");
    expect(() => resolveSignerSource({}, {})).toThrow(/No signer/);
  });

  it("refuses any value flag given without a value", () => {
    expect(flagValue({}, "backend")).toBeUndefined();
    expect(flagValue({ backend: "abc" }, "backend")).toBe("abc");
    for (const name of [
      "backend",
      "minter",
      "label",
      "xp-mint-keypair",
      "program-id",
    ]) {
      expect(() => flagValue({ [name]: "true" }, name)).toThrow(
        /needs a value/
      );
    }
    // A bare cap flag no longer falls back to its default.
    expect(() =>
      parseU64({ "max-xp-per-call": "true" }, "max-xp-per-call", 100n)
    ).toThrow(/needs a value/);
  });
});

describe("secrets", () => {
  it("writes a generated keypair owner-only and never over an existing file", () => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "program-admin-"));
    try {
      const kp = Keypair.generate();
      const file = writeKeypairFile(path.join(dir, "wallets"), "mint.json", kp);
      expect(fs.statSync(file).mode & 0o777).toBe(0o600);
      expect(readKeypairFile(file).publicKey.equals(kp.publicKey)).toBe(true);
      expect(() =>
        writeKeypairFile(
          path.join(dir, "wallets"),
          "mint.json",
          Keypair.generate()
        )
      ).toThrow();
      expect(readKeypairFile(file).publicKey.equals(kp.publicKey)).toBe(true);
    } finally {
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  it("redacts RPC URLs from error text", () => {
    expect(
      redactUrls(
        "failed to get info: https://rpc.example/?api-key=abc123 (429)"
      )
    ).toBe("failed to get info: [redacted-url] (429)");
  });
});
