/* eslint-disable import/order -- vi.mock('server-only') must be hoisted above
   the module import so the `server-only` graph loads under vitest. */
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("server-only", () => ({}));

const lab = vi.hoisted(() => ({
  getAccountInfo: vi.fn(),
  getGenesisHash: vi.fn(),
}));
// The lab's server connection: the gate reads the program through it.
vi.mock("@/lib/solana/lab-server", () => ({
  getLabConnection: () => lab,
}));

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { Keypair, PublicKey, type AccountInfo } from "@solana/web3.js";
import {
  DEVNET_GENESIS_HASH,
  MAINNET_GENESIS_HASH,
} from "@/lib/solana/network";
import {
  CAPSTONE_CREDENTIAL,
  isCapstoneCourse,
  checkCapstoneCredentialGate,
} from "../capstone-gate";

// Read the committed bundle from disk rather than importing it: the generated
// JSON is a restricted import (it carries quiz answers / solutions / hidden
// tests) and must only be loaded via the server-only content store. Reading the
// file here keeps this constant-vs-bundle assertion without pulling secrets
// into a module graph.
const GENERATED = join(process.cwd(), "src/content/generated");
const coursesJson = JSON.parse(
  readFileSync(join(GENERATED, "courses.json"), "utf8")
) as Array<{
  _id: string;
  modules?: Array<{ lessons?: Array<{ _ref?: string }> }>;
}>;
const lessonsJson = JSON.parse(
  readFileSync(join(GENERATED, "lessons.json"), "utf8")
) as Array<{ _id: string; blocks?: Array<{ _type?: string }> }>;

const LOADER = new PublicKey("BPFLoaderUpgradeab1e11111111111111111111111");
const linkedWallet = Keypair.generate().publicKey;
const labKey = Keypair.generate().publicKey;
const programId = Keypair.generate().publicKey;
const [programDataAddress] = PublicKey.findProgramAddressSync(
  [programId.toBuffer()],
  LOADER
);

function account(data: Buffer, executable: boolean): AccountInfo<Buffer> {
  return { executable, owner: LOADER, lamports: 1, data, rentEpoch: 0 };
}

/** The program on chain, with `authority` as its upgrade authority. */
function setProgramAuthority(authority: PublicKey | null): void {
  const program = Buffer.alloc(36);
  program.writeUInt32LE(2, 0);
  programDataAddress.toBuffer().copy(program, 4);
  const header = Buffer.alloc(45);
  header.writeUInt32LE(3, 0);
  if (authority) {
    header[12] = 1;
    authority.toBuffer().copy(header, 13);
  }
  lab.getAccountInfo.mockImplementation(async (pubkey: PublicKey) => {
    if (pubkey.equals(programId)) return account(program, true);
    if (pubkey.equals(programDataAddress)) return account(header, false);
    return null;
  });
}

interface QueryResult<T> {
  data?: T | null;
  error?: { message: string } | null;
}

// An admin client mock for the gate's two reads: the `deployed_programs` row
// (`.select().eq().eq().eq().limit().maybeSingle()`) and the learner's
// `profiles` row. Records the tables read and the eq() filters per table.
function adminClientWith(
  deploy: QueryResult<{ program_id: string }>,
  profile: QueryResult<{ wallet_address: string | null }> = {
    data: { wallet_address: linkedWallet.toBase58() },
  }
) {
  const eqCalls: Record<string, Array<[string, unknown]>> = {};
  const from = vi.fn((table: string) => {
    const result: QueryResult<unknown> =
      table === "deployed_programs" ? deploy : profile;
    const chain = {
      select: () => chain,
      eq: (col: string, val: unknown) => {
        (eqCalls[table] ??= []).push([col, val]);
        return chain;
      },
      limit: () => chain,
      maybeSingle: async () => ({
        data: result.data ?? null,
        error: result.error ?? null,
      }),
    };
    return chain;
  });
  return {
    client: { from } as never,
    from,
    eqCalls,
  };
}

const deployRow = { data: { program_id: programId.toBase58() } };

function checkCapstone(client: never) {
  return checkCapstoneCredentialGate(
    client,
    "user-1",
    CAPSTONE_CREDENTIAL.courseId
  );
}

beforeEach(() => {
  lab.getAccountInfo.mockReset();
  lab.getGenesisHash.mockReset();
  lab.getGenesisHash.mockResolvedValue(DEVNET_GENESIS_HASH);
  setProgramAuthority(linkedWallet);
});

describe("capstone identity ↔ the committed bundle", () => {
  // CAPSTONE_CREDENTIAL is a code constant naming content, so this holds for
  // whatever content.lock pins and fails only when the two disagree. Today the
  // capstone course (C3) is parked under `_draft/`, so the gate is dormant:
  // neither id is in the bundle and no live course is gated. If C3 comes back,
  // it has to come back whole — its deploy lesson in the course and hosting
  // the panel — or the gate would deny every capstone credential (see the
  // dormancy note in capstone-identity.ts).
  const courseOfLesson = new Map<string, string>();
  for (const course of coursesJson) {
    for (const mod of course.modules ?? []) {
      for (const ref of mod.lessons ?? []) {
        if (ref._ref) courseOfLesson.set(ref._ref, course._id);
      }
    }
  }
  const hostsDeployPanel = (lessonId: string) =>
    lessonsJson
      .find((l) => l._id === lessonId)
      ?.blocks?.some((b) => b._type === "deployed-program-card") ?? false;
  const capstoneShipped = coursesJson.some(
    (c) => c._id === CAPSTONE_CREDENTIAL.courseId
  );

  it("ships the capstone course and its deploy lesson together, or neither", () => {
    const deployLessonCourse = courseOfLesson.get(
      CAPSTONE_CREDENTIAL.deployLessonId
    );
    if (capstoneShipped) {
      expect(deployLessonCourse).toBe(CAPSTONE_CREDENTIAL.courseId);
      expect(hostsDeployPanel(CAPSTONE_CREDENTIAL.deployLessonId)).toBe(true);
    } else {
      expect(deployLessonCourse).toBeUndefined();
    }
  });

  it("puts every deploy panel in a bundle course, and only the graded one in the gated course", () => {
    // The panel writes its lesson's id (and that lesson's course) to
    // `deployed_programs`, so a panel in a lesson no course owns records
    // deploys nothing can ever read back.
    const panelLessons = lessonsJson
      .filter((l) => hostsDeployPanel(l._id))
      .map((l) => l._id);
    expect(panelLessons.length).toBeGreaterThan(0);
    for (const lessonId of panelLessons) {
      const courseId = courseOfLesson.get(lessonId);
      expect(courseId, `${lessonId} belongs to no bundle course`).toBeDefined();
      if (isCapstoneCourse(courseId!)) {
        expect(lessonId).toBe(CAPSTONE_CREDENTIAL.deployLessonId);
      }
    }
  });
});

describe("isCapstoneCourse", () => {
  it("is true only for the capstone course", () => {
    expect(isCapstoneCourse(CAPSTONE_CREDENTIAL.courseId)).toBe(true);
    expect(isCapstoneCourse("course-solana-fundamentals")).toBe(false);
    expect(isCapstoneCourse("")).toBe(false);
  });
});

describe("checkCapstoneCredentialGate", () => {
  it("returns not_capstone for a non-capstone course without touching the DB or the chain", async () => {
    const { client, from } = adminClientWith({ data: null });
    const result = await checkCapstoneCredentialGate(
      client,
      "user-1",
      "course-solana-fundamentals"
    );
    expect(result).toEqual({ status: "not_capstone" });
    expect(from).not.toHaveBeenCalled();
    expect(lab.getGenesisHash).not.toHaveBeenCalled();
    expect(lab.getAccountInfo).not.toHaveBeenCalled();
  });

  it("returns allowed when the deploy's upgrade authority is the linked wallet", async () => {
    const { client, eqCalls } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "allowed" });
    // The row is scoped to this user + the capstone course + deploy lesson,
    // and the wallet is this user's own.
    expect(eqCalls.deployed_programs).toEqual([
      ["user_id", "user-1"],
      ["course_id", CAPSTONE_CREDENTIAL.courseId],
      ["lesson_id", CAPSTONE_CREDENTIAL.deployLessonId],
    ]);
    expect(eqCalls.profiles).toEqual([["id", "user-1"]]);
    // The program is read on the lab connection, after its devnet check.
    expect(lab.getGenesisHash).toHaveBeenCalledTimes(1);
    expect(lab.getAccountInfo).toHaveBeenCalledTimes(2);
  });

  it("stays closed when the deploy's upgrade authority is a lab key", async () => {
    setProgramAuthority(labKey);
    const { client } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "deploy_required" });
  });

  it("stays closed when the deploy has no upgrade authority", async () => {
    setProgramAuthority(null);
    const { client } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "deploy_required" });
  });

  it("stays closed when the program is no longer on chain", async () => {
    lab.getAccountInfo.mockResolvedValue(null);
    const { client } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "deploy_required" });
  });

  it("stays closed when the row's program id is not an address", async () => {
    const { client } = adminClientWith({ data: { program_id: "not-a-key" } });
    expect(await checkCapstone(client)).toEqual({ status: "deploy_required" });
    expect(lab.getAccountInfo).not.toHaveBeenCalled();
  });

  it.each([
    ["no profile row", { data: null }],
    ["no linked wallet", { data: { wallet_address: null } }],
    [
      "a linked wallet that is not an address",
      { data: { wallet_address: "x" } },
    ],
  ])(
    "stays closed with %s, without reading the chain",
    async (_name, profile) => {
      const { client } = adminClientWith(deployRow, profile);
      expect(await checkCapstone(client)).toEqual({
        status: "deploy_required",
      });
      expect(lab.getGenesisHash).not.toHaveBeenCalled();
      expect(lab.getAccountInfo).not.toHaveBeenCalled();
    }
  );

  it("returns deploy_required when no deploy row exists, without reading the wallet or the chain", async () => {
    const { client, from } = adminClientWith({ data: null });
    expect(await checkCapstone(client)).toEqual({ status: "deploy_required" });
    expect(from).toHaveBeenCalledTimes(1);
    expect(lab.getAccountInfo).not.toHaveBeenCalled();
  });

  it("fails closed (indeterminate) on a deploy row read error — never allowed", async () => {
    const { client } = adminClientWith({
      data: null,
      error: { message: "db down" },
    });
    expect(await checkCapstone(client)).toEqual({ status: "indeterminate" });
  });

  it("fails closed (indeterminate) on a profile read error", async () => {
    const { client } = adminClientWith(deployRow, {
      data: null,
      error: { message: "db down" },
    });
    expect(await checkCapstone(client)).toEqual({ status: "indeterminate" });
    expect(lab.getAccountInfo).not.toHaveBeenCalled();
  });

  it("fails closed (indeterminate) when the program read fails", async () => {
    lab.getAccountInfo.mockRejectedValue(new Error("fetch failed"));
    const { client } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "indeterminate" });
  });

  it("fails closed (indeterminate) when the lab RPC's genesis hash can't be read", async () => {
    lab.getGenesisHash.mockRejectedValue(new Error("rpc down"));
    const { client } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "indeterminate" });
    expect(lab.getAccountInfo).not.toHaveBeenCalled();
  });

  it("fails closed (indeterminate) when the lab RPC is not on devnet", async () => {
    lab.getGenesisHash.mockResolvedValue(MAINNET_GENESIS_HASH);
    const { client } = adminClientWith(deployRow);
    expect(await checkCapstone(client)).toEqual({ status: "indeterminate" });
    expect(lab.getAccountInfo).not.toHaveBeenCalled();
  });
});
