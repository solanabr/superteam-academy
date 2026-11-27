import type { BuildResult } from "@superteam-lms/types";
import { isBuildFailureKind, type BuildFailureKind } from "./failure";

export interface BuildProgramRequest {
  files: { path: string; content: string }[];
  uuid?: string;
}

export interface BuildProgramResponse extends BuildResult {
  error?: string;
  /** Set whenever the request ended without a compiler verdict. */
  kind?: BuildFailureKind;
  /** Base64-encoded .so binary, included to avoid Cloud Run routing misses. */
  binaryB64?: string;
}

/**
 * For an answer without a `kind`: one the hosting platform produced before the
 * route could (a killed function is a body-less 504), or an older deployment.
 */
function kindFromStatus(status: number): BuildFailureKind {
  if (status === 504) return "timeout";
  if (status === 429) return "busy";
  if (status === 400 || status === 401) return "rejected";
  return "unavailable";
}

function failure(kind: BuildFailureKind, error: string): BuildProgramResponse {
  return { success: false, stderr: "", uuid: null, error, kind };
}

/**
 * Submit Solana program source files for compilation via the build server.
 * The API route proxies to the Cloud Run build server with the API key.
 * Never throws: a request that fails comes back with a `kind`.
 */
export async function buildProgram(
  request: BuildProgramRequest
): Promise<BuildProgramResponse> {
  let response: Response;
  try {
    response = await fetch("/api/build-program", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(request),
    });
  } catch {
    return failure("unavailable", "Could not reach the build service");
  }

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({}))) as Partial<BuildProgramResponse>;
    return failure(
      isBuildFailureKind(body.kind)
        ? body.kind
        : kindFromStatus(response.status),
      typeof body.error === "string"
        ? body.error
        : `Server error (${response.status})`
    );
  }

  try {
    return (await response.json()) as BuildProgramResponse;
  } catch {
    return failure("unavailable", "Unreadable build response");
  }
}
