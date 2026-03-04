import "dotenv/config";
import { parseArgs } from "node:util";
import {
  address,
  appendTransactionMessageInstruction,
  createKeyPairSignerFromBytes,
  createKeyPairSignerFromPrivateKeyBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getProgramDerivedAddress,
  getSignatureFromTransaction,
  getUtf8Encoder,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type Address,
  type GetEpochInfoApi,
  type GetLatestBlockhashApi,
  type GetSignatureStatusesApi,
  type Rpc,
  type RpcSubscriptions,
  type SendTransactionApi,
  type SignatureNotificationsApi,
  type SlotNotificationsApi,
} from "@solana/kit";
import { z } from "zod";
import { getCreateCourseInstructionAsync } from "@superteam/academy-sdk";

const U8_MAX = 255;
const U16_MAX = 65_535;
const U32_MAX = 4_294_967_295;

type RpcLike = Rpc<
  GetEpochInfoApi &
    GetLatestBlockhashApi &
    GetSignatureStatusesApi &
    SendTransactionApi
>;
type RpcSubscriptionsLike = RpcSubscriptions<
  SignatureNotificationsApi & SlotNotificationsApi
>;

const scriptEnvSchema = z.object({
  RPC_URL: z.url(),
  RPC_WS_URL: z.url().optional(),
  PROGRAM_ID: z.string().min(32),
  AUTHORITY_KEYPAIR: z.string().min(1),
});

function loadScriptEnv() {
  const parsed = scriptEnvSchema.safeParse({
    RPC_URL: process.env.RPC_URL,
    RPC_WS_URL: process.env.RPC_WS_URL,
    PROGRAM_ID: process.env.PROGRAM_ID,
    AUTHORITY_KEYPAIR: process.env.AUTHORITY_KEYPAIR,
  });
  if (!parsed.success) {
    const pretty = z.prettifyError(parsed.error);
    throw new Error(`Invalid environment for create-course script:\n${pretty}`);
  }
  return parsed.data;
}

function deriveRpcWsUrl(rpcUrl: string): string {
  const url = new URL(rpcUrl);
  if (url.protocol === "https:") url.protocol = "wss:";
  if (url.protocol === "http:") url.protocol = "ws:";
  return url.toString();
}

function parseUintInRange(input: unknown, field: string, max: number): number {
  const text = String(input ?? "").trim();
  if (!/^\d+$/.test(text)) {
    throw new Error(`${field} must be an unsigned integer`);
  }
  const value = Number(text);
  if (!Number.isSafeInteger(value) || value < 0 || value > max) {
    throw new Error(`${field} must be between 0 and ${max}`);
  }
  return value;
}

function parseContentTxId(input?: string): Uint8Array {
  if (!input || input.trim() === "") {
    return new Uint8Array(32);
  }

  const trimmed = input.trim();
  if (/^[0-9a-fA-F]{64}$/.test(trimmed)) {
    return Uint8Array.from(Buffer.from(trimmed, "hex"));
  }

  const normalized = trimmed.replace(/-/g, "+").replace(/_/g, "/");
  const padded =
    normalized.length % 4 === 0
      ? normalized
      : `${normalized}${"=".repeat(4 - (normalized.length % 4))}`;
  const decoded = Buffer.from(padded, "base64");
  if (decoded.length === 32) {
    return Uint8Array.from(decoded);
  }

  throw new Error(
    "contentTxId must be 32 bytes (64-char hex, base64, or base64url)",
  );
}

function parseBase64SecretKey(input: string): Uint8Array {
  const decoded = Buffer.from(input, "base64");
  const maybeJson = decoded.toString("utf8").trim();
  if (maybeJson.startsWith("[")) {
    const parsed = JSON.parse(maybeJson) as unknown;
    if (
      Array.isArray(parsed) &&
      parsed.every(
        (value) => Number.isInteger(value) && value >= 0 && value <= 255,
      )
    ) {
      return Uint8Array.from(parsed);
    }
  }
  return Uint8Array.from(decoded);
}

async function loadAuthoritySigner(authorityKeypairBase64: string) {
  const authorityBytes = parseBase64SecretKey(authorityKeypairBase64);
  if (authorityBytes.length === 64) {
    return createKeyPairSignerFromBytes(authorityBytes);
  }
  if (authorityBytes.length === 32) {
    return createKeyPairSignerFromPrivateKeyBytes(authorityBytes);
  }
  throw new Error(
    "AUTHORITY_KEYPAIR must decode to 64-byte keypair bytes or 32-byte private key bytes",
  );
}

function printUsage(): void {
  console.log(`
Usage:
  pnpm -C backend create-course --courseId <id> [options]

Options:
  --courseId <string>              Required unique course id
  --creator <address>              Creator wallet (defaults to authority wallet)
  --contentTxId <bytes>            32-byte hex/base64/base64url (defaults to zero bytes)
  --lessonCount <number>           u8 (default: 5)
  --difficulty <number>            1-3 (default: 2)
  --xpPerLesson <number>           u32 (default: 100)
  --trackId <number>               u16 (default: 1)
  --trackLevel <number>            u8 (default: 1)
  --prerequisite <address>         Optional prerequisite course PDA
  --creatorRewardXp <number>       u32 (default: 50)
  --minCompletionsForReward <num>  u16 (default: 10)
  --help                           Show this help
`);
}

async function main() {
  const { values } = parseArgs({
    options: {
      courseId: { type: "string" },
      creator: { type: "string" },
      contentTxId: { type: "string" },
      lessonCount: { type: "string" },
      difficulty: { type: "string" },
      xpPerLesson: { type: "string" },
      trackId: { type: "string" },
      trackLevel: { type: "string" },
      prerequisite: { type: "string" },
      creatorRewardXp: { type: "string" },
      minCompletionsForReward: { type: "string" },
      help: { type: "boolean", short: "h" },
    },
  });

  if (values.help) {
    printUsage();
    return;
  }

  const courseId = values.courseId?.trim();
  if (!courseId) {
    printUsage();
    throw new Error("courseId is required");
  }

  const env = loadScriptEnv();
  const authoritySigner = await loadAuthoritySigner(env.AUTHORITY_KEYPAIR);
  const creator = values.creator
    ? address(values.creator)
    : (authoritySigner.address as Address);
  const contentTxId = parseContentTxId(values.contentTxId);

  const lessonCount = parseUintInRange(
    values.lessonCount ?? "5",
    "lessonCount",
    U8_MAX,
  );
  if (lessonCount < 1) {
    throw new Error("lessonCount must be at least 1");
  }

  const difficulty = parseUintInRange(
    values.difficulty ?? "2",
    "difficulty",
    U8_MAX,
  );
  if (difficulty < 1 || difficulty > 3) {
    throw new Error("difficulty must be 1, 2, or 3");
  }

  const xpPerLesson = parseUintInRange(
    values.xpPerLesson ?? "100",
    "xpPerLesson",
    U32_MAX,
  );
  const trackId = parseUintInRange(values.trackId ?? "1", "trackId", U16_MAX);
  const trackLevel = parseUintInRange(
    values.trackLevel ?? "1",
    "trackLevel",
    U8_MAX,
  );
  const creatorRewardXp = parseUintInRange(
    values.creatorRewardXp ?? "50",
    "creatorRewardXp",
    U32_MAX,
  );
  const minCompletionsForReward = parseUintInRange(
    values.minCompletionsForReward ?? "10",
    "minCompletionsForReward",
    U16_MAX,
  );
  const prerequisite = values.prerequisite
    ? address(values.prerequisite)
    : null;

  const programAddress = address(env.PROGRAM_ID);
  const [coursePda] = await getProgramDerivedAddress({
    programAddress,
    seeds: [
      getUtf8Encoder().encode("course"),
      getUtf8Encoder().encode(courseId),
    ],
  });

  const rpc = createSolanaRpc(env.RPC_URL) as RpcLike;
  const rpcSubscriptions = createSolanaRpcSubscriptions(
    env.RPC_WS_URL ?? deriveRpcWsUrl(env.RPC_URL),
  ) as RpcSubscriptionsLike;

  const instruction = await getCreateCourseInstructionAsync(
    {
      course: coursePda,
      authority: authoritySigner,
      courseId,
      creator,
      contentTxId,
      lessonCount,
      difficulty,
      xpPerLesson,
      trackId,
      trackLevel,
      prerequisite,
      creatorRewardXp,
      minCompletionsForReward,
    },
    {
      programAddress,
    },
  );

  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const transactionMessage = pipe(
    createTransactionMessage({ version: 0 }),
    (message) => setTransactionMessageFeePayerSigner(authoritySigner, message),
    (message) =>
      setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, message),
    (message) => appendTransactionMessageInstruction(instruction, message),
  );

  const signedTransaction =
    await signTransactionMessageWithSigners(transactionMessage);
  const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });

  await sendAndConfirmTransaction(
    signedTransaction as Parameters<typeof sendAndConfirmTransaction>[0],
    { commitment: "confirmed" },
  );

  console.log("Course created");
  console.log(`Course ID: ${courseId}`);
  console.log(`Course PDA: ${coursePda}`);
  console.log(`Signature: ${getSignatureFromTransaction(signedTransaction)}`);
}

main().catch((error) => {
  console.error("create-course failed");
  console.error(error);
  process.exit(1);
});
