import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import {
  setCachedBinary,
  evictExpiredBinaries,
} from "@/lib/build-server/binary-cache";

// --- Rate Limiter (token-bucket, same pattern as /api/rust/execute) ----------

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, TokenBucket>();
const MAX_TOKENS = 5;
const REFILL_INTERVAL_MS = 60_000;
const CLEANUP_INTERVAL_MS = 5 * 60_000;
let lastCleanup = Date.now();

function isRateLimited(key: string): boolean {
  const now = Date.now();
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    for (const [k, bucket] of rateLimitStore) {
      if (now - bucket.lastRefill > CLEANUP_INTERVAL_MS) {
        rateLimitStore.delete(k);
      }
    }
    lastCleanup = now;
  }
  const bucket = rateLimitStore.get(key);

  if (!bucket) {
    rateLimitStore.set(key, { tokens: MAX_TOKENS - 1, lastRefill: now });
    return false;
  }

  const elapsed = now - bucket.lastRefill;
  const refills = Math.floor(elapsed / REFILL_INTERVAL_MS);
  if (refills > 0) {
    bucket.tokens = Math.min(MAX_TOKENS, bucket.tokens + refills * MAX_TOKENS);
    bucket.lastRefill = now;
  }

  if (bucket.tokens <= 0) {
    return true;
  }

  bucket.tokens--;
  return false;
}

// --- Types -------------------------------------------------------------------

interface BuildRequest {
  files: { path: string; content: string }[];
  uuid?: string;
}

interface BuildServerResponse {
  success: boolean;
  stderr: string;
  uuid: string | null;
  /** Base64-encoded .so binary returned inline by the build server. */
  binary_b64?: string;
}

interface BuildProgramResponse {
  success: boolean;
  stderr: string;
  uuid: string | null;
  error?: string;
  /** Base64-encoded .so binary — included when available to avoid Cloud Run routing misses. */
  binaryB64?: string;
}

// --- Config ------------------------------------------------------------------

const BUILD_SERVER_URL = process.env.BUILD_SERVER_URL;
const BUILD_SERVER_API_KEY = process.env.BUILD_SERVER_API_KEY;
const UPSTREAM_TIMEOUT_MS = 130_000; // slightly above the 120s build timeout
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB, matches build server limit

// --- Route Handler -----------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<BuildProgramResponse>> {
  try {
    // 0. Env guard
    if (!BUILD_SERVER_URL || !BUILD_SERVER_API_KEY) {
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: "Build server is not configured",
        },
        { status: 503 }
      );
    }

    // 1. Auth — require authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    // 2. Rate limit (5 builds/min per user)
    if (isRateLimited(`user:${user.id}`)) {
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: "Rate limit exceeded. Please wait before building again.",
        },
        { status: 429 }
      );
    }

    // 3. Parse and validate request body
    const body = (await request.json()) as BuildRequest;

    if (!Array.isArray(body.files) || body.files.length === 0) {
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: "At least one source file is required",
        },
        { status: 400 }
      );
    }

    // Validate total size
    const totalSize = body.files.reduce((sum, f) => sum + f.content.length, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: "Total file size exceeds 500KB limit",
        },
        { status: 400 }
      );
    }

    // 4. Transform to build server wire format: [[path, content], ...]
    const wireFiles = body.files.map((f) => [f.path, f.content]);

    // 5. Proxy to build server
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(`${BUILD_SERVER_URL}/build`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-API-Key": BUILD_SERVER_API_KEY,
        },
        body: JSON.stringify({
          files: wireFiles,
          uuid: body.uuid ?? null,
          flags: {},
        }),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const isAbort =
        fetchErr instanceof Error && fetchErr.name === "AbortError";
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: isAbort
            ? "Build timed out (130s limit)"
            : "Failed to reach build server",
        },
        { status: 504 }
      );
    }
    clearTimeout(timeout);

    if (!upstreamResponse.ok) {
      const status = upstreamResponse.status;
      const errorText =
        status === 503
          ? "Build server is busy. Please try again shortly."
          : "Build server returned an error";
      return NextResponse.json(
        { success: false, stderr: "", uuid: null, error: errorText },
        { status: 502 }
      );
    }

    const result = (await upstreamResponse.json()) as BuildServerResponse;

    // The build server now returns the binary inline as binary_b64,
    // eliminating Cloud Run multi-instance routing issues entirely.
    // Also cache on the server side for the /api/deploy/[uuid] fallback route.
    if (result.success && result.uuid && result.binary_b64) {
      evictExpiredBinaries();
      try {
        const buf = Buffer.from(result.binary_b64, "base64");
        setCachedBinary(result.uuid, buf.buffer as ArrayBuffer);
      } catch {
        // Non-critical — client-side cache is the primary path
      }
    }

    return NextResponse.json({
      success: result.success,
      stderr: result.stderr,
      uuid: result.uuid,
      binaryB64: result.binary_b64,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.BUILD_PROGRAM_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/build-program" },
    });
    return NextResponse.json(
      {
        success: false,
        stderr: "",
        uuid: null,
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
