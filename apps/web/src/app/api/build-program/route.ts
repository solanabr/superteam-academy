import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { logError, logEvent } from "@/lib/logging";
import { ERROR_IDS } from "@/constants/errorIds";
import { isRateLimited } from "@/lib/rate-limit";
import { serverEnv } from "@/lib/env.server";
import type { BuildDiagnostic } from "@/lib/build-server/diagnostics";
import {
  readBuildServerAnswer,
  type BuildFailureKind,
} from "@/lib/build-server/failure";

// Rate limit: 5 builds/min per user (shared cross-instance store — see P1-7).
const MAX_TOKENS = 5;
const REFILL_INTERVAL_MS = 60_000;

// --- Types -------------------------------------------------------------------

interface BuildRequest {
  files: { path: string; content: string }[];
  uuid?: string;
}

interface BuildProgramResponse {
  success: boolean;
  stderr: string;
  uuid: string | null;
  error?: string;
  /** Set on every failure, so the client knows whose problem it is. */
  kind?: BuildFailureKind;
  /** Base64-encoded .so binary — included when available to avoid Cloud Run routing misses. */
  binaryB64?: string;
  /** The compiler's errors and warnings; set on every build result. */
  diagnostics?: BuildDiagnostic[];
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

// Was 130s — it 504'd cold builds the build server (Cloud Run, 300s) was still
// finishing, wasting the compile and showing a confusing failure (#776 item 5).
// Sits ~5s under maxDuration so the abort's own 504 is returned before Vercel
// hard-kills the function at 300s.
const UPSTREAM_TIMEOUT_MS = 295_000;
const MAX_TOTAL_SIZE = 500 * 1024; // 500KB, matches build server limit

// --- Failure answers ---------------------------------------------------------

function fail(
  status: number,
  kind: BuildFailureKind,
  error: string,
  headers?: Record<string, string>
): NextResponse<BuildProgramResponse> {
  return NextResponse.json(
    { success: false, stderr: "", uuid: null, error, kind },
    { status, headers }
  );
}

/**
 * The build service gave no verdict and it isn't the learner's doing. Logged
 * with the upstream status alone (null when there was no upstream answer).
 */
function unavailable(
  status: number,
  upstreamStatus: number | null,
  error: string
): NextResponse<BuildProgramResponse> {
  logEvent({
    event: "build-program.unavailable",
    context: { upstreamStatus },
  });
  return fail(status, "unavailable", error);
}

/**
 * The request body as a build request, or null when it isn't one. The caller
 * sent it, so a bad one is a 400 and not a failure of the build service.
 */
function parseBuildRequest(raw: unknown): BuildRequest | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { files, uuid } = raw as { files?: unknown; uuid?: unknown };
  if (!Array.isArray(files)) return null;
  const parsed: BuildRequest["files"] = [];
  for (const file of files as unknown[]) {
    if (typeof file !== "object" || file === null) return null;
    const { path, content } = file as { path?: unknown; content?: unknown };
    if (typeof path !== "string" || typeof content !== "string") return null;
    parsed.push({ path, content });
  }
  if (uuid !== undefined && uuid !== null && typeof uuid !== "string") {
    return null;
  }
  return { files: parsed, uuid: uuid ?? undefined };
}

// --- Route Handler -----------------------------------------------------------

export async function POST(
  request: NextRequest
): Promise<NextResponse<BuildProgramResponse>> {
  try {
    // 0. Env guard
    const { BUILD_SERVER_URL, BUILD_SERVER_API_KEY } = serverEnv;
    if (!BUILD_SERVER_URL || !BUILD_SERVER_API_KEY) {
      return unavailable(503, null, "Build server is not configured");
    }

    // 1. Auth — require authenticated user
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return fail(401, "rejected", "Authentication required");
    }

    // 2. Rate limit (5 builds/min per user)
    if (
      await isRateLimited("build-program", user.id, {
        maxTokens: MAX_TOKENS,
        refillIntervalMs: REFILL_INTERVAL_MS,
      })
    ) {
      return fail(
        429,
        "busy",
        "Rate limit exceeded. Please wait before building again.",
        { "Retry-After": "60" }
      );
    }

    // 3. Parse and validate request body
    let raw: unknown;
    try {
      raw = await request.json();
    } catch {
      return fail(400, "rejected", "Invalid request body");
    }
    const body = parseBuildRequest(raw);
    if (!body) {
      return fail(400, "rejected", "Invalid request body");
    }

    if (body.files.length === 0) {
      return fail(400, "rejected", "At least one source file is required");
    }

    // Validate total size
    const totalSize = body.files.reduce((sum, f) => sum + f.content.length, 0);
    if (totalSize > MAX_TOTAL_SIZE) {
      return fail(400, "rejected", "Total file size exceeds 500KB limit");
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
      return isAbort
        ? fail(
            504,
            "timeout",
            `Build timed out (${UPSTREAM_TIMEOUT_MS / 1000}s limit)`
          )
        : unavailable(504, null, "Failed to reach build server");
    }
    clearTimeout(timeout);

    // Classified by the same function the server grader uses.
    const answer = await readBuildServerAnswer(upstreamResponse);
    switch (answer.kind) {
      case "rejected":
        return fail(502, "rejected", answer.message);
      case "busy":
        return fail(
          502,
          "busy",
          "Build server is busy. Please try again shortly."
        );
      case "unavailable":
        return unavailable(
          502,
          answer.upstreamStatus,
          "Build server returned an error"
        );
      case "verdict":
        // The build server returns the binary inline (binary_b64); the client
        // caches it directly, so there is no server-side cache or
        // /api/deploy/:uuid route.
        return NextResponse.json({
          success: answer.verdict.success,
          stderr: answer.verdict.stderr,
          uuid: answer.verdict.uuid,
          binaryB64: answer.verdict.binary_b64,
          // Checked entry by entry in readBuildServerAnswer.
          diagnostics: answer.verdict.diagnostics,
        });
    }
  } catch (err: unknown) {
    logError({
      errorId: ERROR_IDS.BUILD_PROGRAM_FAILED,
      error: err instanceof Error ? err : new Error(String(err)),
      context: { route: "/api/build-program" },
    });
    return unavailable(500, null, "Internal server error");
  }
}
