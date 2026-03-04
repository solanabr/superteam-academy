import { address, getAddressEncoder } from "@solana/kit";
import { createSignInMessage } from "@solana/wallet-standard-util";
import { z } from "zod";
import { env } from "@/lib/env";

const createSigninDataResponseSchema = z.object({
  ok: z.literal(true),
  nonce: z.string().min(8),
  input: z.object({
    domain: z.string().min(1),
    address: z.string().min(32),
    statement: z.string().optional(),
    uri: z.string().min(1),
    version: z.string().min(1),
    chainId: z.string().optional(),
    nonce: z.string().min(8),
    issuedAt: z.string().optional(),
    expirationTime: z.string().optional(),
    requestId: z.string().optional(),
  }),
});

const completeLessonResponseSchema = z.object({
  ok: z.literal(true),
  signature: z.string().min(1),
  learner: z.string().min(32),
});

const apiErrorSchema = z.object({
  ok: z.boolean().optional(),
  error: z.string().optional(),
});

export class AcademyApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(code: string, status: number, message?: string) {
    super(message ?? code);
    this.code = code;
    this.status = status;
  }
}

export type WalletMessageSigner = {
  signMessage?: (message: Uint8Array) => Promise<Uint8Array>;
};

function normalizeApiBaseUrl(value: string): string {
  return value.replace(/\/+$/, "");
}

async function postJson(path: string, body: unknown): Promise<unknown> {
  const response = await fetch(
    `${normalizeApiBaseUrl(env.NEXT_PUBLIC_ACADEMY_API_URL)}${path}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    },
  );
  const payload = (await response.json()) as unknown;

  if (!response.ok) {
    const parsedError = apiErrorSchema.safeParse(payload);
    throw new AcademyApiError(
      parsedError.success
        ? (parsedError.data.error ?? "API_ERROR")
        : "API_ERROR",
      response.status,
    );
  }

  return payload;
}

export async function completeLessonWithWalletAuth(input: {
  wallet: string;
  courseId: string;
  lessonIndex: number;
  signer: WalletMessageSigner;
}): Promise<{ signature: string; learner: string }> {
  if (!input.signer.signMessage) {
    throw new AcademyApiError(
      "SIGN_MESSAGE_UNSUPPORTED",
      400,
      "Connected wallet does not support message signing.",
    );
  }

  const challengePayload = await postJson("/auth/create-signin-data", {
    wallet: input.wallet,
    action: "complete-lesson",
    courseId: input.courseId,
    lessonIndex: input.lessonIndex,
  });
  const challenge = createSigninDataResponseSchema.parse(challengePayload);

  if (challenge.input.address !== input.wallet) {
    throw new AcademyApiError("INVALID_WALLET_BINDING", 401);
  }

  const message = createSignInMessage(challenge.input);
  let signature: Uint8Array;
  try {
    signature = await input.signer.signMessage(message);
  } catch (signError) {
    const msg =
      signError instanceof Error ? signError.message : String(signError);
    if (/sign|denied|rejected|cancel/i.test(msg)) {
      throw new AcademyApiError(
        "SIGNATURE_REJECTED",
        400,
        "Signature was denied. Please try again or use another wallet.",
      );
    }
    throw new AcademyApiError(
      "SIGN_MESSAGE_FAILED",
      400,
      msg || "Failed to sign message.",
    );
  }
  const walletPublicKey = Array.from(
    getAddressEncoder().encode(address(input.wallet)),
  );

  const completePayload = await postJson("/complete-lesson", {
    courseId: input.courseId,
    lessonIndex: input.lessonIndex,
    nonce: challenge.nonce,
    output: {
      account: {
        address: input.wallet,
        publicKey: walletPublicKey,
        chains: challenge.input.chainId ? [challenge.input.chainId] : [],
        features: ["solana:signIn", "solana:signMessage"],
      },
      signedMessage: Array.from(message),
      signature: Array.from(signature),
      signatureType: "ed25519",
    },
  });

  return completeLessonResponseSchema.parse(completePayload);
}
