import { createServerClient } from "@supabase/ssr";
import bs58 from "bs58";
import { Keypair, PublicKey } from "@solana/web3.js";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { OnChainAction, OnChainBridgeResponse } from "@/lib/onchain/bridge-types";
import { deriveConfigPda, deriveCoursePda, deriveEnrollmentPda } from "@/lib/onchain/pdas";

interface AuthenticatedBridgeContext {
  userId: string;
  learnerWallet: PublicKey;
  learnerWalletAddress: string;
}

const MAX_COURSE_ID_SEED_BYTES = 32;

function response(
  payload: OnChainBridgeResponse,
  status: number
): NextResponse {
  return NextResponse.json(payload, { status });
}

function fail(
  action: OnChainAction,
  status: number,
  code: string,
  message: string
): NextResponse {
  return response(
    {
      ok: false,
      action,
      code,
      message,
    },
    status
  );
}

export async function requireAuthenticatedBridgeContext(
  action: OnChainAction
): Promise<{ ctx?: AuthenticatedBridgeContext; error?: NextResponse }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) {
    return {
      error: fail(
        action,
        503,
        "SUPABASE_CONFIG_MISSING",
        "Supabase env vars are required for on-chain bridge auth."
      ),
    };
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(url, anon, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Route handler cookie sync failures are non-fatal here.
        }
      },
    },
  });

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return {
      error: fail(
        action,
        401,
        "UNAUTHENTICATED",
        "Sign in is required before calling on-chain bridge endpoints."
      ),
    };
  }

  const { data: wallets, error: walletError } = await supabase
    .from("linked_wallets")
    .select("wallet_address, is_primary")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  if (walletError) {
    return {
      error: fail(
        action,
        500,
        "WALLET_LOOKUP_FAILED",
        `Failed to load linked wallets: ${walletError.message}`
      ),
    };
  }

  const primary = (wallets || []).find((w) => w.is_primary) || wallets?.[0];
  if (!primary?.wallet_address) {
    return {
      error: fail(
        action,
        400,
        "WALLET_NOT_LINKED",
        "A linked wallet is required before on-chain actions."
      ),
    };
  }

  let learnerWallet: PublicKey;
  try {
    learnerWallet = new PublicKey(primary.wallet_address);
  } catch {
    return {
      error: fail(
        action,
        400,
        "WALLET_INVALID",
        "Linked wallet address is invalid."
      ),
    };
  }

  return {
    ctx: {
      userId: user.id,
      learnerWallet,
      learnerWalletAddress: primary.wallet_address,
    },
  };
}

export function requireBridgeNumber(
  value: unknown,
  field: string
): { value?: number; error?: string } {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { error: `${field} must be a number.` };
  }
  if (!Number.isInteger(value) || value < 0) {
    return { error: `${field} must be a non-negative integer.` };
  }
  return { value };
}

export function requireBridgeCourseId(
  value: unknown
): { value?: string; error?: string } {
  if (typeof value !== "string") {
    return { error: "courseId must be a string." };
  }

  const normalized = value.trim();
  if (!normalized) {
    return { error: "courseId is required." };
  }

  const bytes = Buffer.byteLength(normalized, "utf8");
  if (bytes > MAX_COURSE_ID_SEED_BYTES) {
    return {
      error: `courseId must be ${MAX_COURSE_ID_SEED_BYTES} bytes or fewer for PDA seed compatibility.`,
    };
  }

  return { value: normalized };
}

export function buildCourseAccountHints(
  learnerWallet: PublicKey,
  courseId: string
): Record<string, string> {
  const [config] = deriveConfigPda();
  const [course] = deriveCoursePda(courseId);
  const [enrollment] = deriveEnrollmentPda(learnerWallet, courseId);

  return {
    config: config.toBase58(),
    course: course.toBase58(),
    enrollment: enrollment.toBase58(),
    learner: learnerWallet.toBase58(),
  };
}

export function requireBackendSigner(
  action: OnChainAction
): { signer?: Keypair; error?: NextResponse } {
  const raw = process.env.ACADEMY_BACKEND_SIGNER;
  if (!raw) {
    return { error: signerMissing(action) };
  }

  try {
    const trimmed = raw.trim();
    let secret: Uint8Array;

    if (trimmed.startsWith("[")) {
      const parsed = JSON.parse(trimmed) as unknown;
      if (!Array.isArray(parsed) || parsed.some((n) => typeof n !== "number")) {
        return {
          error: fail(
            action,
            503,
            "BACKEND_SIGNER_INVALID",
            "ACADEMY_BACKEND_SIGNER JSON must be an array of numbers."
          ),
        };
      }
      secret = Uint8Array.from(parsed);
    } else {
      secret = bs58.decode(trimmed);
    }

    const signer = Keypair.fromSecretKey(secret);
    return { signer };
  } catch {
    return {
      error: fail(
        action,
        503,
        "BACKEND_SIGNER_INVALID",
        "ACADEMY_BACKEND_SIGNER is invalid. Use base58 or JSON array format."
      ),
    };
  }
}

export function notYetImplemented(
  action: OnChainAction,
  accountHints: Record<string, string>,
  signerRole: "learner" | "backend"
): NextResponse {
  return response(
    {
      ok: false,
      action,
      code: "BRIDGE_SCAFFOLD_READY",
      message: `Bridge scaffold is ready for ${action}. ${signerRole} signing path not wired yet.`,
      accountHints,
    },
    501
  );
}

export function signerMissing(action: OnChainAction): NextResponse {
  return fail(
    action,
    503,
    "BACKEND_SIGNER_MISSING",
    "ACADEMY_BACKEND_SIGNER is missing. Configure backend signer to enable this action."
  );
}

export function badRequest(
  action: OnChainAction,
  message: string
): NextResponse {
  return fail(action, 400, "INVALID_REQUEST", message);
}

export async function parseBridgeJson<T>(
  request: Request,
  action: OnChainAction
): Promise<{ payload?: Partial<T>; error?: NextResponse }> {
  try {
    const parsed = (await request.json()) as unknown;
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      return {
        error: badRequest(action, "Request body must be a JSON object."),
      };
    }
    return { payload: parsed as Partial<T> };
  } catch {
    return {
      error: badRequest(action, "Request body must be valid JSON."),
    };
  }
}
