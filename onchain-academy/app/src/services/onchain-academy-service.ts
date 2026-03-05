import { AnchorProvider, Program, type Idl } from "@coral-xyz/anchor";
import type { AnchorWallet } from "@solana/wallet-adapter-react";
import {
  Connection,
  PublicKey,
  SystemProgram,
  Transaction,
  TransactionInstruction,
  type Commitment,
  type SendOptions,
  type TransactionSignature,
} from "@solana/web3.js";
import {
  TOKEN_2022_PROGRAM_ID,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import type { Credential } from "@/types/domain";

const PROGRAM_ID = new PublicKey(
  process.env.NEXT_PUBLIC_PROGRAM_ID ??
    "ACADBRCB3zGvo1KSCbkztS33ZNzeBv2d7bqGceti3ucf",
);

const XP_MINT = new PublicKey(
  process.env.NEXT_PUBLIC_XP_MINT ??
    "xpXPUjkfk7t4AJF1tYUoyAYxzuM5DhinZWS1WjfjAu3",
);
const textEncoder = new TextEncoder();

function toSeed(value: string): Uint8Array {
  return textEncoder.encode(value);
}

type DerivationInput = {
  courseId: string;
  learner: PublicKey;
};

type EnrollInput = {
  connection: Connection;
  wallet: AnchorWallet;
  courseId: string;
  commitment?: Commitment;
  options?: SendOptions;
};

type CloseEnrollmentInput = {
  connection: Connection;
  wallet: AnchorWallet;
  courseId: string;
};

type HeliusAsset = {
  id: string;
  grouping?: Array<{ group_key?: string; group_value?: string }>;
  ownership?: {
    owner?: string;
  };
  content?: {
    metadata?: {
      name?: string;
      attributes?: Array<{ trait_type?: string; value?: string | number }>;
    };
    json_uri?: string;
  };
};

function parseCollectionAllowList(): Set<string> {
  const raw = process.env.NEXT_PUBLIC_CREDENTIAL_COLLECTIONS ?? "";
  if (!raw.trim()) {
    return new Set();
  }
  return new Set(
    raw
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
  );
}

function matchesExpectedCollection(
  asset: HeliusAsset,
  allowList: Set<string>,
): boolean {
  if (allowList.size === 0) {
    return true;
  }
  const grouping = asset.grouping ?? [];
  return grouping.some(
    (group) =>
      group.group_key === "collection" &&
      group.group_value !== undefined &&
      allowList.has(group.group_value),
  );
}

function hasCredentialShape(asset: HeliusAsset): boolean {
  const track = readAttribute(asset, ["track", "track_id"]);
  const level = readAttribute(asset, ["level"]);
  const totalXp = readAttribute(asset, ["total_xp", "xp", "totalXp"]);
  const courses = readAttribute(asset, [
    "courses_completed",
    "coursesCompleted",
  ]);
  return (
    track !== undefined &&
    (level !== undefined || totalXp !== undefined || courses !== undefined)
  );
}

function concatBytes(...chunks: Uint8Array[]): Uint8Array {
  const total = chunks.reduce((sum, chunk) => sum + chunk.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;

  for (const chunk of chunks) {
    output.set(chunk, offset);
    offset += chunk.length;
  }

  return output;
}

async function anchorInstructionDiscriminator(
  instructionName: string,
): Promise<Uint8Array> {
  const seed = textEncoder.encode(`global:${instructionName}`);
  const digest = await crypto.subtle.digest("SHA-256", seed);
  return new Uint8Array(digest).slice(0, 8);
}

function encodeAnchorString(value: string): Uint8Array {
  const stringBytes = textEncoder.encode(value);
  const lenBytes = new Uint8Array(4);
  new DataView(lenBytes.buffer).setUint32(0, stringBytes.length, true);
  return concatBytes(lenBytes, stringBytes);
}

function isBlockhashError(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    message.includes("blockhash") &&
    (message.includes("invalid") ||
      message.includes("not found") ||
      message.includes("can not be validated") ||
      message.includes("cannot be validated") ||
      message.includes("expired"))
  );
}

async function signAndSendTransaction(params: {
  connection: Connection;
  wallet: AnchorWallet;
  transaction: Transaction;
  commitment?: Commitment;
  options?: SendOptions;
}): Promise<TransactionSignature> {
  const { connection, wallet, transaction, commitment, options } = params;
  const targetCommitment = commitment ?? "confirmed";

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const latestBlockhash = await connection.getLatestBlockhash("confirmed");

    const txToSign = new Transaction().add(...transaction.instructions);
    txToSign.recentBlockhash = latestBlockhash.blockhash;
    txToSign.feePayer = wallet.publicKey;

    try {
      const signed = await wallet.signTransaction(txToSign);
      const signature = await connection.sendRawTransaction(
        signed.serialize(),
        {
          ...options,
          maxRetries: options?.maxRetries ?? 5,
          preflightCommitment:
            options?.preflightCommitment ?? targetCommitment ?? "processed",
        },
      );

      try {
        await connection.confirmTransaction(
          {
            signature,
            blockhash: latestBlockhash.blockhash,
            lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
          },
          targetCommitment,
        );
      } catch (confirmError) {
        if (!isBlockhashError(confirmError)) {
          throw confirmError;
        }

        const status = await connection.getSignatureStatuses([signature], {
          searchTransactionHistory: true,
        });
        const value = status.value[0];
        if (value?.err) {
          throw confirmError;
        }
      }

      return signature;
    } catch (error) {
      if (attempt < 2 && isBlockhashError(error)) {
        continue;
      }
      throw error;
    }
  }

  throw new Error("Failed to submit transaction after blockhash retry.");
}

function parseOnchainIdl(): Idl {
  const raw = process.env.NEXT_PUBLIC_ONCHAIN_ACADEMY_IDL_JSON;
  if (!raw) {
    throw new Error(
      "Missing NEXT_PUBLIC_ONCHAIN_ACADEMY_IDL_JSON. Set the program IDL JSON string to enable enroll/close transactions.",
    );
  }
  return JSON.parse(raw) as Idl;
}

function getProgram(
  connection: Connection,
  wallet: AnchorWallet,
): Program<Idl> {
  const provider = new AnchorProvider(connection, wallet, {
    commitment: "confirmed",
  });
  const idl = parseOnchainIdl() as Idl & { address?: string };

  if (!idl.address) {
    idl.address = PROGRAM_ID.toBase58();
  }

  return new Program<Idl>(idl, provider);
}

function parseLevel(asset: HeliusAsset): number {
  const levelValue = readAttribute(asset, ["level"]);
  const totalXp =
    toNumber(readAttribute(asset, ["total_xp", "xp", "totalXp"])) ?? 0;
  return toNumber(levelValue) ?? Math.floor(Math.sqrt(totalXp / 100));
}

function readAttribute(
  asset: HeliusAsset,
  keys: string[],
): string | number | undefined {
  const attrs = asset.content?.metadata?.attributes ?? [];
  for (const key of keys) {
    const row = attrs.find(
      (attribute) => attribute.trait_type?.toLowerCase() === key.toLowerCase(),
    );
    if (row?.value !== undefined) {
      return row.value;
    }
  }
  return undefined;
}

function toNumber(value: string | number | undefined): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return null;
}

export const onchainAcademyService = {
  derivePdas({ courseId, learner }: DerivationInput) {
    const [configPda] = PublicKey.findProgramAddressSync(
      [toSeed("config")],
      PROGRAM_ID,
    );

    const [coursePda] = PublicKey.findProgramAddressSync(
      [toSeed("course"), toSeed(courseId)],
      PROGRAM_ID,
    );

    const [enrollmentPda] = PublicKey.findProgramAddressSync(
      [toSeed("enrollment"), toSeed(courseId), learner.toBuffer()],
      PROGRAM_ID,
    );

    return {
      configPda,
      coursePda,
      enrollmentPda,
    };
  },

  async fetchConfig(
    connection: Connection,
    wallet: AnchorWallet,
  ): Promise<unknown | null> {
    const program = getProgram(connection, wallet);
    const accounts = program.account as Record<
      string,
      { fetch: (address: PublicKey) => Promise<unknown> }
    >;
    const configAccount = accounts.config;
    if (!configAccount) {
      return null;
    }

    const [configPda] = PublicKey.findProgramAddressSync(
      [toSeed("config")],
      PROGRAM_ID,
    );

    return configAccount.fetch(configPda);
  },

  async fetchCourse(
    connection: Connection,
    wallet: AnchorWallet,
    courseId: string,
  ): Promise<unknown | null> {
    const program = getProgram(connection, wallet);
    const accounts = program.account as Record<
      string,
      { fetch: (address: PublicKey) => Promise<unknown> }
    >;
    const courseAccount = accounts.course;
    if (!courseAccount) {
      return null;
    }

    const { coursePda } = this.derivePdas({
      courseId,
      learner: wallet.publicKey,
    });

    return courseAccount.fetch(coursePda);
  },

  async fetchEnrollment(
    connection: Connection,
    wallet: AnchorWallet,
    courseId: string,
  ): Promise<unknown | null> {
    const program = getProgram(connection, wallet);
    const accounts = program.account as Record<
      string,
      {
        fetchNullable?: (address: PublicKey) => Promise<unknown | null>;
      }
    >;

    const enrollmentAccount = accounts.enrollment;
    if (!enrollmentAccount?.fetchNullable) {
      return null;
    }

    const { enrollmentPda } = this.derivePdas({
      courseId,
      learner: wallet.publicKey,
    });

    return enrollmentAccount.fetchNullable(enrollmentPda);
  },

  async enroll({
    connection,
    wallet,
    courseId,
    commitment,
    options,
  }: EnrollInput): Promise<TransactionSignature> {
    const { coursePda, enrollmentPda } = this.derivePdas({
      courseId,
      learner: wallet.publicKey,
    });

    const data = concatBytes(
      await anchorInstructionDiscriminator("enroll"),
      encodeAnchorString(courseId),
    );

    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: coursePda, isSigner: false, isWritable: true },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: data as Buffer,
    });

    const transaction = new Transaction().add(instruction);
    return signAndSendTransaction({
      connection,
      wallet,
      transaction,
      commitment: commitment ?? "confirmed",
      ...(options ? { options } : {}),
    });
  },

  async closeEnrollment({
    connection,
    wallet,
    courseId,
  }: CloseEnrollmentInput): Promise<TransactionSignature> {
    const { coursePda, enrollmentPda } = this.derivePdas({
      courseId,
      learner: wallet.publicKey,
    });

    const data = await anchorInstructionDiscriminator("close_enrollment");

    const instruction = new TransactionInstruction({
      programId: PROGRAM_ID,
      keys: [
        { pubkey: coursePda, isSigner: false, isWritable: false },
        { pubkey: enrollmentPda, isSigner: false, isWritable: true },
        { pubkey: wallet.publicKey, isSigner: true, isWritable: true },
      ],
      data: data as Buffer,
    });

    const transaction = new Transaction().add(instruction);
    return signAndSendTransaction({
      connection,
      wallet,
      transaction,
      commitment: "confirmed",
    });
  },

  async fetchXpBalance(
    connection: Connection,
    walletAddress: PublicKey,
  ): Promise<number> {
    const xpAta = getAssociatedTokenAddressSync(
      XP_MINT,
      walletAddress,
      false,
      TOKEN_2022_PROGRAM_ID,
    );

    const info = await connection
      .getTokenAccountBalance(xpAta)
      .catch(() => null);
    if (!info) {
      return 0;
    }

    return Number(info.value.amount);
  },

  async fetchCredentials(walletAddress: string): Promise<Credential[]> {
    const heliusRpc = process.env.NEXT_PUBLIC_HELIUS_RPC_URL;
    if (!heliusRpc) {
      return [];
    }
    const collectionAllowList = parseCollectionAllowList();

    const response = await fetch(heliusRpc, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: "1",
        method: "getAssetsByOwner",
        params: {
          ownerAddress: walletAddress,
          page: 1,
          limit: 100,
        },
      }),
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as {
      result?: {
        items?: HeliusAsset[];
      };
    };

    return (data.result?.items ?? [])
      .filter((asset) => hasCredentialShape(asset))
      .filter((asset) => matchesExpectedCollection(asset, collectionAllowList))
      .map((asset) => {
        const totalXp =
          toNumber(readAttribute(asset, ["total_xp", "xp", "totalXp"])) ?? 0;
        return {
          credentialId: asset.id,
          title: asset.content?.metadata?.name ?? "Credential",
          track: String(
            readAttribute(asset, ["track", "track_id"]) ?? "Unknown",
          ),
          level: parseLevel(asset),
          coursesCompleted:
            toNumber(
              readAttribute(asset, ["courses_completed", "coursesCompleted"]),
            ) ?? 0,
          totalXp,
          mintAddress: asset.id,
          metadataUri: asset.content?.json_uri ?? null,
          explorerUrl: `https://explorer.solana.com/address/${asset.id}?cluster=devnet`,
          verified: (asset.ownership?.owner ?? walletAddress) === walletAddress,
          source: "helius",
        };
      });
  },
};
