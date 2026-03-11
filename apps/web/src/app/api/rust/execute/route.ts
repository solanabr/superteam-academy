import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";

// --- Rate Limiter -----------------------------------------------------------

interface TokenBucket {
  tokens: number;
  lastRefill: number;
}

const rateLimitStore = new Map<string, TokenBucket>();
const MAX_TOKENS = 10;
const REFILL_INTERVAL_MS = 60_000;
const CODE_SIZE_LIMIT = 50 * 1024;

function isRateLimited(key: string): boolean {
  const now = Date.now();
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

// --- Types ------------------------------------------------------------------

interface RustExecuteRequest {
  code: string;
  edition?: "2015" | "2018" | "2021";
}

interface RustPlaygroundPayload {
  channel: "stable" | "beta" | "nightly";
  mode: "debug" | "release";
  edition: "2015" | "2018" | "2021";
  crateType: "bin" | "lib";
  tests: boolean;
  backtrace: boolean;
  code: string;
}

interface RustPlaygroundResponse {
  success: boolean;
  exitDetail: string;
  stdout: string;
  stderr: string;
}

interface RustExecuteResponse {
  success: boolean;
  stdout: string;
  stderr: string;
  error?: string;
}

// --- Route Handler ----------------------------------------------------------

const RUST_PLAYGROUND_URL =
  process.env.RUST_PLAYGROUND_URL ?? "https://play.rust-lang.org/execute";

const UPSTREAM_TIMEOUT_MS = 30_000;

export async function POST(
  request: NextRequest
): Promise<NextResponse<RustExecuteResponse>> {
  try {
    // 1. Auth — require authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          stdout: "",
          stderr: "",
          error: "Authentication required",
        },
        { status: 401 }
      );
    }

    const rateLimitKey = `user:${user.id}`;

    if (isRateLimited(rateLimitKey)) {
      return NextResponse.json(
        {
          success: false,
          stdout: "",
          stderr: "",
          error: "Rate limit exceeded. Please wait before trying again.",
        },
        { status: 429 }
      );
    }

    // 2. Parse and validate request body
    const body = (await request.json()) as RustExecuteRequest;

    if (!body.code || typeof body.code !== "string") {
      return NextResponse.json(
        {
          success: false,
          stdout: "",
          stderr: "",
          error: "Missing or invalid code",
        },
        { status: 400 }
      );
    }

    if (body.code.length > CODE_SIZE_LIMIT) {
      return NextResponse.json(
        {
          success: false,
          stdout: "",
          stderr: "",
          error: "Code exceeds maximum size (50KB)",
        },
        { status: 400 }
      );
    }

    // 3. Build Playground request
    const payload: RustPlaygroundPayload = {
      channel: "stable",
      mode: "debug",
      edition: body.edition ?? "2021",
      crateType: "bin",
      tests: false,
      backtrace: false,
      code: body.code,
    };

    // 4. Proxy to Rust Playground with timeout
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), UPSTREAM_TIMEOUT_MS);

    let upstreamResponse: Response;
    try {
      upstreamResponse = await fetch(RUST_PLAYGROUND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });
    } catch (fetchErr) {
      clearTimeout(timeout);
      const isAbort =
        fetchErr instanceof Error && fetchErr.name === "AbortError";
      return NextResponse.json(
        {
          success: false,
          stdout: "",
          stderr: "",
          error: isAbort
            ? "Compilation timed out (30s limit)"
            : "Failed to reach Rust compiler service",
        },
        { status: 504 }
      );
    }
    clearTimeout(timeout);

    if (!upstreamResponse.ok) {
      return NextResponse.json(
        {
          success: false,
          stdout: "",
          stderr: "",
          error: "Rust compiler service returned an error",
        },
        { status: 502 }
      );
    }

    const result = (await upstreamResponse.json()) as RustPlaygroundResponse;

    return NextResponse.json({
      success: result.success,
      stdout: result.stdout,
      stderr: result.stderr,
    });
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.RUST_EXECUTE_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/rust/execute" },
    });
    return NextResponse.json(
      {
        success: false,
        stdout: "",
        stderr: "",
        error: "Internal server error",
      },
      { status: 500 }
    );
  }
}
