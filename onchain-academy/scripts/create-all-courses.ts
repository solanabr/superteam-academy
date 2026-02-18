import * as anchor from "@coral-xyz/anchor";
import { Program } from "@coral-xyz/anchor";
import { PublicKey, SystemProgram } from "@solana/web3.js";
import Arweave from "arweave";
import fs from "fs";
import path from "path";
import { ONCHAIN_COURSE_STUBS, type OnchainCourseStub } from "../../packages/cms/src/course-stubs";

import { OnchainAcademy } from "../target/types/onchain_academy";

interface ScriptFlags {
  arweaveKey?: string;
  creator?: string;
  only?: string;
  skipExisting?: string;
  dryRun?: string;
  help?: boolean;
}

const provider = anchor.AnchorProvider.env();
anchor.setProvider(provider);
const program = anchor.workspace.onchainAcademy as Program<OnchainAcademy>;

function usage(): string {
  return [
    "Usage:",
    "  anchor run create-all-courses -- --arweaveKey ../wallets/arweave-key.json",
    "",
    "Flags:",
    "  --arweaveKey <path>     Path to Arweave JWK key file",
    "  --creator <pubkey>      Creator pubkey for all courses (default: authority wallet)",
    "  --only <ids>            Comma-separated course IDs to process",
    "  --skipExisting <bool>   Skip courses already created (default: true)",
    "  --dryRun <bool>         Validate and print actions without upload/create",
    "",
    "Env fallback:",
    "  ARWEAVE_KEYFILE=<path>",
  ].join("\n");
}

function parseFlags(argv: string[]): ScriptFlags {
  const flags: ScriptFlags = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--help" || arg === "-h") {
      flags.help = true;
      continue;
    }
    if (!arg.startsWith("--")) {
      throw new Error(`Unexpected positional argument: ${arg}`);
    }

    const key = arg.slice(2) as keyof ScriptFlags;
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
      throw new Error(`Missing value for flag: ${arg}`);
    }

    (flags[key] as string | undefined) = value;
    index += 1;
  }

  return flags;
}

function parseBool(raw: string | undefined, defaultValue: boolean): boolean {
  if (raw === undefined) {
    return defaultValue;
  }
  const normalized = raw.trim().toLowerCase();
  if (["true", "1", "yes", "y"].includes(normalized)) return true;
  if (["false", "0", "no", "n"].includes(normalized)) return false;
  throw new Error(`Invalid boolean value: ${raw}`);
}

function levelToDifficulty(level: OnchainCourseStub["level"]): number {
  if (level === "beginner") return 1;
  if (level === "intermediate") return 2;
  return 3;
}

function decodeBase64Url(raw: string): Buffer {
  const base64 = raw.replace(/-/g, "+").replace(/_/g, "/");
  const paddingLength = (4 - (base64.length % 4)) % 4;
  const padded = `${base64}${"=".repeat(paddingLength)}`;
  return Buffer.from(padded, "base64");
}

function arweaveTxIdToBytes(txId: string): number[] {
  const bytes = decodeBase64Url(txId);
  if (bytes.length !== 32) {
    throw new Error(`Arweave tx id must decode to 32 bytes, got ${bytes.length}`);
  }
  return Array.from(bytes);
}

function buildCourseContent(seed: OnchainCourseStub): Record<string, unknown> {
  return {
    schema: "superteam-academy-course-content-v1",
    courseId: seed.courseId,
    title: seed.title,
    description: seed.description,
    category: seed.category,
    level: seed.level,
    duration: seed.duration,
    instructor: seed.instructor,
    tags: seed.tags,
    lessons: seed.lessons.map((lesson, index) => ({
      index,
      title: lesson.title,
      kind: lesson.kind,
      xpReward: seed.xpPerLesson,
    })),
    metadata: {
      trackId: seed.trackId,
      trackLevel: seed.trackLevel,
      lessonCount: seed.lessonCount,
      totalXp: seed.lessonCount * seed.xpPerLesson,
      prerequisiteCourseId: seed.prerequisiteCourseId,
    },
    createdAt: new Date().toISOString(),
  };
}

function resolveArweaveKeyPath(flags: ScriptFlags): string {
  const keyPath = flags.arweaveKey ?? process.env.ARWEAVE_KEYFILE;
  if (!keyPath) {
    throw new Error("Missing Arweave key. Pass --arweaveKey or set ARWEAVE_KEYFILE");
  }
  return path.isAbsolute(keyPath) ? keyPath : path.resolve(process.cwd(), keyPath);
}

function initArweave(): Arweave {
  return Arweave.init({
    host: process.env.ARWEAVE_HOST ?? "arweave.net",
    port: Number(process.env.ARWEAVE_PORT ?? "443"),
    protocol: process.env.ARWEAVE_PROTOCOL ?? "https",
  });
}

async function uploadCourseContent(
  arweave: Arweave,
  jwk: unknown,
  seed: OnchainCourseStub,
): Promise<string> {
  const payload = buildCourseContent(seed);
  const transaction = await arweave.createTransaction(
    { data: JSON.stringify(payload) },
    jwk,
  );

  transaction.addTag("Content-Type", "application/json");
  transaction.addTag("App-Name", "SuperteamAcademy");
  transaction.addTag("App-Version", "1.0.0");
  transaction.addTag("Course-Id", seed.courseId);

  await arweave.transactions.sign(transaction, jwk);

  const uploader = await arweave.transactions.getUploader(transaction);
  while (!uploader.isComplete) {
    await uploader.uploadChunk();
  }

  return transaction.id;
}

async function main(): Promise<void> {
  const flags = parseFlags(process.argv.slice(2));
  if (flags.help) {
    console.log(usage());
    return;
  }

  const dryRun = parseBool(flags.dryRun, false);
  const skipExisting = parseBool(flags.skipExisting, true);
  const onlyIds = flags.only
    ? flags.only.split(",").map((value) => value.trim()).filter(Boolean)
    : null;

  const seeds = onlyIds
    ? ONCHAIN_COURSE_STUBS.filter((seed) => onlyIds.includes(seed.courseId))
    : ONCHAIN_COURSE_STUBS;

  if (seeds.length === 0) {
    throw new Error("No courses matched --only filter");
  }

  const creator = flags.creator
    ? new PublicKey(flags.creator)
    : provider.wallet.publicKey;

  const [configPda] = PublicKey.findProgramAddressSync(
    [Buffer.from("config")],
    program.programId,
  );

  const coursePdas = new Map<string, PublicKey>();
  for (const seed of seeds) {
    if (Buffer.byteLength(seed.courseId, "utf8") > 32) {
      throw new Error(`courseId too long for seed ${seed.courseId}`);
    }
    if (seed.lessonCount < 1 || seed.lessonCount > 255) {
      throw new Error(`Invalid lessonCount for ${seed.courseId}`);
    }
    if (seed.lessons.length !== seed.lessonCount) {
      throw new Error(
        `Lesson mismatch for ${seed.courseId}: lessonCount=${seed.lessonCount}, lessons=${seed.lessons.length}`,
      );
    }

    const [coursePda] = PublicKey.findProgramAddressSync(
      [Buffer.from("course"), Buffer.from(seed.courseId)],
      program.programId,
    );
    coursePdas.set(seed.courseId, coursePda);
  }

  const arweave = initArweave();
  const keyPath = resolveArweaveKeyPath(flags);
  const jwk = JSON.parse(fs.readFileSync(keyPath, "utf8"));

  console.log("Starting one-shot course creation");
  console.log("Authority:", provider.wallet.publicKey.toBase58());
  console.log("Creator:", creator.toBase58());
  console.log("Course count:", seeds.length);
  console.log("Dry run:", dryRun);

  for (const seed of seeds) {
    const coursePda = coursePdas.get(seed.courseId);
    if (!coursePda) {
      throw new Error(`Missing PDA for ${seed.courseId}`);
    }

    const prerequisite = seed.prerequisiteCourseId
      ? coursePdas.get(seed.prerequisiteCourseId)
      : null;

    if (seed.prerequisiteCourseId && !prerequisite) {
      throw new Error(
        `Prerequisite ${seed.prerequisiteCourseId} not present in selected seed set`,
      );
    }

    const existing = await program.account.course.fetchNullable(coursePda);
    if (existing && skipExisting) {
      console.log(`Skipping existing course: ${seed.courseId}`);
      continue;
    }

    const contentTxId = dryRun
      ? "DRY_RUN_CONTENT_TX_ID_PLACEHOLDER_1234567890"
      : await uploadCourseContent(arweave, jwk, seed);

    const contentTxIdBytes = dryRun
      ? new Array(32).fill(0)
      : arweaveTxIdToBytes(contentTxId);

    console.log(`Processing course: ${seed.courseId}`);
    console.log(`  Arweave tx id: ${contentTxId}`);

    if (!dryRun) {
      const signature = await program.methods
        .createCourse({
          courseId: seed.courseId,
          creator,
          contentTxId: contentTxIdBytes,
          lessonCount: seed.lessonCount,
          difficulty: levelToDifficulty(seed.level),
          xpPerLesson: seed.xpPerLesson,
          trackId: seed.trackId,
          trackLevel: seed.trackLevel,
          prerequisite,
          creatorRewardXp: seed.creatorRewardXp,
          minCompletionsForReward: seed.minCompletionsForReward,
        })
        .accountsStrict({
          course: coursePda,
          config: configPda,
          authority: provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        })
        .rpc();

      console.log(`  Course PDA: ${coursePda.toBase58()}`);
      console.log(`  Signature: ${signature}`);
      console.log(`  Content URL: https://arweave.net/${contentTxId}`);
    }
  }

  console.log("Course seeding finished");
}

main().catch((error: unknown) => {
  if (error instanceof Error) {
    console.error("create-all-courses failed:", error.message);
  } else {
    console.error("create-all-courses failed with unknown error", error);
  }
  process.exit(1);
});
