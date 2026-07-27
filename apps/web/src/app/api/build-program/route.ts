import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { isRateLimited } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env.server";

// Rate limit: 5 builds/min per user (shared cross-instance store — see P1-7).
const MAX_TOKENS = 5;
const REFILL_INTERVAL_MS = 60_000;

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

// Let the serverless function run long enough to cover the build server's full
// window. Cloud Run allows 300s (deploy/deploy.sh `--timeout 300`), so a cold
// build (fat-LTO codegen; #776 item 1) can legitimately take minutes. 300 is
// the Vercel plan's hard ceiling for maxDuration on this project (the same value
// api/courses/test-out already uses) — the platform kills the function at 300s
// regardless of any larger number here, so the upstream abort below sits just
// UNDER it to return a clean 504 before that hard kill. See the PR/#776 item 5
// for the residual (a build using the entire 300s can still 504 in the last
// headroom window) and the owner-side `--min-instances 1` mitigation.
export const maxDuration = 300;

const BUILD_SERVER_URL = serverEnv.BUILD_SERVER_URL;
const BUILD_SERVER_API_KEY = serverEnv.BUILD_SERVER_API_KEY;
// Was 130s — it 504'd cold builds the build server (Cloud Run, 300s) was still
// finishing, wasting the compile and showing a confusing failure (#776 item 5).
// Sits ~5s under maxDuration so the abort's own 504 is returned before Vercel
// hard-kills the function at 300s.
const UPSTREAM_TIMEOUT_MS = 295_000;
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
    if (
      await isRateLimited("build-program", user.id, {
        maxTokens: MAX_TOKENS,
        refillIntervalMs: REFILL_INTERVAL_MS,
      })
    ) {
      return NextResponse.json(
        {
          success: false,
          stderr: "",
          uuid: null,
          error: "Rate limit exceeded. Please wait before building again.",
        },
        { status: 429, headers: { "Retry-After": "60" } }
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
            ? `Build timed out (${UPSTREAM_TIMEOUT_MS / 1000}s limit)`
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

    // The build server returns the binary inline (binary_b64); the client caches
    // it directly, so there is no server-side cache or /api/deploy/:uuid route.
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
