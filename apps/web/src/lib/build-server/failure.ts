/**
 * Why a build request ended without a compiler verdict. `/api/build-program`
 * sends one with every failure; the editor picks its copy from it.
 *
 * - `unavailable`: the build service could not be reached or answered with an
 *   error of its own.
 * - `busy`: its queue is full, or the caller is over the build rate limit.
 * - `timeout`: the build did not finish in time.
 * - `rejected`: the request itself was refused, with a message the learner can
 *   act on.
 */
export const BUILD_FAILURE_KINDS = [
  "unavailable",
  "busy",
  "rejected",
  "timeout",
] as const;

export type BuildFailureKind = (typeof BUILD_FAILURE_KINDS)[number];

/** The kinds that say nothing about the learner's code. */
export type BuildServiceFailure = Exclude<BuildFailureKind, "rejected">;

export function isBuildFailureKind(value: unknown): value is BuildFailureKind {
  return (
    typeof value === "string" &&
    (BUILD_FAILURE_KINDS as readonly string[]).includes(value)
  );
}

// --- The build server's answers ---------------------------------------------

/** The build server's 400 messages are short authored sentences. */
export const MAX_REJECTED_MESSAGE_CHARS = 500;

/** What `/build` answers with a 200 (apps/build-server `BuildResult`). */
export interface BuildServerVerdict {
  success: boolean;
  stderr: string;
  uuid: string | null;
  /** Base64-encoded .so binary, present on a successful build. */
  binary_b64?: string;
}

export type BuildServerAnswer =
  /** It compiled the program, or tried to: `success` says which. */
  | { kind: "verdict"; verdict: BuildServerVerdict }
  /** It refused the request; `message` is its own sentence, length-capped. */
  | { kind: "rejected"; message: string }
  | { kind: "busy" }
  | { kind: "unavailable"; upstreamStatus: number };

function isOptionalString(value: unknown): value is string | null | undefined {
  return value === undefined || value === null || typeof value === "string";
}

function toVerdict(body: unknown): BuildServerVerdict | null {
  if (typeof body !== "object" || body === null) return null;
  const { success, stderr, uuid, binary_b64 } = body as Record<string, unknown>;
  if (typeof success !== "boolean" || typeof stderr !== "string") return null;
  if (!isOptionalString(uuid) || !isOptionalString(binary_b64)) return null;
  return {
    success,
    stderr,
    uuid: uuid ?? null,
    ...(typeof binary_b64 === "string" ? { binary_b64 } : {}),
  };
}

/** The `error` string of the build server's JSON error body, if this is one. */
async function errorMessage(response: Response): Promise<string | null> {
  if (!response.headers.get("content-type")?.includes("application/json")) {
    return null;
  }
  try {
    const body: unknown = await response.json();
    if (typeof body !== "object" || body === null) return null;
    const message = (body as { error?: unknown }).error;
    if (typeof message !== "string") return null;
    return message.trim().slice(0, MAX_REJECTED_MESSAGE_CHARS) || null;
  } catch {
    return null;
  }
}

/**
 * Classify one answer from the build server's `/build`. The proxy route and
 * the server grader both read it through here, so the editor and the submit
 * path cannot disagree about what an answer means.
 *
 * The build server speaks for itself in three ways: a 200 carrying a build
 * result, a 400 refusing the request and a 503 for a full queue, the last two
 * as `{ "error": ... }`. A 429 is its rate limiter. Everything else, including
 * a 200 whose body is not a build result, is `unavailable`: there is no
 * verdict to trust. Only the 400's message is ever read from an error body.
 */
export async function readBuildServerAnswer(
  response: Response
): Promise<BuildServerAnswer> {
  const upstreamStatus = response.status;
  const unavailable: BuildServerAnswer = {
    kind: "unavailable",
    upstreamStatus,
  };

  if (response.ok) {
    let body: unknown;
    try {
      body = await response.json();
    } catch {
      return unavailable;
    }
    const verdict = toVerdict(body);
    return verdict ? { kind: "verdict", verdict } : unavailable;
  }

  if (upstreamStatus === 429) return { kind: "busy" };
  if (upstreamStatus === 400 || upstreamStatus === 503) {
    const message = await errorMessage(response);
    if (message === null) return unavailable;
    return upstreamStatus === 400
      ? { kind: "rejected", message }
      : { kind: "busy" };
  }
  return unavailable;
}
