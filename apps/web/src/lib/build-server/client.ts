import type { BuildResult } from "@superteam-lms/types";

export interface BuildProgramRequest {
  files: { path: string; content: string }[];
  uuid?: string;
}

export interface BuildProgramResponse extends BuildResult {
  error?: string;
  /** Base64-encoded .so binary, included to avoid Cloud Run routing misses. */
  binaryB64?: string;
}

/**
 * Submit Solana program source files for compilation via the build server.
 * The API route proxies to the Cloud Run build server with the API key.
 */
export async function buildProgram(
  request: BuildProgramRequest
): Promise<BuildProgramResponse> {
  const response = await fetch("/api/build-program", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const body = (await response
      .json()
      .catch(() => ({}))) as Partial<BuildProgramResponse>;
    return {
      success: false,
      stderr: "",
      uuid: null,
      error: body.error ?? `Server error (${response.status})`,
    };
  }

  return (await response.json()) as BuildProgramResponse;
}

/**
 * Get the download URL for a compiled program binary.
 * Routes through the API proxy to keep the build server URL server-only.
 */
export function getBinaryDownloadUrl(uuid: string): string {
  return `/api/deploy/${uuid}`;
}
